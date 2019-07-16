<template>
  <div>
    <!-- This is the main svg animation -->
    <d3
      ref="d3"
      :height="height"
      :width="width"
      :links="links"
      :nodes="nodes"
      force 
      arrows
      drag
      hulls
      :hull-dblclick="hullDblclick"
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
      
      <search
        class="search overlay-child" 
        :items="searchItems"
        @open="openResult"
        @dependency="showProvenanceGraph"
        @open-model="openModel"
      ></search>
      <div style="flex: 1"></div>

      <b-button
        class="clear-button overlay-child"
        type="is-text"
        @click="addModel"
      >
        Add Model
      </b-button>
      
      <b-button
        class="clear-button overlay-child"
        type="is-text"
        @click="addNode"
      >
        Add Node
      </b-button>
      
      <b-button
        class="clear-button overlay-child"
        type="is-text"
        @click="renderGraph"
      >
        Refresh
      </b-button>

      <b-button
        class="clear-button overlay-child"
        type="is-text"
        @click="clearNodes"
      >
        Clear
      </b-button>

      <div class="cards overlay-child">

        <prov-legend v-bind="legendProps"></prov-legend>
        <div class="spacer"></div>

        <models-card
          v-if="selectedModel"
          :model="selectedModel"
          @cancel="cancelSelectedModel"
          @delete="deleteSelectedModel"
          @save="saveSelectedModel"
        ></models-card>
        <div v-if="selectedModel" class="spacer"></div>
        
        <card-select
          title="Relationship" 
          v-if="currentRelationship"
          :value="currentRelationship"
          @input="changeRelationship"
          :options="possibleRelationships"
          @close="cancelRelationshipSelection"
          @delete="deleteRelationship"
        ></card-select>
        <div class="spacer"></div>
        
        <form-card
          title="Node Information"
          v-if="selectedNode"
          :fields="nodeFields[selectedNode.type]"
          :node="selectedNode"
          @close="deselectNode"
          @delete="deleteNode"
          @input="onNodeChange"
        ></form-card>
      
      </div>
    </div>

    <b-button
      rounded
      type="is-text"
      style="position: absolute; left: 20px; bottom: 20px"
      @click="openHelp"
    >
      <b-icon icon="information-outline"></b-icon>
    </b-button>

    <information-modal
      v-model="showHelp"
    ></information-modal>

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
  MODEL_STROKE,
  MODEL_WIDTH,
  SELECTED_NODE_OUTLINE,
} from '@/constants';
import {
  ProvenanceNodeType,
  ProvenanceNode,
  relationshipRules,
  ProvenanceNodeRelationships,
  provenanceNodeTypes,
  SimulationStudy,
  DependsRelationship,
  RelationshipBasics,
  uniqueId,
  TypeOf,
} from 'common';
import ProvLegend from '@/components/ProvLegend.vue';
import InformationModal from '@/components/InformationModal.vue';
import D3 from '@/components/D3.vue';
import {
  Lookup,
  getText,
  makeLookup,
  once,
  addEventListeners,
  makeConnection,
  isValidConnection,
  Watch,
  getDefaultRelationshipType,
  nodeFields,
  FieldInformation,
  get,
  makeRequest,
  makeLookupBy,
  makeArrayLookupBy,
} from '@/utils';
import { D3Hull, D3Node, D3Link } from '@/d3';
import Search from '@/components/Search.vue';
import FormCard from '@/components/FormCard.vue';
import ModelsCard from '@/components/ModelsCard.vue';
import CardSelect from '@/components/CardSelect.vue';
import { SearchItem, search } from '@/search';
import { Component, Vue, Mixins, Prop } from 'vue-property-decorator';
import * as backend from '@/backend';
import debounce from 'lodash.debounce';
import { Depends, Information, HasInformation } from 'common/dist/schemas';

interface BaseNode extends D3Node {
  model?: number;
  text: string;
}

interface GroupNode extends BaseNode {
  isGroup: true;
}

interface SingleNode extends BaseNode {
  provenanceNode: ProvenanceNode;
  isGroup: false;
  type: ProvenanceNodeType;
}

type Node = SingleNode | GroupNode;

interface Link extends D3Link {
  color: string;
}

interface Connection {
  id: string;
  relationship: ProvenanceNodeRelationships;
  original: RelationshipBasics<Depends>; // TODO is this sufficient?
  source: HighLevelNode;
  target: HighLevelNode;
  color: string;
}

