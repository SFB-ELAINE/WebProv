<template>
  <div class="home">
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
      :node-dblclick="nodeDblclick"
      :hull-dblclick="hullDblclick"
      :action-click="actionClick"
    ></d3>
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
        :results="results"
        @search="search"
        @clear="removeResults"
        @open="openResult"
        @dependency="showProvenanceGraph"
      ></search>
      <div style="flex: 1"></div>
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
        @click="clearNodes"
      >
        Reset
      </b-button>
      <div class="cards overlay-child">
        <prov-legend v-bind="legendProps"></prov-legend>
        <div class="spacer"></div>
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
          @close="cancelNodeTypeSelection"
          @delete="deleteNode"
          @input="checkText"
        ></form-card>
        <!-- <div class="spacer"></div> -->
        <!-- <information-card
          v-if="informationFields"
          :information-fields="informationFields"
        ></information-card> -->
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import * as data from '@/assets/test';
import {
  relationshipColors,
  NODE_OUTLINE,
  VALID_ENDPOINT_OUTLINE,
  INVALID_ENDPOINT_OUTLINE,
  NODE_HEIGHT,
  NODE_RADIUS,
  MODEL_STROKE,
  MODEL_WIDTH,
} from '@/constants';
import {
  ProvenanceNodeType,
  ProvenanceNode,
  relationshipRules,
  ProvenanceNodeRelationships,
  ProvenanceNodeConnection,
  provenanceNodeTypes,
  ModelInformation,
} from 'specification';
import InformationCard from '@/components/InformationCard.vue';
import ProvLegend from '@/components/ProvLegend.vue';
import D3 from '@/components/D3.vue';
import {
  Lookup,
  getText,
  makeLookup,
  getInformationFields,
  once,
  addEventListeners,
  makeConnection,
  isValidConnection,
  Watch,
  getDefaultRelationshipType,
  uniqueId,
  nodeFields,
  FieldInformation,
} from '@/utils';
import { D3Hull, D3Node, ID3, D3Link } from '@/d3';
import Search from '@/components/Search.vue';
import FormCard from '@/components/FormCard.vue';
import CardSelect from '@/components/CardSelect.vue';
import { SearchItem, search } from '@/search';
import { Component, Vue } from 'vue-property-decorator';

interface BaseNode extends D3Node {
  model: number;
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
  original: ProvenanceNodeConnection;
  source: HighLevelNode;
  target: HighLevelNode;
  color: string;
}

interface HighLevelNode {
  id: string;
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

// TODO
// 1. Verify connections after type change

// Some important information
// 1. The wet lab data that does not come from a specific publication should appear in all of
// the models that use that data.

@Component({
  components: { InformationCard, ProvLegend, D3, Search, CardSelect, FormCard },
})
export default class Home extends Vue {
  public provenanceNodes = data.nodes;

  // OK, so for some reason we have to remove 7 here so that there is no overlow......
  public height = window.innerHeight - 7;

  public width = window.innerWidth;

  // which models are currently expanded
  public expanded: Lookup<boolean> = {};

  // The current nodes that are passed to D3
  public nodes: Node[] = [];
  public links: Link[] = [];

  public legendProps = { nodeOutline: NODE_OUTLINE, nodeRadius: NODE_RADIUS };

  // The search results
  public results: SearchItem[] = [];

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

  // TODO
  public nodeFields = nodeFields;

  public $refs!: {
    d3: D3<SingleNode>;
  };

  get nodeLookup() {
    return makeLookup(this.nodes);
  }

  get modelInformationLookup() {
    const lookup: { [modelId: number]: ModelInformation } = {};
    Object.values(data.models).forEach((modelInformation) => {
      lookup[modelInformation.modelId] = modelInformation;
    });

    return lookup;
  }

