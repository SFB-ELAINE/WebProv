<template>
  <div class="home">
    <d3
      :height="height"
      :width="width"
      :links="links"
      :nodes="nodes"
      force 
      arrows
      hulls
      :node-click="nodeClick"
      :node-dblclick="nodeDblclick"
      :hull-dblclick="hullDblclick"
      :action-click="actionClick"
    ></d3>
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
        @click="clearNodes"
      >Clear ProvenanceNode</b-button>
      <div class="cards overlay-child">
        <prov-legend
          :node-radius="nodeRadius"
          :node-outline="nodeOutline"
        ></prov-legend>
        <div class="spacer"></div>
        <information-card
          v-if="informationFields"
          :information-fields="informationFields"
        ></information-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import * as data from '@/assets/test';
import { NodeRelationship, relationshipColors } from '@/constants';
import { ProvenanceNodeType, ProvenanceNode } from 'specification';
import InformationCard from '@/components/InformationCard.vue';
import ProvLegend from '@/components/ProvLegend.vue';
import D3 from '@/components/D3.vue';
import { Lookup, getText, makeLookup, getConnections } from '@/utils';
import { D3Hull, D3Node } from '@/d3';
import Search from '@/components/Search.vue';
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
  isGroup: false;
  isEntity: boolean;
  type: ProvenanceNodeType;
}

type Node = SingleNode | GroupNode;

interface Link {
  source: string;
  target: string;
  color: string;
}

interface Connection {
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

// Some important information
// 1. The wet lab data that does not come from a specific publication should appear in all of
// the models that use that data.

@Component({
  components: { InformationCard, ProvLegend, D3, Search },
})
export default class Home extends Vue {
  // OK, so for some reason we have to remove 7 here so that there is no overlow......
  public height: number = window.innerHeight - 7;

  public width: number = window.innerWidth;

  // constant
  public nodeHeight: number = 40;

  // used to display information on a card
  public selectedNode: null | SingleNode = null;

  // constant
  public nodeOutline: string = 'rgb(22, 89, 136)';
  public expanded: Lookup<boolean | undefined> = {};
  public nodeRadius: number = 10;

  // The current nodes that are passed to D3
  public nodes: Node[] = [];
  public links: Link[] = [];
  public results: SearchItem[] = [];
  public loadedGroups: number[] = []; // TODO Remove this
  public nodesToShow: Lookup<boolean | undefined> = {};

  get nodeLookup(): Lookup<ProvenanceNode> {
    const lookup: Lookup<ProvenanceNode> = {};
    data.nodes.forEach((n) => {
      lookup[n.type + n.id] = n;
    });
    return lookup;
  }

  get d3NodeLookup() {
    return makeLookup(this.nodes);
  }

  get informationFields() {
    if (!this.selectedNode) {
      return;
    }

    const toReturn: Array<[string, string]> = [['Title', this.selectedNode.text]];

    const node = this.nodeLookup[this.selectedNode.id];
    if (!node) {
      throw Error(`Unable to find node with ID: ${this.selectedNode.id}. This should not happen.`);
    }

    switch (node.type) {
      case 'model-building-activity':
        break;
      case 'model exploration activity':
        break;
      case 'model':
        toReturn.push(['Source', node.modelInformation.bibInformation]);
        toReturn.push(['Model Number', '' + node.modelInformation.modelNumber]);
        toReturn.push(['Version', '' + node.version]);
        break;
      case 'wet-lab data':
        const information = node.information ? node.information : {};
        Object.keys(information).forEach((key) => {
          toReturn.push([key, information[key]]);
        });
        break;
      case 'simulation data':
        break;
    }

    return toReturn;
  }

  get transformedNodes() {
    return data.nodes.map((node) => ({
      id: node.type + node.id,
      original: node,
    }));
  }

  // TODO Point to dependency info and not NODE
  get dependencyInfo(): HighLevelNode[] {
    const nodeLookup: Lookup<HighLevelNode> = {};

    const dependencyInfo = this.transformedNodes.map(({ id: sourceId, original: n }) => {
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

      getConnections(n).forEach(([targets, relationship]) => {
        return targets.map((targetNode) => {
          const targetId = targetNode.type + targetNode.id;
          checkAndAdd(targetId, targetNode);
          const target = nodeLookup[targetId];

          const connection = {
            color: relationshipColors[relationship].color,
            source,
            target,
          } as Connection;

          source.outgoing.push(connection);
          target.incoming.push(connection);
        });
      });
    });

    return Object.values(nodeLookup);
  }

  get dependencyInfoLookup() {
    return makeLookup(this.dependencyInfo);
  }

  public showProvenanceGraph(r: SearchItem) {
    const showNode = (id: string) => {
      this.nodesToShow[id] = true;
      const info = this.dependencyInfoLookup[id];
      info.outgoing.forEach((c) => {
        showNode(c.target.id);
      });
    };

    showNode(r.id);
    this.doRender();
  }