interface HighLevelNode {
  id: string;
  information: Array<[string, string]>;
  node: ProvenanceNode;
  outgoing: Connection[];
  incoming: Connection[];
}

interface Point {
  x: number;
  y: number;
}

export type RelationshipCache = {
  [A in ProvenanceNodeType]?: {
    [B in ProvenanceNodeType]?: ProvenanceNodeRelationships;
  };
};

const isSingleNode = (node: Node): node is SingleNode => {
  return !node.isGroup;
};

// Some important information
// 1. The wet lab data that does not come from a specific publication should appear in all of
// the models that use that data.

@Component({
  components: { ProvLegend, D3, Search, CardSelect, FormCard, ModelsCard, InformationModal },
})
export default class Visualizer extends Vue {
  @Prop({ type: Number, required: true }) public windowHeight!: number;
  @Prop({ type: Number, required: true }) public windowWidth!: number;

  public provenanceNodes: ProvenanceNode[] = [];

  public informationNodes: Information[] = [];
  public dependencies: Array<RelationshipBasics<Depends>> = [];
  public information: Array<{ source: string, target: string, properties: HasInformation }> = [];

  // which models are currently expanded
  public expanded: Lookup<boolean> = {};

  // The current nodes that are passed to D3
  public nodes: Node[] = [];
  public links: Link[] = [];

  public legendProps = { nodeOutline: NODE_OUTLINE, nodeRadius: NODE_RADIUS };

  // All of the nodes to show
  // If a node is in a group that isn't expanded, it will not actually be shown
  public nodesToShow: Lookup<boolean> = {};

  // Used when users click the "See more" button so that new nodes aren't placed at 0, 0
  // Instead, they are initially placed at the location of the clicked node
  public pointToPlaceNode = { x: 0, y: 0 };

  // Used when drawing line in edit mode
  public lineStart: Point | null = null;
  public lineEnd: Point | null = null;

  public selectedConnection: Connection | null = null;
  public currentRelationship: ProvenanceNodeRelationships | null = null;
  public possibleRelationships: ProvenanceNodeRelationships[] | null = null;

  // used to display information on a card
  public selectedNode: ProvenanceNode | null = null;

  // This lookup is used to cache selected connections
  // When a user change the type of relationship, new relatinoships that are created
  // will be of the cached type.
  public cachedConnections: RelationshipCache = {};

  public nodeFields = nodeFields;
  public models: SimulationStudy[] = [];

  // Whether to show the help information
  public showHelp = false;

  // The selected model. This is set automatically when a new model is created or it can be opened from the search.
  public selectedModel: SimulationStudy | null = null;

  // Used so find group IDs for group nodes that have already been created.
  // We don't want to use a different ID every time we render.
  public savedGroupIds: Lookup<string> = {};

  public $refs!: {
    d3: D3<SingleNode>;
  };

  public debouncedRenderGraph = debounce(this.renderGraph, 500);

  get height() {
    // OK, so for some reason we have to remove 7 here so that there is no overlow
    return this.windowHeight - 7;
  }

  get width() {
    return this.windowWidth;
  }

  get nodeLookup() {
    return makeLookup(this.nodes);
  }

  get highLevelNodes(): HighLevelNode[] {
    const nodeLookup: Lookup<HighLevelNode> = {};
    this.provenanceNodes.forEach((node) => {
      nodeLookup[node.id] = {
        id: node.id,
        information: [],
        node,
        incoming: [],
        outgoing: [],
      };
    });

    this.provenanceNodes.forEach((n) => {
      const sourceId = n.id;

      const source = nodeLookup[sourceId];
      const connections = this.getConnections(sourceId);
      if (!connections) {
        return;
      }

      connections.forEach((connection) => {
        const targetId = connection.target;
        const target: HighLevelNode | undefined = nodeLookup[targetId];
        if (!target) {
          this.$notification.open({
            duration: 10000,
            message: `Connection target not found: ${n.type}(${sourceId}) => ${targetId}`,
            position: 'is-bottom-right',
            type: 'is-warning',
          });
          return;
        }

        const d3Connection: Connection = {
          id: connection.properties.id,
          relationship: connection.properties.type,
          original: connection,
          color: relationshipColors[connection.properties.type].color,
          source,
          target,
        };

        source.outgoing.push(d3Connection);
        target.incoming.push(d3Connection);
      });
    });

    return Object.values(nodeLookup);
  }

  get highLevelNodeLookup() {
    return makeLookup(this.highLevelNodes);
  }