  get highLevelNodes(): HighLevelNode[] {
    const nodeLookup: Lookup<HighLevelNode> = {};

    const highLevelNodes = this.provenanceNodes.map((n) => {
      const sourceId = n.id;

      const checkAndAdd = (id: string, node: ProvenanceNode) => {
        if (!nodeLookup.hasOwnProperty(id)) {
          nodeLookup[id] = {
            id,
            node,
            incoming: [],
            outgoing: [],
          };
        }
      };


      checkAndAdd(sourceId, n);
      const source = nodeLookup[sourceId];
      if (!n.connections) {
        return;
      }

      n.connections.forEach((connection) => {
        const targetId = connection.target.id;
        checkAndAdd(targetId, connection.target);
        const target = nodeLookup[targetId];

        const d3Connection: Connection = {
          id: connection.id,
          relationship: connection.type,
          original: connection,
          color: relationshipColors[connection.type].color,
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

  public showProvenanceGraph(r: SearchItem) {
    const showNode = (id: string) => {
      this.nodesToShow[id] = true;
      const info = this.highLevelNodeLookup[id];
      this.expanded[info.node.modelId] = true;

      info.outgoing.forEach((c) => {
        showNode(c.target.id);
      });
    };

    showNode(r.id);
    this.calculateLinksNodes();
  }

  public clearNodes() {
    this.nodesToShow = {};
    this.calculateLinksNodes();
  }

  public openResult(result: SearchItem) {
    this.expanded[result.model] = true;

    this.highLevelNodes.forEach(({ node, id }) => {
      if (node.modelId === result.model) {
        this.nodesToShow[id] = true;
      }
    });

    this.calculateLinksNodes();
  }

  public removeResults() {
    this.results = [];
  }

  public search(pattern: string) {
    const items: SearchItem[] =  this.provenanceNodes.map((n) => {
      const information =
        n.type === 'wet-lab-data' &&
        n.information ?
        n.information.map(([_, value]) => value) : [];

      return {
        id: n.id,
        title: getText(n, this.modelInformationLookup),
        type: n.type,
        model: n.modelId,
        information,
      };
    });

    this.results = search(items, pattern);
  }

  public nodeDblclick(d: Node) {
    if (d.isGroup) {
      this.expanded[d.model] = true;
      this.pointToPlaceNode = d;

      this.calculateLinksNodes();
    }
  }

  // Ok, it's bad that I'm using any here as the generic but I can't seem to get the types to work without this
  public nodeRightClick(e: MouseEvent, node: SingleNode, action: ID3<SingleNode>) {
    e.preventDefault();
    const setCenter = () => {
      this.lineStart = {
        x: node.x + node.width / 2,
        y: node.y + node.height / 2,
      };
    };

    action.setStrokeColor(node, VALID_ENDPOINT_OUTLINE);

    const getNodesInRange = (ev: MouseEvent) => {
      return this.nodes
        .filter(isSingleNode)
        .filter((n) => {
          const ul = n;
          const lr = { x: n.x + n.width, y: n.y + n.height };
          return n !== node && ev.x > ul.x && ev.y > ul.y && lr.x > ev.x && lr.y > ev.y;
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
          action.setStrokeColor(selectedNode, NODE_OUTLINE);
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

        action.setStrokeColor(selectedNode, color);

      },
      mouseup: (ev: MouseEvent) => {
        if (ev.which === 3) { // right click up
          remove();
          this.lineStart = null;
          this.lineEnd = null;

          action.setStrokeColor(node, NODE_OUTLINE);
          if (selectedNode) {
            action.setStrokeColor(selectedNode, NODE_OUTLINE);
          }

          const nodesInRange = getNodesInRange(ev);
          if (nodesInRange.length === 0) {
            return;
          }

          const nodeToMakeConnection = nodesInRange[nodesInRange.length - 1];
          const a = node.provenanceNode;
          const b = nodeToMakeConnection.provenanceNode;
          const relationship = getRelationship(a, b);

          const madeConnection = makeConnection(a, b, { type: relationship });
          if (madeConnection) {
            this.calculateLinksNodes();
          }
        }
      },
    });
  }

  public actionClick(d: Node) {
    // OK so, when the user wants to see the incoming connections by clicking "See more",
    // we need to (recursively) expand all outgoing connections for all of the incoming nodes
    // Right now, there is no way for a user to expand outgoing nodes which is why we do this
    const expandDependencies = (id: string, direction: 'incoming' | 'outgoing' = 'incoming') => {
      const st = direction === 'outgoing' ? 'target' : 'source'; // source or target
      this.highLevelNodeLookup[id][direction].forEach((connection) => {
        this.expanded[connection[st].node.modelId] = true;
        this.nodesToShow[connection[st].id] = true;
        expandDependencies(connection[st].id, 'outgoing');
      });
    };

    expandDependencies(d.id);
    this.pointToPlaceNode = d;
    this.calculateLinksNodes();
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

    this.calculateLinksNodes();
  }

  public createNewNode(n: ProvenanceNode): SingleNode {
    const sourceId = n.id;

    const moreLeftToShow = this.highLevelNodeLookup[sourceId].incoming.some((dep) => {
      return !this.nodesToShow[dep.source.id];
    });

    const text = getText(n, this.modelInformationLookup);
    const { x, y } = this.nodeLookup[sourceId] ? this.nodeLookup[sourceId] : this.pointToPlaceNode;
    const isEntity = n.type === 'wet-lab-data' || n.type === 'simulation-data' || n.type === 'model';
    const node: SingleNode = {
      isGroup: false,
      id: sourceId,
      text,
      actionText: moreLeftToShow ? 'See more' : undefined,
      type: n.type,
      model: n.modelId,
      hullGroup: n.modelId,
      stroke: NODE_OUTLINE,
      x,
      y,
      vx: 0,
      vy: 0,
      index: 0,
      provenanceNode: n,
      rx: isEntity ? 10 : 0,
      // width and height are essential
      // TODO add requirement to type file
      // they are used in the other js files
      // ALSO, * 8 just kinda works well and 10 is the padding
      width: text.length * 8 + 10,
      height: NODE_HEIGHT,
      onDidRightClick: (e: MouseEvent, id3: ID3<SingleNode>) => {
        this.nodeRightClick(e, node, id3);
      },
      onDidClick: () => {
        if (node.isGroup) {
          return;
        }

        if (this.selectedNode === n) {
          this.cancelNodeTypeSelection();
        } else {
          this.selectedNode = n;
        }
      },
    };

    return node;
  }

  public calculateLinksNodes() {
    const links: Link[] = [];
    const nodes: Node[] = [];
    const models: { [modelId: number]: GroupNode } = {};

    this.provenanceNodes.forEach((n) => {
      const sourceId = n.id;

      if (!this.nodesToShow[sourceId]) {
        return;
      }

      if (!this.expanded[n.modelId] && !models[n.modelId]) {
        // this bad naming just avoids name shadowing
        const groupId = uniqueId();
        const { x: x1, y: y1 } = this.nodeLookup[groupId] ? this.nodeLookup[groupId] : this.pointToPlaceNode;
        const node: GroupNode = {
          isGroup: true,
          model: n.modelId,
          id: groupId,
          x: x1,
          y: y1,
          index: 0,
          vx: 0,
          vy: 0,
          stroke: MODEL_STROKE,
          rx: 0,
          text: `M${n.modelId}`,
          width: MODEL_WIDTH,
          height: NODE_HEIGHT,
        };

        models[n.modelId] = node;
        nodes.push(node);
      }

      const info = this.highLevelNodeLookup[sourceId];
      info.outgoing.forEach((c) => {
        const targetId = c.target.id;

        if (!this.nodesToShow[targetId]) {
          return;
        }

        const determineLinkId = (id: string, model: number) => {
          if (this.expanded[model]) {
            return id;
          }

          return models[model].id;
        };

        const source = determineLinkId(sourceId, c.source.node.modelId);
        const target = determineLinkId(targetId, c.target.node.modelId);


        // This happens for nodes in the same model that hasn't been expanded
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
      if (!this.expanded[n.modelId]) {
        return;
      }

      nodes.push(this.createNewNode(n));
    });

    // Make sure to reset this since we are done rendering
    this.pointToPlaceNode = { x: 0, y: 0 };

    this.links = links;
    this.nodes = nodes;
  }

  public addNode() {
    const node: ProvenanceNode = {
      type: 'model-building-activity',
      modelId: 1,
      id: uniqueId(),
      connections: [],
    };

    this.provenanceNodes.push(node);
    this.nodesToShow[node.id] = true;
    this.expanded[node.modelId] = true;
    this.calculateLinksNodes();
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
    originalConnection.type = relationship;
    this.calculateLinksNodes();
    this.cancelRelationshipSelection();
  }

  public deleteRelationship() {
    if (!this.selectedConnection) {
      return;
    }

    const selectedConnection = this.selectedConnection;
    const source = this.selectedConnection.source;
    if (!source.node.connections) {
      return;
    }

    source.node.connections = source.node.connections.filter((connection) => {
      return connection.id !== selectedConnection.original.id;
    });

    this.calculateLinksNodes();
    this.cancelRelationshipSelection();
  }

  public cancelNodeTypeSelection() {
    this.selectedNode = null;
  }

  public changeNodeType(type: ProvenanceNodeType) {
    if (!this.selectedNode) {
      return;
    }


    this.selectedNode.type = type;
    Vue.set(this.selectedNode, 'type', type);
    // TODO

    this.calculateLinksNodes();
  }

  public deleteNode() {
    if (!this.selectedNode) {
      return;
    }

    const selected = this.selectedNode;
    this.provenanceNodes = this.provenanceNodes.filter((n) => {
      return n.id !== selected.id;
    });

    this.cancelNodeTypeSelection();
    this.calculateLinksNodes();
  }

  public checkText() {
    if (!this.selectedNode) {
      return;
    }

    const node = this.selectedNode;
    this.nodes.forEach((n) => {
      if (n.id !== node.id) {
        return;
      }

      if (n.isGroup) {
        return;
      }


      const newText = getText(node, this.modelInformationLookup);
      if (newText !== n.text) {
        const newNode = this.createNewNode(node);
        this.$refs.d3.replaceNode(newNode);
      }
    });

    const { outgoing, incoming } = this.highLevelNodeLookup[node.id];

    let reCalculate = false;
    [...incoming, ...outgoing].forEach(({ source, target, relationship }) => {
      if (isValidConnection(source.node, target.node, relationship)) {
        return;
      }

      reCalculate = true;
      if (!source.node.connections) {
        return;
      }

      source.node.connections = source.node.connections
        .filter((connection) => connection.target.id !== target.node.id);
    });


    if (reCalculate) {
      this.calculateLinksNodes();
    }
  }
}
</script>

<style lang="scss" scoped>
.cards {
  width: 350px;
}

.search {
  width: 450px;
  max-height: calc(100vh - 40px);
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