  public clearNodes() {
    this.loadedGroups = [];
    this.doRender();
  }

  public openResult(result: SearchItem) {
    if (!this.loadedGroups.includes(result.model)) {
      this.loadedGroups.push(result.model);
      this.doRender();
    }
  }

  public removeResults() {
    this.results = [];
  }

  public search(pattern: string) {
    const items: SearchItem[] = data.nodes.map((n) => {
      const information =
        n.type === 'wet-lab data' &&
        n.information ?
        Object.values(n.information) : [];

      return {
        id: n.type + n.id,
        title: getText(n),
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
      const res = this.getNodesLinks();
      this.nodes = res.nodes;
      this.links = res.links;
    }
  }

  public nodeClick(d: Node) {
    if (d.isGroup) {
      return;
    }

    if (this.selectedNode === null) {
      this.selectedNode = d;
    } else if (this.selectedNode === d) {
      this.selectedNode = null;
    } else {
      this.selectedNode = d;
    }
  }

  public actionClick(d: Node) {
    const info = this.dependencyInfoLookup[d.id];
    info.incoming.forEach((incoming) => {
      this.nodesToShow[incoming.source.id] = true;
    });

    this.doRender();
  }

  public hullDblclick(d: D3Hull) {
    if (this.expanded[d.group]) {
      this.expanded[d.group] = false;
      this.doRender();
    }
  }

  public calcWidth(text: string) {
    // 8 just kinda works well (10 is the padding)
    return text.length * 8 + 10;
  }

  public getNodesLinks() {
    const links: Link[] = [];
    const nodes: Node[] = [];
    const groups: Lookup<GroupNode> = {};

    data.nodes.forEach((n) => {
      const sourceId = n.type + n.id;

      if (!this.loadedGroups.includes(n.modelId) && !this.nodesToShow[sourceId]) {
        return;
      }

      if (!this.expanded[n.modelId] && !this.nodesToShow[sourceId] && !groups.hasOwnProperty(n.modelId)) {
        // this bad naming just avoids name shadowing
        const { x: x1, y: y1 } = this.d3NodeLookup['' + n.modelId] ? this.d3NodeLookup['' + n.modelId] : { x: 0, y: 0 };
        const node: GroupNode = {
          isGroup: true,
          model: n.modelId,
          id: '' + n.modelId,
          x: x1,
          y: y1,
          stroke: this.nodeOutline,
          rx: 0, // TODO
          text: `M${n.modelId}`,
          width: 50,
          height: this.nodeHeight,
        };

        groups[n.modelId] = node;
        nodes.push(node);
      }

      const info = this.dependencyInfoLookup[sourceId];
      info.outgoing.forEach((c) => {
        const targetId = c.target.id;

        if (!this.loadedGroups.includes(c.target.node.modelId) && !this.nodesToShow[targetId]) {
          return;
        }

        const determineLinkId = (id: string, model: number) => {
          if (this.expanded[model]) {
            return id;
          }

          if (this.nodesToShow[id]) {
            return id;
          }

          return '' + model;
        };

        const source = determineLinkId(sourceId, c.source.node.modelId);
        const target = determineLinkId(targetId, c.target.node.modelId);


        // This happens for nodes in the same model that hasn't been expanded
        if (target === source) {
          return;
        }

        links.push({
          source,
          target,
          color: c.color,
        });
      });

      // tslint:disable-next-line:no-console
      console.debug(links.map((l) => `${l.source} => ${l.target}: ${l.color}`).join('\n'));


      // don't add nodes that are a model that isn't expanded
      if (!this.expanded[n.modelId] && !this.nodesToShow[sourceId]) {
        return;
      }

      const moreLeftToShow = this.dependencyInfoLookup[sourceId].incoming.some((dep) => {
        if (this.expanded[dep.source.node.modelId]) {
          return false;
        }

        if (this.nodesToShow[dep.source.id]) {
          return false;
        }

        return true;
      });

      const text = getText(n);
      const { x, y } = this.d3NodeLookup[sourceId] ? this.d3NodeLookup[sourceId] : { x: 0, y: 0 };
      nodes.push({
        isGroup: false as false, // TODO
        isEntity: n.type === 'wet-lab data' || n.type === 'simulation data',
        id: sourceId,
        text,
        actionText: moreLeftToShow ? 'See more' : undefined,
        type: n.type,
        model: n.modelId,
        hullGroup: n.modelId,
        stroke: this.nodeOutline,
        x,
        y,
        rx: 0, // TODO
        // width and height are essential
        // TODO add requirement to type file
        // they are used in the other js files
        width: this.calcWidth(text),
        height: this.nodeHeight,
      });
    });

    return {
      links,
      nodes,
      groups,
    };
  }

  public mounted() {
    this.doRender();
  }

  public doRender() {
    const { links, nodes } = this.getNodesLinks();
    this.links = links;
    this.nodes = nodes;
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