  get simulationStudyLookup() {
    return makeLookupBy(this.models, (study) => study.studyId);
  }

  public openHelp() {
    this.showHelp = true;
  }

  get dependenciesLookup() {
    return makeArrayLookupBy(this.dependencies, (d) => d.source);
  }

  get informationLookup() {
    return makeArrayLookupBy(this.information, (i) => i.source);
  }

  public getConnections(id: string) {
    if (!this.dependenciesLookup[id]) {
      return undefined;
    }
    return this.dependenciesLookup[id];
  }

  public getInformation(id: string) {
    if (!this.informationLookup[id]) {
      return undefined;
    }

    return this.informationLookup[id];
  }

  public showProvenanceGraph(r: SearchItem) {
    // Reset every time this function is called
    this.nodesToShow = {};

    const showNode = (id: string) => {
      this.nodesToShow[id] = true;
      const info = this.highLevelNodeLookup[id];
      if (info.node.studyId !== undefined) {
        this.expanded[info.node.studyId] = true;
      }

      info.outgoing.forEach((c) => {
        showNode(c.target.id);
      });
    };

    showNode(r.id);
    this.renderGraph();
  }

  public cancelSelectedModel() {
    this.selectedModel = null;
  }

  public saveSelectedModel() {
    if (!this.selectedModel) {
      return;
    }

    const model = this.selectedModel;
    makeRequest(() => backend.updateOrCreateModel(model, ['id', 'source', 'signalingPathway']));
  }

  public deleteSelectedModel() {
    if (!this.selectedModel) {
      return;
    }

    const model = this.selectedModel;
    makeRequest(() => backend.deleteModel(model.id));
  }

  public openModel(result: SearchItem) {
    if (result.studyId === undefined) {
      this.$notification.open({
        message: 'Please assign a model first.',
      });

      this.$notification.open({
        message: 'Please assign a model first.',
        position: 'is-bottom-right',
        type: 'is-warning',
      });

      return;
    }

    this.selectedModel = this.simulationStudyLookup[result.studyId];
  }

  public clearNodes() {
    this.nodesToShow = {};
    this.renderGraph();
  }

  public openResult(result: SearchItem) {
    // Reset every time this function is called.
    this.nodesToShow = {};

    if (result.studyId !== undefined) {
      this.expanded[result.studyId] = true;
    }

    this.highLevelNodes.forEach(({ node, id }) => {
      if (node.studyId === result.studyId) {
        this.nodesToShow[id] = true;
      }
    });

    this.renderGraph();
  }

  get searchItems() {
    return this.highLevelNodes.map((n): SearchItem => {
      const informationConnection = this.getInformation(n.id);
      const information = n.information.map(([_, value]) => value);

      return {
        id: n.id,
        title: getText(n.node, this.simulationStudyLookup),
        type: n.node.type,
        studyId: n.node.studyId,
        model: n.node.studyId !== undefined ? `Model ${n.node.studyId}` : undefined,
        information,
      };
    });
  }

  public addModel() {
    this.selectedModel = {
      id: uniqueId(),
      studyId: 0,
    };
  }

