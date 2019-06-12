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
      >Clear Nodes</b-button>
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
import { NodeType, Nodes } from 'specification';
import InformationCard from '@/components/InformationCard.vue';
import ProvLegend from '@/components/ProvLegend.vue';
import D3 from '@/components/D3.vue';
import { Lookup, getText } from '@/utils';
import { D3Hull, D3Node } from '@/d3';
import Search from '@/components/Search.vue';
import { Result, search, SearchItem } from '@/search';
import { Component, Vue } from 'vue-property-decorator';

interface BaseNode extends D3Node {
  group: number;
  text: string;
}

interface GroupNode extends BaseNode {
  isGroup: true;
}

interface SingleNode extends BaseNode {
  isGroup: false;
  isEntity: boolean;
  type: NodeType;
}

type Node = SingleNode | GroupNode;

interface Link {
  source: string;
  target: string;
  color: string;
}

interface Dependency {
  node: Nodes;
  color: string;
}

interface DependencyInfo {
  node: Nodes;
  outgoing: Dependency[];
  incoming: Dependency[];
}

const notNull = <T>(t: T | null): t is T => {
  return t !== null;
};

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
  public size: number = 40;
  public selectedNode: null | SingleNode = null;
  public nodeOutline: string = 'rgb(22, 89, 136)';
  public expanded: Lookup<boolean | undefined> = {};
  public nodeRadius: number = 10;
  public nodes: Node[] = [];
  public links: Link[] = [];
  public results: Result[] = [];
  public loadedGroups: number[] = []; // TODO Remove this
  public nodesToShow: Lookup<boolean | undefined> = {};

  get nodeLookup(): Lookup<Nodes> {
    const lookup: Lookup<Nodes> = {};
    data.nodes.forEach((n) => {
      lookup[n.type + n.id] = n;
    });
    return lookup;
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

  // TODO Point to dependency info and not NODE
  get dependencyInfo(): DependencyInfo[] {
    const incomingLookup: Lookup<Dependency[]> = {};

    const dependencyInfo = data.nodes.map((n) => {
      let setsToConnect: Array<[Nodes[] | Nodes | null, NodeRelationship]> = [];
      switch (n.type) {
        case 'wet-lab data':
          break;
        case 'model-building-activity':
          setsToConnect = [
            [n.wetLabsUsedForValidation, 'Used for validation'],
            [n.wetLabsUsedForCalibration, 'Used for calibration'],
            [n.simulationsUsedForValidation, 'Used for validation'],
            [n.simulationsUsedForCalibration, 'Used for calibration'],
            [n.used, 'Used'],
          ];
          break;
        case 'simulation data':
          setsToConnect = [
            [n.wasGeneratedByModelBuildingActivity, 'Was generated by'],
            [n.wasGeneratedByModelExplorationActivity, 'Was generated by'],
          ];
          break;
        case 'model exploration activity':
          setsToConnect = [[n.used, 'Used']];
          break;
        case 'model':
          setsToConnect = [[n.wasGeneratedBy, 'Used'], [n.derivedFrom, 'Derived from']];
      }

      const outgoing = setsToConnect.map(([nodesToConnect, relationship]) => {
        if (nodesToConnect === null) {
          return null;
        }

        if (!Array.isArray(nodesToConnect)) {
          nodesToConnect = [nodesToConnect];
        }

        return nodesToConnect.map((toConnect) => {
          return {
            color: relationshipColors[relationship].color,
            node: toConnect,
          };
        });
      }).filter(notNull).flat();

      const incoming: Dependency[] = [];
      incomingLookup[n.type + n.id] = incoming;

      return {
        node: n,
        incoming,
        outgoing,
      };
    });

    dependencyInfo.forEach((info) => {
      info.outgoing.forEach((dependency) => {
        const id = dependency.node.type + dependency.node.id;
        incomingLookup[id].push({ color: dependency.color, node: info.node });
      });
    });

    return dependencyInfo;
  }

  get dependencyInfoLookup() {
    const lookup: Lookup<DependencyInfo> = {};
    this.dependencyInfo.forEach((info) => {
      lookup[info.node.type + info.node.id] = info;
    });
    return lookup;
  }

  public showProvenanceGraph(r: Result) {
    const showNode = (id: string) => {
      this.nodesToShow[id] = true;
      const info = this.dependencyInfoLookup[id];
      info.outgoing.forEach((c) => {
        showNode(c.node.type + c.node.id);
      });
    };

    showNode(r.id);
    this.doRender();
  }

  public clearNodes() {
    this.loadedGroups = [];
    this.doRender();
  }

  public openResult(result: Result) {
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
        model: n.groupId,
        information,
      };
    });

    this.results = search(items, pattern);
  }

  public nodeDblclick(d: Node) {
    if (d.isGroup) {
      this.expanded[d.group] = true;
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
      this.nodesToShow[incoming.node.type + incoming.node.id] = true;
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
      const id = n.type + n.id;

      if (!this.loadedGroups.includes(n.groupId) && !this.nodesToShow[id]) {
        return;
      }

      if (!this.expanded[n.groupId] && !this.nodesToShow[id] && !groups.hasOwnProperty(n.groupId)) {
        const node: GroupNode = {
          isGroup: true,
          group: n.groupId,
          id: '' + n.groupId,
          x: 0,
          y: 0,
          stroke: this.nodeOutline,
          rx: 0, // TODO
          text: `M${n.groupId}`,
          width: 50,
          height: this.size,
        };

        groups[n.groupId] = node;
        nodes.push(node);
      }

      const info = this.dependencyInfoLookup[id];
      info.outgoing.forEach((c) => {
        const targetId = c.node.type + c.node.id;
        if (!this.loadedGroups.includes(c.node.groupId) && !this.nodesToShow[targetId]) {
          return;
        }

        const target = this.expanded[c.node.groupId] || this.nodesToShow[targetId] ?
          targetId :
          '' + c.node.groupId;

        const sourceId = n.type + n.id;
        const source = this.expanded[n.groupId] || this.nodesToShow[sourceId] ?
          sourceId :
          '' + n.groupId;

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


      // don't add nodes that are a group that isn't expanded
      if (!this.expanded[n.groupId] && !this.nodesToShow[id]) {
        return;
      }

      const moreLeftToShow = this.dependencyInfoLookup[id].incoming.some((dep) => {
        if (this.expanded[dep.node.groupId]) {
          return false;
        }

        if (this.nodesToShow[dep.node.type + dep.node.id]) {
          return false;
        }

        return true;
      });

      const text = getText(n);
      nodes.push({
        isGroup: false as false, // TODO
        isEntity: n.type === 'wet-lab data' || n.type === 'simulation data',
        id: n.type + n.id,
        text,
        actionText: moreLeftToShow ? 'See more' : undefined,
        type: n.type,
        group: n.groupId,
        x: 0,
        hullGroup: n.groupId,
        stroke: this.nodeOutline,
        y: 0,
        rx: 0, // TODO
        // width and height are essential
        // TODO add requirement to type file
        // they are used in the other js files
        width: this.calcWidth(text),
        height: this.size,
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
