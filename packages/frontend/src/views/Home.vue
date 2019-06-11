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
    ></d3>
    <svg ref="svg" :height="height" :width="width"></svg>
    <div class="cards">
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
</template>

<script lang="ts">
import Vue from 'vue';
import * as data from '@/assets/test';
import { NodeRelationship, relationshipColors } from '@/constants';
import { NodeType, Nodes } from 'specification';
import InformationCard from '@/components/InformationCard.vue';
import ProvLegend from '@/components/ProvLegend.vue';
import D3 from '@/components/D3.vue';
import { Lookup } from '@/utils';
import { Hull } from '@/d3';

interface BaseNode {
  x: number;
  y: number;
  rx: number;
  group: number;
  text: string;
  stroke: string;
  width: number;
  height: number;
}

interface GroupNode extends BaseNode {
  isGroup: true;
  id: string;
}

interface SingleNode extends BaseNode {
  isGroup: false;
  isEntity: boolean;
  type: NodeType;
  id: string;
  hullGroup: number;
}

type Node = SingleNode | GroupNode;

interface Link {
  source: string;
  target: string;
  color: string;
}

interface Data {
  height: number;
  width: number;
  size: number;
  nodeRadius: number;
  selectedNode: null | SingleNode;
  nodeOutline: string;
  nodeLookup: Lookup<Nodes>;
  expanded: Lookup<boolean | undefined>;
  nodes: Node[];
  links: Link[];
}

// TODO Node type checking!! And links

// Some important information
// 1. The wet lab data that does not come from a specific publication should appear in all of
// the models that use that data.

export default Vue.extend({
  name: 'Home',
  components: { InformationCard, ProvLegend, D3 },
  data: (): Data => {
    return {
      height: window.innerHeight,
      width: window.innerWidth,
      size: 40,
      selectedNode: null,
      nodeOutline: 'rgb(22, 89, 136)',
      nodeLookup: {},
      expanded: {},
      nodeRadius: 10,
      nodes: [],
      links: [],
    };
  },
  computed: {
    informationFields() {
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
    },
  },
  methods: {
    nodeDblclick(d: Node) {
      if (d.isGroup) {
        this.expanded[d.group] = true;
        const res = this.getNodesLinks();
        this.nodes = res.nodes;
        this.links = res.links;
      }
    },
    nodeClick(d: Node) {
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
    },
    hullDblclick(d: Hull) {
      if (this.expanded[d.group]) {
        this.expanded[d.group] = false;
        this.doRender();
      }
    },
    calcWidth(text: string) {
      // 8 just kinda works well (10 is the padding)
      return text.length * 8 + 10;
    },
    getText(n: Nodes): string {
      switch (n.type) {
        case 'wet-lab data':
          return n.name;
        case 'model-building-activity':
          return 'MBA';
        case 'simulation data':
          return n.name;
        case 'model exploration activity':
          return 'MEA';
        case 'model':
          if (n.version < 1) {
            throw Error(`Bad model version number: ${n.version}. Expected value >= 1`);
          }

          let text = `M${n.modelInformation.modelNumber}`;

          if (n.version === 1) {
            // Do nothing is the version is 1
          } else if (n.version === 2) {
            // Just add an apostrophe if the version is 2
            text += `'`;
          } else {
            // Add an explicit version number if > 2
            text += `v${n.version}`;
          }

          return text + ` (${n.modelInformation.bibInformation})`;
      }
    },
    getNodesLinks() {
      const links: Link[] = [];
      const nodes: Node[] = [];
      const groups: Lookup<GroupNode> = {};

      data.nodes.forEach((n) => {
        if (!this.expanded[n.groupId] && !groups.hasOwnProperty(n.groupId)) {
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

        // Save for later use
        this.nodeLookup[n.type + n.id] = n;

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

        setsToConnect.forEach(([nodesToConnect, relationship]) => {
          if (nodesToConnect === null) {
            return;
          }

          if (!Array.isArray(nodesToConnect)) {
            nodesToConnect = [nodesToConnect];
          }

          nodesToConnect.forEach((node) => {
            const target = this.expanded[node.groupId] ?
              node.type + node.id :
              '' + node.groupId;

            const source = this.expanded[n.groupId] ?
              n.type + n.id :
              '' + n.groupId;

            if (target === source) {
              return;
            }

            links.push({
              source,
              target,
              color: relationshipColors[relationship].color,
            });
          });
        });

        // don't add nodes that are a group that isn't expanded
        if (!this.expanded[n.groupId]) {
          return;
        }

        const text = this.getText(n);
        nodes.push({
          isGroup: false as false, // TODO
          isEntity: n.type === 'wet-lab data' || n.type === 'simulation data',
          id: n.type + n.id,
          text,
          type: n.type,
          group: n.groupId,
          hullGroup: n.groupId,
          x: 0,
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
    },
    doRender() {
      const { links, nodes } = this.getNodesLinks();
      this.links = links;
      this.nodes = nodes;
    },
  },
  mounted() {
    this.doRender();
  },
});
</script>

<style lang="scss" scoped>
.cards {
  position: absolute;
  right: 20px;
  top: 20px;
  width: 350px;
}

.spacer {
  margin: 10px 0;
}

.field-title {
  font-weight: bold;
}

.field-spacer {
  margin: 5px 0;
}
</style>
