<template>
  <div class="home">
    <svg ref="svg" :height="height" :width="width"></svg>
    <div class="cards">
      <prov-legend 
        :node-radius="nodeRadius"
        :node-outline="nodeOutline"
      ></prov-legend>
      <div class="spacer"></div>
      <card v-if="selectedNode" title="Node Information">
        <div v-for="([key, value], index) in informationFields" :key="key">
          <div class="field-title">{{ key }}</div>
          <div class="field-text">{{ value }}</div>
          <div v-if="index !== informationFields.length - 1" class="field-spacer"></div>
        </div>
        <template v-slot:footer>
          <a class="card-footer-item">Edit</a>
          <a class="card-footer-item">Delete</a>
        </template>
      </card>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as d3 from 'd3';
import * as graphing from '@/graphing';
import * as data from '@/assets/test';
import forceLink from '@/link';
import forceManyBody from '@/manyBody';
import { NodeRelationship, relationshipColors } from '@/constants';
import { NodeType, Nodes } from 'specification';
import Card from '@/components/Card.vue';
import ProvLegend from '@/views/ProvLegend.vue';

interface BaseNode {
  x: number;
  y: number;
  group: number;
  text: string;
}

interface GroupNode extends BaseNode {
  isGroup: true;
  id: string;

  // TODO REMOVE
  width: number;
  height: number;
}

interface SingleNode extends BaseNode {
  isGroup: false;
  isEntity: boolean;
  type: NodeType;
  id: string;
  width: number;
  height: number;
}

type Node = SingleNode | GroupNode;

interface Link {
  source: string;
  target: string;
  color: string;
}

interface Lookup<T> { [k: string]: T; }

const notNull = <T>(v: T | null): v is T => {
  return v !== null;
};

interface Data {
  height: number;
  width: number;
  size: number;
  nodeRadius: number;
  selectedNode: null | SingleNode;
  nodeOutline: string;
  selectedOutline: string;
  nodesSelection: null | d3.Selection<SVGRectElement, any, SVGElement, {}>;
  nodeLookup: Lookup<Nodes>;
  hullOffset: number;
  curve: d3.Line<[number, number]>;
  expanded: Lookup<boolean | undefined>;
  previousNodes: Node[];
}


const isGroup = (n: GroupNode | Node): n is GroupNode => {
  return n.isGroup;
};

const isNode = (n: GroupNode | Node): n is Node => {
  return !n.isGroup;
};

const ordinalScale = d3.scaleOrdinal(d3.schemeCategory10);

// Here is some relevant information that will help you understand the following schemas:
// 1. The wet lab data that does not come from a specific publication should appear in all of
// the models that use that data.