  // Ok, it's bad that I'm using any here as the generic but I can't seem to get the types to work without this
  public nodeRightClick(e: MouseEvent, node: SingleNode) {
    e.preventDefault();
    const setCenter = () => {
      this.lineStart = {
        x: node.x + node.width / 2,
        y: node.y + node.height / 2,
      };
    };

    this.$refs.d3.setStrokeColor(node, VALID_ENDPOINT_OUTLINE);

    // Get all nodes that contain the given point
    const getNodesInRange = (point: MouseEvent) => {
      return this.nodes
        .filter(isSingleNode) // we can't make connections to group nodes
        .filter((n) => {
          const ul = n; // upper left corner
          const lr = { x: n.x + n.width, y: n.y + n.height }; // lower right corner
          return n !== node && point.x > ul.x && point.y > ul.y && lr.x > point.x && lr.y > point.y;
        });
    };

    const getRelationship = (a: ProvenanceNode, b: ProvenanceNode) => {
      let defaultRelationshipMap = this.cachedConnections[a.type];
      if (!defaultRelationshipMap) {
        defaultRelationshipMap = this.cachedConnections[a.type] = {};
      }

      let relationship =  defaultRelationshipMap[b.type];
      if (!relationship) {
        relationship = defaultRelationshipMap[b.type] = getDefaultRelationshipType(a.type, b.type);
      }

      return relationship;
    };


    let selectedNode: SingleNode | null = null;
    const remove = addEventListeners({
      mousemove: (ev: MouseEvent) => {
        this.lineEnd = ev;
        setCenter();
        const nodesInRange = getNodesInRange(ev);

        // reset the color of the previously selected node
        // TODO this will cause a bug if the node was initially colored something else
        if (selectedNode) {
          this.$refs.d3.setStrokeColor(selectedNode, NODE_OUTLINE);
          selectedNode = null;
        }

        if (nodesInRange.length === 0) {
          return;
        }

        const top = selectedNode = nodesInRange[nodesInRange.length - 1];
        const a = node.provenanceNode;
        const b = top.provenanceNode;

        const relationship = getRelationship(a, b);
        const valid = isValidConnection(a, b, relationship);
        const color = valid ? VALID_ENDPOINT_OUTLINE : INVALID_ENDPOINT_OUTLINE;
        this.$refs.d3.setStrokeColor(selectedNode, color);
      },
      mouseup: (ev: MouseEvent) => {
        if (ev.which !== 3) {
          return;
        }

        remove();
        this.lineStart = null;
        this.lineEnd = null;

        this.$refs.d3.setStrokeColor(node, NODE_OUTLINE);
        if (selectedNode) {
          this.$refs.d3.setStrokeColor(selectedNode, NODE_OUTLINE);
        }

        const nodesInRange = getNodesInRange(ev);
        if (nodesInRange.length === 0) {
          return;
        }

        const nodeToMakeConnection = nodesInRange[nodesInRange.length - 1];
        const a = node.provenanceNode;
        const b = nodeToMakeConnection.provenanceNode;
        const relationship = getRelationship(a, b);

        const connection = makeConnection(a, b, relationship);
        if (connection.can) {
          makeRequest(() => backend.createDependency(connection.connection));
          // TODO error handle (ie don't push)
          this.dependencies.push(connection.connection);
          this.renderGraph();
        }
      },
    });
  }

  public hullDblclick(d: D3Hull) {
    this.expanded[d.group] = false;

    const point = { x: 0, y: 0 };
    d.nodes.forEach((n) => {
      point.x += n.x;
      point.y += n.y;
    });

    // Place the new node at the center of all of the nodes its consumming
    point.x /= d.nodes.length;
    point.y /= d.nodes.length;

    this.pointToPlaceNode = point;

    this.renderGraph();
  }

  public createNewNode(n: ProvenanceNode): SingleNode {
    const sourceId = n.id;

    const moreLeftToShow = this.highLevelNodeLookup[sourceId].incoming.some((dep) => {
      return !this.nodesToShow[dep.source.id];
    });

    const text = getText(n, this.simulationStudyLookup);
    const { x, y } = this.nodeLookup[sourceId] ? this.nodeLookup[sourceId] : this.pointToPlaceNode;
    const node: SingleNode = {
      isGroup: false,
      id: sourceId,
      text,
      actionText: moreLeftToShow ? 'See more' : undefined,
      type: n.type,
      model: n.studyId,
      hullGroup: n.studyId,
      stroke: NODE_OUTLINE,
      x,
      y,
      vx: 0,
      vy: 0,
      index: 0,
      provenanceNode: n,
      rx: n.classification === 'entity' ? 10 : 0,
      // width and height are essential
      // TODO add requirement to type file
      // they are used in the other js files
      // ALSO, * 8 just kinda works well and 10 is the padding
      width: text.length * 8 + 10,
      height: NODE_HEIGHT,
      onDidRightClick: (e: MouseEvent) => {
        this.nodeRightClick(e, node);
      },
      onDidClick: () => {
        this.$refs.d3.setStrokeColor(node, SELECTED_NODE_OUTLINE);

        if (this.selectedNode) {
          const selectedNode = this.nodeLookup[this.selectedNode.id];
          if (selectedNode && !selectedNode.isGroup) {
            this.$refs.d3.setStrokeColor(selectedNode, NODE_OUTLINE);
          }
        }

        if (this.selectedNode === n) {
          this.selectedNode = null;
        } else {
          this.selectedNode = n;
        }
      },
      onDidActionClick: () => {
        const seen = new Set<string>();

        // OK so, when the user wants to see the incoming connections by clicking "See more",
        // we need to (recursively) expand all outgoing connections for all of the incoming nodes
        // Right now, there is no way for a user to expand outgoing nodes which is why we do this
        const expandDependencies = (id: string, direction: 'incoming' | 'outgoing' = 'incoming') => {
          seen.add(id);

          const st = direction === 'outgoing' ? 'target' : 'source'; // source or target
          this.highLevelNodeLookup[id][direction].forEach((connection) => {
            if (seen.has(connection[st].id)) {
              return;
            }

            const studyId = connection[st].node.studyId;
            if (studyId !== undefined) {
              this.expanded[studyId] = true;
            }
            this.nodesToShow[connection[st].id] = true;
            expandDependencies(connection[st].id, 'outgoing');
          });
        };

        expandDependencies(node.id);
        this.pointToPlaceNode = node;
        this.renderGraph();
      },
    };

    return node;
  }

