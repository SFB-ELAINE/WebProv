<template>
  <div>
    <input style="display: none" ref="uploader" type="file" @change="importNodes">

    <!-- This is the main svg animation -->
    <d3
      ref="d3"
      :height="height"
      :width="width"
      :links="links"
      :nodes="nodes"
      force 
      zoomable
      arrows
      draggable
      :pan.sync="pan"
      :zoom.sync="zoom"
      hulls
      :hull-click="hullClick"
      :hull-dblclick="hullDblclick"
      :color-changes="colorChanges"
    ></d3>
    
    <!-- This is the dashed line you see when creating new links -->
    <svg
      :height="height"
      :width="width"
      style="position: absolute; top: 0; left: 0; pointer-events: none;"
    >
      <line
        :x1="lineStart ? lineStart.x : 0"
        :y1="lineStart ? lineStart.y : 0"
        :x2="lineEnd ? lineEnd.x : 0"
        :y2="lineEnd ? lineEnd.y : 0"
        stroke-dasharray="4"
        stroke="black"
      ></line>
    </svg>

    <div class="overlay">
      
      <search-card
        class="search overlay-child" 
        :items="searchItems"
        @open="expandStudy"
        @dependency="showProvenanceGraph"
      ></search-card>
      <div style="flex: 1"></div>

      <b-button
        v-if="showEditTools"
        class="clear-button overlay-child"
        type="is-text"
        @click="createStudy"
      >
        Add Study
      </b-button>
      
      <b-button
        v-if="showEditTools"
        class="clear-button overlay-child"
        type="is-text"
        @click="addNode"
      >
        Add Node
      </b-button>

      <b-button
        v-if="showEditTools"
        class="clear-button overlay-child"
        type="is-text"
        @click="stopEdit"
      >
        Exit
      </b-button>

      <div class="cards overlay-child">

        <prov-legend-card v-bind="legendProps"></prov-legend-card>
        <div class="spacer"></div>

        <study-card
          v-if="selectedStudy"
          :study="selectedStudy"
          @close="closeStudyCard"
          @delete="deleteSelectedStudy"
          @update="saveSelectedStudy"
        ></study-card>
        <div v-if="selectedStudy" class="spacer"></div>
        
        <select-card
          title="Relationship" 
          v-if="currentRelationship"
          :value="currentRelationship"
          @input="changeRelationship"
          :options="possibleRelationships"
          @close="cancelRelationshipSelection"
          @delete="deleteRelationship"
        ></select-card>
        <div class="spacer"></div>
        
        <node-form-card
          v-if="selectedNode"
          :node="selectedNode"
          :fields="selectedNodeInformation"
          :studies="studies"
          :definitions="definitions"
          @close="deselectNode"
          @delete="deleteNode"
          @update:information:delete="deleteInformationNode"
          @update:information:add="addInformationNode"
          @update:information="editInformationNode"
          @update:node="editNode"
        ></node-form-card>
      
      </div>
    </div>

    <information-modal
      v-model="showHelp"
    ></information-modal>

    <div class="version">v{{ version }}</div>

    <fab :actions="fabActions"></fab>

  </div>
</template>

<script lang="ts">
import {
  relationshipColors,
  NODE_OUTLINE,
  VALID_ENDPOINT_OUTLINE,
  INVALID_ENDPOINT_OUTLINE,
  NODE_HEIGHT,
  NODE_RADIUS,
  STUDY_STROKE,
  STUDY_WIDTH,
  SELECTED_NODE_OUTLINE,
} from '@/constants';
import {
  ProvenanceNode,
  DependencyType,
  Study,
  RelationshipInformation,
  uniqueId,
  tuple,
  TypeOf,
} from 'common';
import ProvLegendCard from '@/components/ProvLegendCard.vue';
import InformationModal from '@/components/InformationModal.vue';
import D3 from '@/components/D3.vue';
import {
  getLabel,
  addEventListeners,
  get,
  makeRequest,
  getLogger,
  HighLevelRelationship,
  HighLevelNode,
  merge,
  toTsv,
  TsvRow,
  exportData,
  importData,
  notifier,
  readFile,
} from '@/utils';
import { D3Hull, D3Node, D3Link, D3NodeColorCombo } from '@/d3';
import SearchCard from '@/components/SearchCard.vue';
import NodeFormCard from '@/components/NodeFormCard.vue';
import StudyCard from '@/components/StudyCard.vue';
import SelectCard from '@/components/SelectCard.vue';
import { SearchItem, search } from '@/search';
import * as backend from '@/backend';
import debounce from 'lodash.debounce';
import {
  DependencyRelationship,
  InformationField,
  InformationRelationship,
  RelationshipRule,
  NodeDefinition,
  Lookup,
  flat,
  isDefined,
  makeArrayLookupBy,
  makeLookup,
  makeLookupBy,
} from 'common';
import { version } from '../package.json';
import { computed, ref, onMounted, createComponent } from '@vue/composition-api';
import Fab, { FabAction } from '@/components/Fab.vue';
import { useRules, useDefinitions } from '@/hooks';