export default Vue.extend({
  name: 'Home',
  components: { Card, ProvLegend },
  data: (): Data => {
    return {
      height: window.innerHeight,
      width: window.innerWidth,
      size: 40,
      selectedNode: null,
      nodeOutline: 'rgb(22, 89, 136)',
      selectedOutline: 'rgb(211, 215, 82)',
      nodesSelection: null,
      nodeLookup: {}, // TODO REMOVE THIS
      hullOffset: 15,
      curve: d3.line().curve(d3.curveCardinalClosed.tension(0.85)),
      expanded: {},
      previousNodes: [],
      nodeRadius: 10,
    };
  },
  computed: {
    informationFields(): Array<[string, string]> {
      if (!this.selectedNode) {
        return [];
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
    previousNodeLookup() {
      const lookup: Lookup<Node> = {};
      this.previousNodes.forEach((n) => {
        lookup[n.id] =  n;
      });
      return lookup;
    },
  },
  methods: {
    calcWidth(text: string) {
      // 8 just kinda works well (10 is the padding)
      return text.length * 8 + 10;
    },
    fill(d: { group: string }) {
      return ordinalScale(d.group);
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
    convexHulls(nodes: Node[]) {
      const hulls: { [group: string]: Array<[number, number]> } = {};
      const offset = this.hullOffset;
      // create point sets
      nodes.forEach((n) => {
        if (n.isGroup) {
          // Skip nodes that are just groups
          return;
        }

        // eslint-disable-next-line
        const i = n.group;
        const l = hulls[i] || (hulls[i] = []);

        interface Point {
          x: number;
          y: number;
        }

        const pushPoints = (point: Point) => {
          l.push([point.x - offset, point.y - offset]);
          l.push([point.x - offset, point.y + offset]);
          l.push([point.x + offset, point.y - offset]);
          l.push([point.x + offset, point.y + offset]);
        };

        pushPoints(n);

        // TODO the points could be optimzed if neccessary
        // We only need to check two points for each corner, not four
        pushPoints({
          x: n.x + n.width,
          y: n.y,
        });

        pushPoints({
          x: n.x + n.width,
          y: n.y + n.height,
        });

        pushPoints({
          x: n.x,
          y: n.y + n.height,
        });
      });
      // create convex hulls
      const hullset = [];
      for (const i of Object.keys(hulls)) {
        const path = d3.polygonHull(hulls[i]);
        if (!path) {
          continue;
        }

        hullset.push({
          group: i,
          path,
        });
      }
      return hullset;
    },
    doRender() {
      const links: Link[] = [];
      const nodes: Node[] = [];
      const groups: Lookup<GroupNode> = {};

      data.nodes.forEach((n) => {
        const previousNode: Node | undefined = this.previousNodeLookup[n.id];

        // This tries to get the previous x, y location of a node for reuse
        // I'm not even 100% sure this does anything, I just saw an example online do it
        const { x, y } = previousNode ? previousNode : { x: 0, y: 0 };

        if (!this.expanded[n.groupId] && !groups.hasOwnProperty(n.groupId)) {
          const node: GroupNode = {
            isGroup: true,
            group: n.groupId,
            id: '' + n.groupId,
            x,
            y,
            text: `M${n.groupId}`,
            width: 50,
            height: this.size,
          };

          groups[n.groupId] = node;
          nodes.push(node);
        }

        // Save for later use
        this.nodeLookup[n.type + n.id] = n;

        const addColors = <V>(ns: Nodes[], color: V) => {
          return ns.map((nn) => [nn, color] as [Nodes, V]);
        };

        let nodesToConnect: Array<[Nodes[] | Nodes | null, NodeRelationship]> = [];
        switch (n.type) {
          case 'wet-lab data':
            break;
          case 'model-building-activity':
            nodesToConnect = [
              [n.wetLabsUsedForValidation, 'Used for validation'],
              [n.wetLabsUsedForCalibration, 'Used for calibration'],
              [n.simulationsUsedForValidation, 'Used for validation'],
              [n.simulationsUsedForCalibration, 'Used for calibration'],
              [n.used, 'Used'],
            ];
            break;
          case 'simulation data':
            nodesToConnect = [
              [n.usedModelBuildingActivity, 'Used'],
              [n.usedModelExplorationActivity, 'Used'],
            ];
            break;
          case 'model exploration activity':
            nodesToConnect = [[n.used, 'Used']];
            break;
          case 'model':
            nodesToConnect = [[n.used, 'Used']];
        }

        // haha change this name
        nodesToConnect.forEach(([nooooode, relationship]) => {
          if (nooooode === null) {
            return;
          }

          if (!Array.isArray(nooooode)) {
            nooooode = [nooooode];
          }

          nooooode.forEach((nooooode) => {
            const target = this.expanded[nooooode.groupId] ?
              nooooode.type + nooooode.id :
              '' + nooooode.groupId;

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
          x,
          y,
          // width and height are essential
          // TODO add requirement to type file
          // they are used in the other js files
          width: this.calcWidth(text),
          height: this.size,
        });
      });

      this.previousNodes = nodes;

      const simulation = d3.forceSimulation(nodes)
        .force('link', forceLink<Node, Link>(links).id((d) => d.id).strength(0.3))
        .velocityDecay(0.5)
        .force('charge', forceManyBody().strength(-1000))
        // .force('another', rightToLeftForce())
        .force('center', d3.forceCenter(this.width / 2, this.height / 2));

      const svg = d3.select(this.$refs.svg as Element);

      svg.selectAll('*').remove();

      const hull = svg.append('g')
          .attr('class', 'hulls')
          .selectAll('path')
          .data(this.convexHulls(nodes))
          .enter().append('path')
          .attr('class', 'hull')
          .attr('d', (d) => this.curve(d.path))
          .style('fill', this.fill)
          .style('opacity', 0.5)
          .on('dblclick', (d) => {
            if (this.expanded[d.group]) {
              this.expanded[d.group] = false;
              this.doRender();
            }
          });

      const link = graphing.addArrows(svg, links, { arrows: true });

      const drag = () => {
        function dragstarted(d: d3.SimulationNodeDatum) {
          if (!d3.event.active) { simulation.alphaTarget(0.3).restart(); }
          d.fx = d.x;
          d.fy = d.y;
        }

        function dragged(d: d3.SimulationNodeDatum) {
          d.fx = d3.event.x;
          d.fy = d3.event.y;
        }

        function dragended(d: d3.SimulationNodeDatum) {
          if (!d3.event.active) { simulation.alphaTarget(0); }
          d.fx = null;
          d.fy = null;
        }

        return d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended);
      };

      const scale = d3.scaleOrdinal(d3.schemeCategory10);
      const g = svg.append('g')
        .attr('stroke', '#fff')
        .selectAll('.node')
        .data(nodes)
        .join('g')
        .attr('class', 'node')
        // @ts-ignore
        .call(drag());

      this.nodesSelection = g
        .append('rect')
        .attr('width', (d) => d.isGroup ? d.width : this.calcWidth(d.text))
        .attr('height', this.size)
        .attr('fill', (d) => 'white')
        .style('stroke-width', 3)
        .attr('rx', (d) => !d.isGroup && d.isEntity ? this.nodeRadius : 0)
        .style('stroke', this.nodeOutline)
        .on('click', (d) => {
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
        })
        .on('dblclick', (d) => {
          if (d.isGroup) {
            this.expanded[d.group] = true;
            this.doRender();
            return;
          }
        });

      g.append('text')
        // @ts-ignore
        .attr('x', (d) => d.text.length * 4 + 5) // duplicate from above
        .attr('y', () => this.size / 2 + 5) // the extra 5 is just random
        .style('stroke-width', 0)
        .style('', '')
        .style('font-family', 'monospace')
        .style('pointer-events', 'none')
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .text((d) => d.text);

      simulation.on('tick', () => {
        if (!hull.empty()) {
            hull
              .data(this.convexHulls(nodes))
              .attr('d', (d) => this.curve(d.path));
          }

        // Unfortunently, it seems like I need to add these weird type –cast statements here
        // The following code is perfectly fine so the d3 typings must be wrong
        link
          .attr('x1', (d) => {
            const source = d.source as any as Node;
            return source.x;
          })
          .attr('y1', (d) => {
            const source = d.source as any as Node;
            return source.y + this.size / 2;
          })
          .attr('x2', (d) => {
            const target = d.target as any as Node;
            return target.x + this.calcWidth(target.text);
          })
          .attr('y2', (d) => {
            const target = d.target as any as Node;
            return target.y + this.size / 2;
          });

        g
          // @ts-ignore
          .attr('transform', (d) => `translate(${d.x}, ${d.y})`);
      });
    },
  },
  mounted() {
    this.doRender();
  },
  watch: {
    selectedNode() {
      if (!this.nodesSelection) {
        return;
      }

      this.nodesSelection
        .style('stroke', this.nodeOutline);

      if (!this.selectedNode) {
        return;
      }

      this.nodesSelection
        .style('stroke', this.nodeOutline)
        .filter((d) => d === this.selectedNode)
        .style('stroke', this.selectedOutline);
    },
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