  public renderGraph() {
    const links: Link[] = [];
    const nodes: Node[] = [];
    const models: { [studyId: number]: GroupNode } = {};

    // We don't care about any nodes that don't need to be shown.
    const filtered = this.provenanceNodes.filter((n) => this.nodesToShow[n.id]);

    // First, create all of the model nodes.
    // These are the collapsed nodes. We only need to create one per model.
    filtered.forEach((n) => {
      if (n.studyId === undefined) {
        return;
      }

      if (this.expanded[n.studyId]) {
        return;
      }

      if (models[n.studyId]) {
        return;
      }

      const model = n.studyId;
      const groupId = this.savedGroupIds[n.studyId] = get(this.savedGroupIds, n.studyId, uniqueId());
      const point = this.nodeLookup[groupId] ? this.nodeLookup[groupId] : this.pointToPlaceNode;
      const node: GroupNode = {
        ...point,
        isGroup: true,
        model,
        id: groupId,
        index: 0,
        vx: 0,
        vy: 0,
        stroke: MODEL_STROKE,
        rx: 0,
        text: `M${n.studyId}`,
        width: MODEL_WIDTH,
        height: NODE_HEIGHT,
        onDidDblclick: () => {
          this.expanded[model] = true;
          this.pointToPlaceNode = node;
          this.renderGraph();
        },
      };

      models[n.studyId] = node;
      nodes.push(node);
    });

    // Now, we add the other nodes that don't have a model or that are in a model that is expanded
    filtered.forEach((n) => {
      const sourceId = n.id;

      const info = this.highLevelNodeLookup[sourceId];
      info.outgoing.forEach((c) => {
        const targetId = c.target.id;

        if (!this.nodesToShow[targetId]) {
          return;
        }

        const determineLinkId = (id: string, model: number | undefined) => {
          if (model === undefined || this.expanded[model]) {
            return id;
          }

          return models[model].id;
        };

        const source = determineLinkId(sourceId, c.source.node.studyId);
        const target = determineLinkId(targetId, c.target.node.studyId);

        // This happens for nodes in the same model when the model hasn't been expanded
        if (target === source) {
          return;
        }

        const link: Link = {
          source,
          target,
          color: c.color,
          onDidClick: () => {
            if (this.selectedConnection === c) {
              this.cancelRelationshipSelection();
              return;
            }

            this.selectedConnection = c;

            const a = c.source.node;
            const b = c.target.node;

            const aRules = relationshipRules[a.type];
            if (!aRules) {
              return;
            }

            const rules = aRules[b.type];
            if (!rules) {
              return;
            }

            this.currentRelationship = c.relationship;
            this.possibleRelationships = rules.map((rule) => {
              if (typeof rule === 'string') {
                return rule;
              }

              return rule.relationship;
            });
          },
        };

        links.push(link);
      });

      // don't add nodes that are a model that isn't expanded
      if (n.studyId !== undefined && !this.expanded[n.studyId]) {
        return;
      }

      nodes.push(this.createNewNode(n));
    });

    // Make sure to reset this since we are done rendering
    this.pointToPlaceNode = { x: 0, y: 0 };

    // This needs to happen at the end since we use the position information of the nodes
    // If we reset at the beginning, that information wouldn't be there
    this.nodes = nodes;
    this.links = links;
  }

  public addNode() {
    const node: ProvenanceNode = {
      type: 'ModelBuildingActivity',
      classification: 'activity',
      id: uniqueId(),
    };

    this.provenanceNodes.push(node);
    this.selectedNode = node;
    makeRequest(() => backend.updateOrCreateNode(node));

    this.nodesToShow[node.id] = true;
    if (node.studyId !== undefined) {
      this.expanded[node.studyId] = true;
    }

    this.renderGraph();
  }