interface BaseNode extends D3Node {
  studyId?: string;
  text: string;
}

interface GroupNode extends BaseNode {
  isGroup: true;
}

interface SingleNode extends BaseNode {
  provenanceNode: ProvenanceNode;
  isGroup: false;
}

type Node = SingleNode | GroupNode;

interface Link extends D3Link {
  color: string;
}

interface Point {
  x: number;
  y: number;
}

const isSingleNode = (node: Node): node is SingleNode => {
  return !node.isGroup;
};

const logger = getLogger();

export default createComponent({
  name: 'Visualizer',
  components: {
    ProvLegendCard,
    D3,
    SearchCard,
    SelectCard,
    NodeFormCard,
    StudyCard,
    InformationModal,
    Fab,
  },
  props: {
    windowHeight: { type: Number, required: true },
    windowWidth: { type: Number, required: true },
  },
  setup(props, context) {
    const { getDefaultRelationshipType, isValidRelationship, getApplicableRules, createRelationship } = useRules();
    const { getDefinition, createModelVersionLookup, getClassification, definitions } = useDefinitions();

    // The package version number
    const provenanceNodes = ref<ProvenanceNode[]>([]);
    const informationNodes = ref<InformationField[]>([]);
    const dependencies = ref<Array<RelationshipInformation<DependencyRelationship>>>([]);
    const informationRelations = ref<Array<RelationshipInformation<InformationRelationship>>>([]);

    // which studies are currently expanded
    const expanded = ref<Lookup<boolean>>({});

    // The current nodes that are passed to D3
    const nodes = ref<Node[]>([]);
    const links = ref<Link[]>([]);

    const uploaderRef = ref<HTMLInputElement>(null);

    const legendProps = {
      nodeOutline: NODE_OUTLINE,
      nodeRadius: NODE_RADIUS,
      studyOutline: STUDY_STROKE,
    };

    // All of the nodes to show
    // If a node is in a group that isn't expanded, it will not actually be shown
    const nodesToShow = ref<Lookup<boolean>>({});

    // Used when users click the "See more" button so that new nodes aren't placed at 0, 0
    // Instead, they are initially placed at the location of the clicked node
    const pointToPlaceNode = ref({ x: 0, y: 0 });

    // Used when drawing line in edit mode
    const lineStart = ref<Point | null>(null);
    const lineEnd = ref<Point | null>(null);

    const selectedConnection = ref<HighLevelRelationship | null>(null);
    const currentRelationship = ref<DependencyType | null>(null);
    const possibleRelationships = ref<DependencyType[] | null>(null);

    // used to display information on a card
    const selectedNode = ref<ProvenanceNode | null>(null);

    const studies = ref<Study[]>([]);

    // Whether to show the help information
    const showHelp = ref(false);

    // Whether to show the help information
    const showEditTools = ref(false);

    // The current pan of the visualization
    const pan = ref({ x: 0, y: 0 });

    // The current zoom of the visualization
    const zoom = ref(1);

    interface HTMLInputEvent extends Event {
      target: HTMLInputElement & EventTarget;
    }

    const importNodes = async (e: HTMLInputEvent) => {
      const files = e.target.files;
      if (!files || files.length === 0) {
        return;
      }

      const file = files[0];
      const contents = await readFile(file);
      if (typeof contents !== 'string') {
        context.root.$notification.open({
          message: 'The chosen file was empty.',
          position: 'is-top-right',
          type: 'is-warning',
        });
        return;
      }

      const importResult = await importData(contents);
      if (importResult.type === 'error') {
        notifier.danger('An error occured during import.\n' + importResult.message);
        return;
      }

      const data = importResult.data;
      const uploadResult = await backend.upload(data);
      if (uploadResult.result === 'error') {
        notifier.danger('An error occured during the upload to the database.\n' + uploadResult.message);
        return;
      }

      notifier.info('Successfully uploaded data to the database. Please refresh the page.');
    };

    const exportNodes = () => {
      // OK so we ONLY want to export data that is on the screen
      // This (unfortunently a bit complicated) filters accomplish this task

      const provenanceNodesForExport = provenanceNodes.value.filter((node) => {
        return nodesToShow.value.hasOwnProperty(node.id);
      });

      const dependenciesForExport = dependencies.value.filter((dependency) => {
        return (
          nodesToShow.value.hasOwnProperty(dependency.source) &&
          nodesToShow.value.hasOwnProperty(dependency.target)
        );
      });

      const informationRelationshipsForExport = informationRelations.value.filter((informationRelation) => {
        return nodesToShow.value.hasOwnProperty(informationRelation.source);
      });

      const informationFieldsForExportIds = new Set(
        informationRelationshipsForExport.map((informatinoRelationship) => informatinoRelationship.target),
      );

      const informationFieldsForExport = informationNodes.value.filter((informationField) => {
        return informationFieldsForExportIds.has(informationField.id);
      });

      const studyIdsForExport = new Set(
        provenanceNodesForExport.map((provenanceNode) => provenanceNode.studyId).filter(isDefined),
      );

      const studiesForExport = studies.value.filter((study) => {
        return studyIdsForExport.has(study.id);
      });

      exportData({
        provenanceNodes: provenanceNodesForExport,
        informationFields: informationFieldsForExport,
        informationRelationships: informationRelationshipsForExport,
        dependencyRelationships: dependenciesForExport,
        studies: studiesForExport,
      });
    };

    const fabActions: FabAction[] = [
      {
        name: 'Clear Nodes',
        icon: 'clear_all',
        callback: () => {
          nodesToShow.value = {};
          renderGraph();
        },
      },
      {
        name: 'Export Graph as JSON',
        icon: 'cloud_download',
        callback: exportNodes,
      },
      {
        name: 'Import Graph from JSON',
        icon: 'cloud_upload',
        callback: () => {
          if (uploaderRef.value) {
            uploaderRef.value.click();
          }
        },
      },
      {
        name: 'Show Help',
        icon: 'info',
        callback: () => {
          showHelp.value = true;
        },
      },
      {
        name: 'Show Editor Tools',
        icon: 'edit',
        callback: () => {
          showEditTools.value = true;
        },
      },
    ];

    // The selected study. This is set automatically when a new study is created or it can be opened from the search.
    const selectedStudy = ref<Study | null>(null);

    const debouncedRenderGraph = debounce(renderGraph, 500);
    const debouncedUpdateOrCreateNode = debounce((node: ProvenanceNode) => {
      return makeRequest(() => backend.updateOrCreateNode(node));
    }, 500);

    const debouncedUpdateOrCreateStudy = debounce((study: Study) => {
      return makeRequest(() => backend.updateOrCreateStudy(study));
    }, 500);

    const debouncedUpdateOrCreateInformationNode = debounce((field: InformationField) => {
      return makeRequest(() => backend.updateOrCreateInformationNode(field));
    }, 500);

    // Used to change the color of individual nodes without having to re-render the whole graph
    const colorChanges = ref<D3NodeColorCombo[]>([]);

    const height = computed(() => {
      // OK, so for some reason we have to remove 7 here so that there is no overlow
      return props.windowHeight - 7;
    });

    const width = computed(() => {
      return props.windowWidth;
    });

    const nodeLookup = computed(() => {
      return makeLookup(nodes.value);
    });

    const selectedNodeInformation = computed(() => {
      if (!selectedNode.value) {
        return;
      }

      const relationships = getInformationRelationship(selectedNode.value.id);
      logger.debug(`There are ${relationships.length} information fields for the selected node`);
      return relationships.map((relationship) => getInformationNode(relationship.target)).filter(isDefined);
    });

    const highLevelNodes = computed((): HighLevelNode[] => {
      const lookup: Lookup<HighLevelNode> = {};
      provenanceNodes.value.forEach((node) => {
        lookup[node.id] = {
          id: node.id,
          node,
          incoming: [],
          outgoing: [],
        };
      });

      provenanceNodes.value.forEach((n) => {
        const sourceId = n.id;

        const source = lookup[sourceId];
        const connections = getConnections(sourceId);
        if (!connections) {
          return;
        }

        connections.forEach((connection) => {
          const targetId = connection.target;
          const target: HighLevelNode | undefined = lookup[targetId];
          if (!target) {
            context.root.$notification.open({
              duration: 10000,
              message: `Connection target not found: ${sourceId} -> ${targetId}`,
              position: 'is-top-right',
              type: 'is-warning',
            });
            return;
          }

          const d3Connection: HighLevelRelationship = {
            relationship: connection.properties,
            color: relationshipColors[connection.properties.type].color,
            source,
            target,
          };

          source.outgoing.push(d3Connection);
          target.incoming.push(d3Connection);
        });
      });

      return Object.values(lookup);
    });

    const highLevelNodeLookup = computed(() => {
      return makeLookup(highLevelNodes.value);
    });

    const studyLookup = computed(() => {
      return makeLookupBy(studies.value, (study) => study.id);
    });

    const dependenciesLookup = computed(() => {
      return makeArrayLookupBy(dependencies.value, (d) => d.source);
    });

    const informationLookup = computed(() => {
      return makeArrayLookupBy(informationRelations.value, (i) => i.source);
    });

    const informationNodeLookup = computed(() => {
      return makeLookup(informationNodes.value);
    });

    // lookup by studyId
    const sortedHighLevelNodes = computed(() => {
      const allNodes: { [studyId: string]: HighLevelNode[] } = {};
      highLevelNodes.value.forEach((highLevelNode) => {
        const studyId = highLevelNode.node.studyId;
        if (studyId === undefined) {
          return;
        }

        if (!allNodes[studyId]) {
          allNodes[studyId] = [];
        }

        allNodes[studyId].push(highLevelNode);
      });

      return Object.values(allNodes);
    });

    const modelVersionLookup = computed(() => {
      const lookups = sortedHighLevelNodes.value.map(createModelVersionLookup);
      // Since the IDs are used as keys, there will be no clashing when we merge objects
      return merge(lookups);
    });

    function getConnections(id: string) {
      if (!dependenciesLookup.value[id]) {
        return undefined;
      }
      return dependenciesLookup.value[id];
    }

    function getInformationNode(id: string) {
      if (!informationNodeLookup.value[id]) {
        return undefined;
      }

      return informationNodeLookup.value[id];
    }

    function getInformationRelationship(id: string) {
      if (!informationLookup.value[id]) {
        return [];
      }

      return informationLookup.value[id];
    }

    function getInformationNodesFromProvenance(node: ProvenanceNode) {
      const relationships = getInformationRelationship(node.id);
      return relationships
        .map((relationship) => getInformationNode(relationship.target))
        .filter(isDefined);
    }

    function showProvenanceGraph(r: SearchItem) {
      const showNode = (id: string) => {
        if (highLevelNodeLookup.value[id] === undefined) {
          return;
        }

        nodesToShow.value[id] = true;
        const info = highLevelNodeLookup.value[id];
        if (info.node.studyId !== undefined) {
          expanded.value[info.node.studyId] = true;
        }

        info.outgoing.forEach((c) => {
          showNode(c.target.id);
        });
      };

      if (highLevelNodeLookup.value[r.id] === undefined) {
        context.root.$notification.open({
          message: 'This node does not exist.',
          position: 'is-top-right',
          type: 'is-warning',
        });

        return;
      }

      showNode(r.id);
      renderGraph();
    }

    function closeStudyCard() {
      selectedStudy.value = null;
    }

    async function saveSelectedStudy() {
      if (!selectedStudy.value) {
        return;
      }

      const study = selectedStudy.value;
      debouncedUpdateOrCreateStudy(study);
    }

    async function deleteSelectedStudy() {
      if (!selectedStudy.value) {
        return;
      }

      const study = selectedStudy.value;
      const result = await makeRequest(() => backend.deleteStudy(study.id));
      if (result.result === 'success') {
        selectedStudy.value = null;
        const i = studies.value.indexOf(study);
        studies.value.splice(i, 1);
      }
    }

    function expandStudy(result: SearchItem) {
      const studyId = result.study ? result.study.id : undefined;
      if (studyId !== undefined) {
        expanded.value[studyId] = true;
      }

      highLevelNodes.value.forEach(({ node, id }) => {
        // If the node isn't in a study, then ONLY show that single node
        if (
          (studyId !== undefined && node.studyId === studyId) ||
          (studyId === undefined && node.id === result.id)
        ) {
          nodesToShow.value[id] = true;
        }
      });

      renderGraph();
    }

    const searchItems = computed(() => {
      return highLevelNodes.value.map((n): SearchItem => {
        const fields = getInformationNodesFromProvenance(n.node);
        const values = fields.filter(isDefined).map((field) => field.value);

        const study = n.node.studyId ? studyLookup.value[n.node.studyId] : undefined;
        return {
          id: n.id,
          title: getLabel(n.node, getDefinition(n.node), studyLookup.value, modelVersionLookup.value),
          study,
          extra: values,
        };
      });
    });

    async function createStudy() {
      selectedStudy.value = {
        id: uniqueId(),
      };

      studies.value.push(selectedStudy.value);
    }

    function nodeRightClick(e: MouseEvent, node: SingleNode) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const setCenter = () => {
        lineStart.value = {
          x: pan.value.x + (node.x + node.width / 2) * zoom.value,
          y: pan.value.y + (node.y + node.height / 2) * zoom.value,
        };
      };

      colorChanges.value.push({ node, color: VALID_ENDPOINT_OUTLINE });

      // Get all nodes that contain the given point
      const getNodesInRange = (point: MouseEvent) => {
        return nodes.value
          .filter(isSingleNode) // we can't make connections to group nodes
          .filter((n) => {
            const ul = {
              x: n.x * zoom.value + pan.value.x,
              y: n.y * zoom.value + pan.value.y,
            }; // upper left corner

            const lr = {
              x: ul.x + n.width,
              y: ul.y + n.height,
            }; // lower right corner
            return n !== node && point.x > ul.x && point.y > ul.y && lr.x > point.x && lr.y > point.y;
          });
      };

      const getRelationship = (a: ProvenanceNode, b: ProvenanceNode) => {
        return getDefaultRelationshipType(a, b);
      };


      let targetNode: SingleNode | null = null;
      const disposer = addEventListeners({
        mousemove: (ev: MouseEvent) => {
          lineEnd.value = ev;
          setCenter();
          const nodesInRange = getNodesInRange(ev);

          // reset the color of the previously selected node
          // FIXME this will cause a bug if the node was initially colored something else
          if (targetNode) {
            colorChanges.value.push({ node: targetNode, color: NODE_OUTLINE });
            targetNode = null;
          }

          if (nodesInRange.length === 0) {
            return;
          }

          const top = targetNode = nodesInRange[nodesInRange.length - 1];
          const a = node.provenanceNode;
          const b = top.provenanceNode;

          const relationship = getRelationship(a, b);
          const valid = isValidRelationship(a, b, relationship);
          const color = valid ? VALID_ENDPOINT_OUTLINE : INVALID_ENDPOINT_OUTLINE;
          colorChanges.value.push({ node: targetNode, color });
        },
        mouseup: async (ev: MouseEvent) => {
          if (ev.which !== 3) {
            return;
          }

          disposer.dispose();
          lineStart.value = null;
          lineEnd.value = null;

          colorChanges.value.push({ node, color: NODE_OUTLINE });
          if (targetNode) {
            colorChanges.value.push({ node: targetNode, color: NODE_OUTLINE });
          }

          const nodesInRange = getNodesInRange(ev);
          if (nodesInRange.length === 0) {
            return;
          }

          const nodeToMakeConnection = nodesInRange[nodesInRange.length - 1];
          const a = node.provenanceNode;
          const b = nodeToMakeConnection.provenanceNode;
          const relationship = getRelationship(a, b);

          const connection = createRelationship(a, b, relationship);
          if (!connection.can) {
            return;
          }

          const result = await makeRequest(() => backend.updateOrCreateDependency(connection.connection));
          if (result.result !== 'success') {
            return;
          }

          dependencies.value.push(connection.connection);
          renderGraph();
        },
      });
    }

    function createNewNode(n: ProvenanceNode): SingleNode {
      const sourceId = n.id;

      const source = highLevelNodeLookup.value[sourceId];
      const moreLeftToShow = source.incoming.some((connection) => {
        return !nodesToShow.value[connection.source.id];
      }) || source.outgoing.some((connection) => {
        return !nodesToShow.value[connection.target.id];
      });

      const text = getLabel(n, getDefinition(n), studyLookup.value, modelVersionLookup.value);
      const { x, y } = nodeLookup.value[sourceId] ? nodeLookup.value[sourceId] : pointToPlaceNode.value;
      const node: SingleNode = {
        isGroup: false,
        id: sourceId,
        text,
        actionText: moreLeftToShow ? 'See more' : undefined,
        studyId: n.studyId,
        hullId: n.studyId,
        stroke: NODE_OUTLINE,
        x,
        y,
        vx: 0,
        vy: 0,
        index: 0,
        provenanceNode: n,
        rx: getClassification(n) === 'entity' ? 10 : 0,
        // width and height are essential
        // FIXME add requirement to type file
        // they are used in the other js files
        // ALSO, * 8 just kinda works well and 10 is the padding
        width: text.length * 8 + 10,
        height: NODE_HEIGHT,
        onDidRightClick: (e: MouseEvent) => {
          nodeRightClick(e, node);
        },
        onDidMousedown: (e: MouseEvent) => {
          // Stop the pan/zoom tool from panning when the user clicks on a node
          e.stopPropagation();
        },
        onDidClick: (e: MouseEvent) => {
          colorChanges.value.push({ node, color: SELECTED_NODE_OUTLINE });

          if (selectedNode.value) {
            const selected = nodeLookup.value[selectedNode.value.id];
            if (selected && !selected.isGroup) {
              colorChanges.value.push({ node: selected, color: NODE_OUTLINE });
            }
          }

          if (selectedNode.value === n) {
            selectedNode.value = null;
          } else {
            selectedNode.value = n;
          }
        },
        onDidActionClick: (e) => {
          // Stop propagation so that the onDidClick event above is not fired
          e.stopPropagation();

          const highLevel = highLevelNodeLookup.value[node.id];

          // Show all incoming connections
          highLevel.incoming.forEach((connection) => {
            nodesToShow.value[connection.source.id] = true;
          });

          // And show all outgoing connections
          highLevel.outgoing.forEach((connection) => {
            nodesToShow.value[connection.target.id] = true;
          });

          pointToPlaceNode.value = node;
          renderGraph();
        },
      };

      return node;
    }

    function renderGraph() {
      // We need to label the collapsed studies somehow
      // So, we keep a counter and label studies `S1`, `S2` and so on
      const labelLookup: Lookup<string> = {};
      let groupCount = 1;

      const newLinks: Link[] = [];
      const newNodes: Node[] = [];
      const collapsedNodes: { [studyId: string]: GroupNode } = {};

      // We don't care about any nodes that don't need to be shown.
      const filtered = provenanceNodes.value.filter((n) => nodesToShow.value[n.id]);

      let studyIds = filtered.map((n) => n.studyId).filter(isDefined);
      studyIds = Array.from(new Set(studyIds)); // get all unique study IDs

      // Remove studies that are expanded
      studyIds = studyIds.filter((studyId) => !expanded.value[studyId]);

      // First, create all of the study nodes.
      // These are the collapsed nodes. We only need to create one per study.
      studyIds.forEach((studyId) => {
        if (!labelLookup.hasOwnProperty(studyId)) {
          labelLookup[studyId] = `S${groupCount++}`;
        }

        // So every node needs a unique ID. The nodes stored in the database all have a unique ID but collapsed
        // nodes to not have this attribute. Therefore, we generate a unique ID based off the studyId. This also allows
        // us to easily lookup the location of the collapsed node when re-rendering.
        const id = '' + studyId;
        const point = nodeLookup.value[id] ? nodeLookup.value[id] : pointToPlaceNode.value;
        const node: GroupNode = {
          x: point.x,
          y: point.y,
          isGroup: true,
          studyId,
          id,
          index: 0,
          vx: 0,
          vy: 0,
          stroke: STUDY_STROKE,
          rx: 0,
          text: labelLookup[studyId],
          width: STUDY_WIDTH,
          height: NODE_HEIGHT,
          onDidDblclick: () => {
            expanded.value[studyId] = true;
            pointToPlaceNode.value = node;
            renderGraph();
          },
        };

        collapsedNodes[studyId] = node;
        newNodes.push(node);
      });

      filtered.forEach((n) => {
        const sourceId = n.id;

        const info = highLevelNodeLookup.value[sourceId];
        info.outgoing.forEach((c) => {
          const targetId = c.target.id;

          if (!nodesToShow.value[targetId]) {
            return;
          }

          const determineLinkId = (id: string, studyId: string | undefined) => {
            if (studyId === undefined || expanded.value[studyId]) {
              return id;
            }

            return collapsedNodes[studyId].id;
          };

          const source = determineLinkId(sourceId, c.source.node.studyId);
          const target = determineLinkId(targetId, c.target.node.studyId);

          // This happens for nodes in the same strudy when the study hasn't been expanded
          if (target === source) {
            return;
          }

          const link: Link = {
            source,
            target,
            color: c.color,
            onDidMousedown: (e: MouseEvent) => {
              e.stopImmediatePropagation();
            },
            onDidClick: (e) => {
              if (selectedConnection.value === c) {
                cancelRelationshipSelection();
                return;
              }

              selectedConnection.value = c;
              currentRelationship.value = c.relationship.type;

              const a = c.source.node;
              const b = c.target.node;
              possibleRelationships.value = flat(getApplicableRules(a, b).map((rule) => rule.type));
            },
          };

          newLinks.push(link);
        });
      });

      filtered.forEach((n) => {
        // don't add nodes that are in a study that isn't expanded
        if (n.studyId !== undefined && !expanded.value[n.studyId]) {
          return;
        }

        newNodes.push(createNewNode(n));
      });

      // Make sure to reset this since we are done rendering
      pointToPlaceNode.value = { x: 0, y: 0 };

      // This needs to happen at the end since we use the position information of the nodes
      // If we reset at the beginning, that information wouldn't be there
      nodes.value = newNodes;
      links.value = newLinks;
    }

    async function addNode() {
      if (definitions.value.length === 0) {
        context.root.$notification.open({
          message: 'No definitions found. Unable to create new node.',
          position: 'is-top-right',
          type: 'is-warning',
        });
        return;
      }

      const node: ProvenanceNode = {
        id: uniqueId(),
        definitionId: definitions.value[0].id,
      };

      const result = await makeRequest(() => backend.updateOrCreateNode(node));
      if (result.result !== 'success') {
        return;
      }

      provenanceNodes.value.push(node);
      selectedNode.value = node;

      nodesToShow.value[node.id] = true;
      renderGraph();
    }

    function cancelRelationshipSelection() {
      selectedConnection.value = null;
      currentRelationship.value = null;
      possibleRelationships.value = null;
    }

    async function changeRelationship(relationship: DependencyType) {
      if (!selectedConnection.value) {
        return;
      }

      const connection = selectedConnection.value;
      const originalConnection = connection.relationship;

      const a = selectedConnection.value.source.node;
      const b = selectedConnection.value.target.node;

      const copy = { ...originalConnection };
      copy.type = relationship;

      const result = await makeRequest(() => backend.updateOrCreateDependency({
        source: connection.source.id,
        target: connection.target.id,
        properties: copy,
      }), () => {
        // This feels a bit messy
        // Set the relationship
        // Set the relationship of the actual data
        // Then render the graph again
        currentRelationship.value = relationship;
        originalConnection.type = relationship;

        renderGraph();
        cancelRelationshipSelection();
      });
    }

    async function deleteRelationship() {
      if (!selectedConnection.value) {
        return;
      }

      const connection = selectedConnection.value;
      const result = await makeRequest(() => backend.deleteDependency(connection.relationship.id));
      if (result.result !== 'success') {
        return;
      }

      dependencies.value = dependencies.value.filter((dependency) => {
        return dependency.properties.id !== connection.relationship.id;
      });

      renderGraph();
      cancelRelationshipSelection();
    }

    function deselectNode() {
      selectedNode.value = null;
    }

    async function deleteNode() {
      if (!selectedNode.value) {
        return;
      }

      const selected = selectedNode.value;

      // This request will delete all of the dependency relationships
      // It will also delete information relationships and nodes
      const result = await makeRequest(() => backend.deleteNode(selected.id));
      if (result.result !== 'success') {
        return;
      }

      // We have to delte the same data that the backend deletes
      provenanceNodes.value = provenanceNodes.value.filter((n) => {
        return n.id !== selected.id;
      });

      const nodeIds = new Set(provenanceNodes.value.map(({ id }) => id));
      dependencies.value = dependencies.value.filter((dependency) => {
        return nodeIds.has(dependency.target) && nodeIds.has(dependency.source);
      });

      informationRelations.value = informationRelations.value.filter((node) => {
        return nodeIds.has(node.source);
      });

      const informationNodeIds = new Set(informationRelations.value.map(({ target }) => target));
      informationNodes.value = informationNodes.value.filter((node) => {
        return informationNodeIds.has(node.id);
      });

      selectedNode.value = null;
      renderGraph();
    }

    async function validateConnections(node: ProvenanceNode) {
      // Here we are revalidating all of the connections to see if they are still valid
      // If the type of node changed, they may no longer be valid
      const { outgoing, incoming } = highLevelNodeLookup.value[node.id];
      const toRemove = new Set<string>();

      [...incoming, ...outgoing].forEach((c) => {
        if (isValidRelationship(c.source.node, c.target.node, c.relationship.type)) {
          return;
        }

        toRemove.add(c.relationship.id);
      });

      if (toRemove.size === 0) {
        return;
      }

      for (const id of toRemove) {
        logger.info('Deleting dependency: ' + id);
        makeRequest(() => backend.deleteDependency(id));
      }

      dependencies.value = dependencies.value.filter((dependency) => {
        return !toRemove.has(dependency.properties.id);
      });

      debouncedRenderGraph();
    }

    async function deleteInformationNode(node: InformationField) {
      const result = await makeRequest(() => backend.deleteInformationNode(node.id));
      if (result.result !== 'success') {
        return;
      }

      informationNodes.value = informationNodes.value.filter((n) => n.id !== node.id);
      informationRelations.value = informationRelations.value.filter((n) => n.target !== node.id);
      debouncedRenderGraph();
    }

    async function addInformationNode(node: InformationField) {
      if (!selectedNode.value) {
        return;
      }

      const relationship = {
        source: selectedNode.value.id,
        target: node.id,
        properties: {
          id: uniqueId(),
        },
      };

      logger.info('Creating new information node and relationship: ' + node.id);
      const result = await makeRequest(() => backend.addInformationEntry(relationship, node));
      if (result.result !== 'success') {
        return;
      }

      informationRelations.value.push(relationship);
      informationNodes.value.push(node);
      debouncedRenderGraph();
    }

    async function editInformationNode<K extends keyof InformationField>(
      node: InformationField, key: K, newValue: InformationField[K],
    ) {
      node[key] = newValue;
      debouncedUpdateOrCreateInformationNode(node);
      debouncedRenderGraph();
    }

    function editNode<K extends keyof ProvenanceNode>(node: ProvenanceNode, key: K, newValue: ProvenanceNode[K]) {
      node[key] = newValue;
      debouncedUpdateOrCreateNode(node);
      debouncedRenderGraph();

      // Only validate the connections if the type of node changed.
      if (key === 'definitionId') {
        validateConnections(node);
      }
    }

    onMounted(() => {
      makeRequest(backend.getStudies, (result) => {
        studies.value = result.items;
      });

      makeRequest(backend.getNodes, (result) => {
        provenanceNodes.value = result.items;
      });

      makeRequest(backend.getNodeDependencies, (result) => {
        dependencies.value = result.items;
      });

      makeRequest(backend.getNodeInformation, (result) => {
        informationRelations.value = result.items;
      });

      makeRequest(backend.getInformationNodes, (result) => {
        informationNodes.value = result.items;
      });
    });

    return {
      definitions,
      dependencies,
      version,
      showHelp,
      showEditTools,
      height,
      width,
      links,
      currentRelationship,
      nodes,
      lineStart,
      lineEnd,
      pan,
      zoom,
      fabActions,
      searchItems,
      expandStudy,
      legendProps,
      showProvenanceGraph,
      stopEdit: () => {
        showEditTools.value = false;
      },
      hullClick: (d: D3Hull) => {
        if (studyLookup.value[d.id] === undefined) {
          context.root.$notification.open({
            message: 'No study exists in the database for this group.',
            position: 'is-top-right',
            type: 'is-warning',
          });

          return;
        }

        if (selectedStudy.value && selectedStudy.value.id === d.id) {
          selectedStudy.value = null;
        } else {
          selectedStudy.value = studyLookup.value[d.id];
        }
      },
      hullDblclick: (d: D3Hull) => {
        expanded.value[d.id] = false;

        const point = { x: 0, y: 0 };
        d.nodes.forEach((n) => {
          point.x += n.x;
          point.y += n.y;
        });

        // Place the new node at the center of all of the nodes its consumming
        point.x /= d.nodes.length;
        point.y /= d.nodes.length;

        pointToPlaceNode.value = point;

        renderGraph();
      },
      colorChanges,
      createStudy,
      addNode,
      selectedStudy,
      closeStudyCard,
      deleteSelectedStudy,
      saveSelectedStudy,
      selectedNode,
      selectedNodeInformation,
      deselectNode,
      deleteNode,
      deleteInformationNode,
      addInformationNode,
      editInformationNode,
      editNode,
      changeRelationship,
      possibleRelationships,
      cancelRelationshipSelection,
      deleteRelationship,
      studies,
      importNodes,
      uploader: uploaderRef,
    };
  },
});
</script>

<style lang="scss" scoped>
.cards {
  width: 350px;
  max-height: 100vh;
  overflow-y: auto;
  padding: 20px 1px;
}

.search {
  width: 450px;
  // 40 px for margin/padding and 60px for the information button
  max-height: calc(100vh - 100px);
}

.spacer {
  margin: 10px 0;
}

.overlay {
  position: absolute;
  margin: 0 20px;

  // So that the overlay overlays everything else
  z-index: 5;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-start;
  pointer-events: none;
}

.overlay-child {
  pointer-events: auto;
}

.overlay-child:not(.cards) {
  margin-top: 20px;
}

.clear-button {
  margin: 0 10px;
}

.version {
  position: absolute;
  left: 25px;
  bottom: 15px;
  color: rgba(0, 0, 0, 0.5);
}
</style>
