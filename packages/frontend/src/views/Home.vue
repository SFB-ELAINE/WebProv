<template>
  <div class="home">
    <svg ref="svg" :height="height" :width="width"></svg>
    <b-collapse v-if="selectedNode" class="card" aria-id="contentIdForA11y3">
        <div
          slot="trigger" 
          slot-scope="props"
          class="card-header"
          role="button"
          aria-controls="contentIdForA11y3"
        >
          <p class="card-header-title">
            Node Information
          </p>
          <a class="card-header-icon">
            <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"></b-icon>
          </a>
        </div>
        <div class="card-content">
          <div class="content information">
            <div v-for="([key, value], index) in informationFields" :key="key">
              <div class="field-title">{{ key }}</div>
              <div class="field-text">{{ value }}</div>
              <div v-if="index !== informationFields.length - 1" class="field-spacer"></div>
            </div>
            <!-- Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus nec iaculis mauris.
            <a>#buefy</a>. -->
          </div>
        </div>
        <footer class="card-footer">
            <!-- <a class="card-footer-item">Save</a> -->
            <a class="card-footer-item">Edit</a>
            <a class="card-footer-item">Delete</a>
        </footer>
    </b-collapse>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as d3 from 'd3';
import * as data from '@/assets/test';
import HelloWorld from '@/components/HelloWorld.vue'; // @ is an alias to /src
import forceLink from '@/link';
import forceManyBody from '@/manyBody';
import { NodeType, Nodes } from 'specification';

function assertUnreachable(x: never): never {
  throw new Error('Didn\'t expect to get here');
}

interface BaseNode {
  x: number;
  y: number;
  group: number;
  text: string;
}

interface GroupNode extends BaseNode {
  isGroup: true;
  id: string;
  size: number;
  nodes: Node[]; // TODO WRONG
  count: number;
  linkCount: number;
}

interface SingleNode extends BaseNode {
  isGroup: false;
  type: NodeType;
  id: string;
  width: number;
  height: number;
}

type Node = SingleNode | GroupNode;

interface Link {
  source: string;
  target: string;
}

interface Lookup<T> { [k: string]: T; }

const notNull = <T>(v: T | null): v is T => {
  return v !== null;
};

interface Data {
  height: number;
  width: number;
  size: number;
  selectedNode: null | SingleNode;
  nodeOutline: string;
  selectedOutline: string;
  nodesSelection: null | d3.Selection<SVGRectElement, any, SVGElement, {}>;
  nodeLookup: Lookup<Nodes>;
  hullOffset: number;
  expandedModels: { [model: string]: boolean | undefined };
  curve: d3.Line<[number, number]>;
  expanded: Lookup<boolean | undefined>;
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
  name: 'home',
  components: {
    HelloWorld,
  },
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
      expandedModels: {},
      curve: d3.line().curve(d3.curveCardinalClosed.tension(0.85)),
      expanded: {},
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
          toReturn.push(['ModelNumber', '' + node.modelInformation.modelNumber]);
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
        // eslint-disable-next-line
        const i = n.group;
        const l = hulls[i] || (hulls[i] = []);

        l.push([n.x - offset, n.y - offset]);
        l.push([n.x - offset, n.y + offset]);
        l.push([n.x + offset, n.y - offset]);
        l.push([n.x + offset, n.y + offset]);
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
  },
  mounted() {
    const links: Link[] = [];

    // TODO RENAME
    const nodes: Node[] = [];
    data.nodes.forEach((n) => {
      const source = n.type + n.id;

      // Save for later use
      this.nodeLookup[source] = n;

      let nodesToConnect: Nodes[] = [];
      switch (n.type) {
        case 'wet-lab data':
          break;
        case 'model-building-activity':
          nodesToConnect = [
            ...n.wetLabsUsedForValidation,
            ...n.wetLabsUsedForCalibration,
            ...n.simulationsUsedForValidation,
            ...n.simulationsUsedForCalibration,
            ...n.used,
          ];
          break;
        case 'simulation data':
          nodesToConnect = [n.usedModelBuildingActivity, n.usedModelBuildingActivity].filter(notNull);
          break;
        case 'model exploration activity':
          nodesToConnect = [n.used];
          break;
        case 'model':
          nodesToConnect = [n.used];
      }

      // haha change this name
      nodesToConnect.forEach((nooooode) => {
        links.push({
          source,
          target: nooooode.type + nooooode.id,
        });
      });

      const text = this.getText(n);
      nodes.push({
        isGroup: false as false, // TODO
        id: source,
        text,
        type: n.type,
        group: n.groupId,
        x: 0,
        y: 0,
        // width and height are essential
        // TODO add requirement to type file
        // they are used in the other js files
        width: this.calcWidth(text),
        height: this.size,
      });
    });

    const simulation = d3.forceSimulation(nodes)
      .force('link', forceLink<Node, Link>(links).id((d) => d.id).strength(0.3))
      .velocityDecay(0.5)
      .force('charge', forceManyBody().strength(-1000))
      // .force('another', rightToLeftForce())
      .force('center', d3.forceCenter(this.width / 2, this.height / 2));

    const svg = d3.select(this.$refs.svg as Element);

    svg.append('svg:defs').selectAll('marker')
      .data(['end'])  // Different link/path types can be defined here
      .enter().append('svg:marker')  // This section adds in the arrows
      .attr('id', String)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 10)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5');

    const hull = svg.append('g')
        .attr('class', 'hulls')
        .selectAll('path')
        .data(this.convexHulls(nodes))
        .enter().append('path')
        .attr('class', 'hull')
        .attr('d', (d) => this.curve(d.path))
        .style('fill', this.fill)
        .on('click', (d) => {
          this.expandedModels[d.group] = false;
          // this.renderGroups(); TODO
        });

    const link = svg.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (d) => Math.sqrt(3))
      .attr('marker-end', 'url(#end)'); // This, along with the defs above, adds the arrows

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
      .attr('stroke-width', 1.5)
      .selectAll('.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      // @ts-ignore
      .call(drag());

    this.nodesSelection = g
      .append('rect')
      .attr('width', (d) => d.isGroup ? 20 : this.calcWidth(d.text))
      .attr('height', this.size)
      .attr('fill', (d) => 'white')
      .style('stroke-width', 3)
      .attr('rx', (d) => !d.isGroup && (d.type === 'wet-lab data' || d.type === 'simulation data') ? 5 : 0)
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
      .on('dblclick', () => {
        console.log('dblclick');
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

      // Unfortunently, it seems like I need to add the ts-ignore statements here
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
.card {
  position: absolute;
  right: 20px;
  top: 20px;
  width: 350px;
}

.information {
  text-align: left;
}

.field-title {
  font-weight: bold;
}

.field-spacer {
  margin: 5px 0;
}
</style>