  public cancelRelationshipSelection() {
    this.selectedConnection = null;
    this.currentRelationship = null;
    this.possibleRelationships = null;
  }

  public changeRelationship(relationship: ProvenanceNodeRelationships) {
    if (!this.selectedConnection) {
      return;
    }

    const originalConnection = this.selectedConnection.original;

    const a = this.selectedConnection.source.node;
    const b = this.selectedConnection.target.node;

    const cached = this.cachedConnections[a.type] = this.cachedConnections[a.type] || {};
    cached[b.type] = relationship;

    this.currentRelationship = relationship;
    originalConnection.properties.type = relationship;
    this.renderGraph();
    this.cancelRelationshipSelection();

    makeRequest(() => backend.createDependency(originalConnection));
  }

  public deleteRelationship() {
    if (!this.selectedConnection) {
      return;
    }

    const selectedConnection = this.selectedConnection;
    const source = this.selectedConnection.source;

    this.dependencies.filter((dependency) => {
      return dependency.properties.id !== selectedConnection.id;
    });

    this.renderGraph();
    this.cancelRelationshipSelection();

    // TODO what happens on error?
    makeRequest(() => backend.deleteDependency(selectedConnection.id));
  }

  public deselectNode() {
    this.selectedNode = null;
  }

  public deleteNode() {
    if (!this.selectedNode) {
      return;
    }

    const selected = this.selectedNode;

    // Remove all incoming connections
    const { incoming } = this.highLevelNodeLookup[selected.id];
    const toRemove = this.dependencies.filter((dependency) => {
      return dependency.target === selected.id;
    });

    // TODO what happens if the request fails
    this.dependencies = this.dependencies.filter((dependency) => {
      return dependency.target !== selected.id;
    });

    // TODO what happens if the request fails
    this.provenanceNodes = this.provenanceNodes.filter((n) => {
      return n.id !== selected.id;
    });

    makeRequest(() => backend.deleteNode(selected.id));
    toRemove.forEach((connection) => {
      // TODO error handling
      backend.deleteDependency(connection.properties.id);
    });

    this.selectedNode = null;
    this.renderGraph();
  }

  public onNodeChange(node: ProvenanceNode, key: keyof ProvenanceNode) {
    // This is a bit inefficient
    this.nodes.forEach((n) => {
      if (n.id !== node.id) {
        return;
      }

      if (n.isGroup) {
        return;
      }

      const newText = getText(node, this.simulationStudyLookup);
      if (newText !== n.text) {
        const newNode = this.createNewNode(node);
        this.$refs.d3.replaceNode(newNode);
      }
    });

    // Here we are revalidating all of the connections to see if they are still valid
    // If the type of node changed, they may no longer be valid
    const { outgoing, incoming } = this.highLevelNodeLookup[node.id];

    const dependenciesToRemove: this['dependencies'] = [];

    [...incoming, ...outgoing].forEach((c) => {
      if (isValidConnection(c.source.node, c.target.node, c.relationship)) {
        return;
      }

      dependenciesToRemove.push(...this.dependencies.filter((dependency) => {
        return dependency.properties.id === c.id;
      }));
    });

    const dependencyIds = new Set(dependenciesToRemove.map(({ properties }) => properties.id));
    this.dependencies = this.dependencies.filter((dependency) => {
      return dependencyIds.has(dependency.properties.id);
    });

    dependenciesToRemove.forEach((dependency) => {
      // TODO error handling
      backend.deleteDependency(dependency.properties.id);
    });

    makeRequest(() => backend.updateOrCreateNode(node, [key]));


    // We are calling the render function since we will likely need to redraw something
    // We debounce because we don't want to be rerendering all of the time
    this.debouncedRenderGraph();
  }

  public async mounted() {
    makeRequest(backend.getStudies, (result) => {
      this.models = result.items;
    });

    makeRequest(backend.getNodes, (result) => {
      this.provenanceNodes = result.items;
    });

    makeRequest(backend.getNodeDependencies, (result) => {
      this.dependencies = result.items;
    });

    makeRequest(backend.getNodeInformation, (result) => {
      this.information = result.items;
    });

    makeRequest(backend.getInformationNodes, (result) => {
      this.informationNodes = result.items;
    });
  }
}
</script>

<style lang="scss" scoped>
.cards {
  width: 350px;
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
  margin: 20px;
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

.clear-button {
  margin: 0 10px;
}
</style>
