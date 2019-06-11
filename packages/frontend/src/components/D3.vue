<template>
    <svg 
      ref="svg" 
      class="svg"
      :height="height"
      :width="width"
    ><slot></slot></svg>
</template>

<script lang="ts">
import * as d3 from 'd3';
import { CB, emitter, ID3, Link, Node, Listeners, Hull } from '@/d3';
import { Component, Vue, Prop } from 'vue-property-decorator';
import forceLink from '@/link';
import forceManyBody from '@/manyBody';
import { makeLookup, Lookup, Watch } from '@/utils';

interface MyLink extends Link {
  color: string;
}

const ordinalScale = d3.scaleOrdinal(d3.schemeCategory10);

// This id is used to ensure that the ID atttribute doesn't conflict with others
// Since id is global
let id = 0;

@Component
export default class D3 extends Vue implements ID3 {
  @Prop({ type: String, default: '#000' }) public defaultStrokeColor!: string;
  @Prop({ type: Boolean, default: false }) public arrows!: boolean;
  @Prop({ type: Boolean, default: false }) public force!: boolean;
  @Prop({ type: Boolean, default: false }) public hulls!: boolean;
  @Prop({ type: Number, default: 100 }) public height!: number;
  @Prop({ type: Number, default: 100 }) public width!: number;
  @Prop({ type: Number, default: 6 }) public arrowSize!: number;
  @Prop({ type: Number, default: 40 }) public hullOffset!: number;
  @Prop({ type: Array, default: () => [] }) public nodes!: Node[];
  @Prop({ type: Array, default: () => [] }) public links!: Link[];
  @Prop({ type: Function, required: false }) public hullClick?: (node: Hull) => void;
  @Prop({ type: Function, required: false }) public hullDblclick?: (node: Hull) => void;
  @Prop({ type: Function, required: false }) public nodeClick?: (node: Node) => void;
  @Prop({ type: Function, required: false }) public nodeDblclick?: (node: Node) => void;

  public isD3: true = true;
  public addedLinks: MyLink[] = [];
  public addedNodes: Node[] = [];

  public curve = d3.line().curve(d3.curveCardinalClosed.tension(0.85));

  get allNodes() {
    return [
      ...this.addedNodes,
      ...this.nodes,
    ];
  }

  get allLinks(): MyLink[] {
    const links = [...this.links, ...this.addedLinks];

    return links.map((link) => ({
      ...link,
      color: link.color ? link.color : this.defaultStrokeColor,
    }));
  }

  get nodeLookup() {
    return makeLookup(this.allNodes);
  }

  public fill(d: { group: string }) {
    return ordinalScale(d.group);
  }

  public addLink(link: Link) {
    this.allLinks.push({
      ...link,
      color: link.color ? link.color : this.defaultStrokeColor,
    });
  }

  public addNode(node: Node) {
    this.allNodes.push(node);
  }

  public calcWidth(text?: string) {
      // 8 just kinda works well (10 is the padding)
      return (text === undefined ? 0 : text.length * 8) + 10;
    }

  public convexHulls() {
    const hulls: { [group: string]: Array<[number, number]> } = {};
    const offset = this.hullOffset;
    // create point sets
    this.allNodes.forEach((n) => {
      if (n.hullGroup === undefined) {
        // Skip allNodes that aren't in a group
        return;
      }

      // eslint-disable-next-line
      const i = n.hullGroup;
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
  }

  public doRender() {
    const svg = d3.select(this.$refs.svg as Element);
    svg.selectAll('*').remove();

    const checkAndCall = <V>(f?: (v: V, actions: ID3) => void) => (v: V) => {
      if (f) {
        f(v, this);
      }
    };

    let hull: d3.Selection<any, any, any, any> | null = null;
    if (this.hulls) {
      hull = svg.append('g')
        .attr('class', 'hulls')
        .selectAll('path')
        .data(this.convexHulls())
        .enter().append('path')
        .attr('class', 'hull')
        .attr('d', (d) => this.curve(d.path))
        .style('fill', this.fill)
        .style('opacity', 0.5);

      hull.on('click', checkAndCall(this.hullClick));
      hull.on('dblclick', checkAndCall(this.hullDblclick));
    }

    let simulation: null | d3.Simulation<Node, undefined> = null;
    if (this.force) {
      simulation = d3.forceSimulation(this.allNodes)
        .force('link', forceLink<Node, Link>(this.allLinks).id((d) => d.id).strength(0.3))
        .velocityDecay(0.5)
        .force('charge', forceManyBody().strength(-1000))
        .force('center', d3.forceCenter(this.width / 2, this.height / 2));
    }

    const data = this.allLinks.map(({ color }) => color);

    if (this.arrows) {
      svg.append('svg:defs').selectAll('marker')
        .data(data)  // Different link/path types can be defined here
        .enter().append('svg:marker')  // This section adds in the arrows
        .attr('id', (d) => `${id}-${d}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 10)
        .attr('refY', 0)
        .attr('markerWidth', this.arrowSize)
        .attr('markerHeight', this.arrowSize)
        .attr('orient', 'auto')
        .append('svg:path')
        .style('fill', (d) => d)
        .attr('d', 'M0,-5L10,0L0,5');
    }

    const link = svg.append('g')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(this.allLinks)
      .join('line')
      .attr('stroke-width', (d) => 3)
      .attr('stroke', (d) => d.color);

    if (!simulation) {
      const calcPosition = (xy: 'x' | 'y', st: 'source' | 'target') => (d: Link) => {
        const node = this.nodeLookup[d[st]];
        const toAdd = xy === 'y' ? node.height / 2 : st === 'source' ? node.width : 0;
        return node[xy] + toAdd;
      };

      link
        .attr('x1', calcPosition('x', 'source'))
        .attr('y1', calcPosition('y', 'source'))
        .attr('x2', calcPosition('x', 'target'))
        .attr('y2', calcPosition('y', 'target'));
    }

    if (this.arrows) {
      // This, along with the defs above, adds the arrows
      link.attr('marker-end', (d) => `url(#${id}-${d.color})`);
    }

    const g = svg.append('g')
      .attr('stroke', '#fff')
      .selectAll('.node')
      .data(this.allNodes)
      .join('g')
      .attr('class', 'node');

    g
      .append('rect')
      .attr('width', (d) => d.width)
      .attr('height', (d) => d.height)
      .attr('fill', (d) => 'white')
      .style('stroke-width', 3)
      .attr('rx', (d) => d.rx)
      .attr('x', (d) => d.x) // TODO
      .attr('y', (d) => d.y)
      .style('stroke', (d) => d.stroke);

    g.on('click', checkAndCall(this.nodeClick));
    g.on('dblclick', checkAndCall(this.nodeDblclick));

    if (this.force) {
      function dragstarted(d: d3.SimulationNodeDatum) {
        if (simulation && !d3.event.active) { simulation.alphaTarget(0.3).restart(); }
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(d: d3.SimulationNodeDatum) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      }

      function dragended(d: d3.SimulationNodeDatum) {
        if (simulation && !d3.event.active) { simulation.alphaTarget(0); }
        d.fx = null;
        d.fy = null;
      }

      // @ts-ignore
      // I can't get the types to work out for some reason, this definitely works though
      g.call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));
    }

    g.append('text')
      .filter((d) => d.text !== undefined)
      .attr('x', (d) => d.text!.length * 4 + 5)
      .attr('y', (d) => d.height / 2 + 5) // the extra 5 is just random
      .style('stroke-width', 0)
      .style('', '')
      .style('font-family', 'monospace')
      .style('pointer-events', 'none')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text((d) => {
        return d.text!;
      });

    if (simulation) {
      simulation.on('tick', () => {
        if (hull && !hull.empty()) {
            hull
              .data(this.convexHulls())
              .attr('d', (d) => this.curve(d.path));
          }

        // Unfortunently, it seems like I need to add these weird type –cast statements here
        // The following code is perfectly fine so the d3 typings must be wrong
        // TODO These functions could likely be consolidated with the above `calcPosition` function
        link
          .attr('x1', (d) => {
            const source = d.source as any as Node;
            return source.x;
          })
          .attr('y1', (d) => {
            const source = d.source as any as Node;
            return source.y + source.height / 2;
          })
          .attr('x2', (d) => {
            const target = d.target as any as Node;
            return target.x + this.calcWidth(target.text);
          })
          .attr('y2', (d) => {
            const target = d.target as any as Node;
            return target.y + target.height / 2;
          });

        g
          // @ts-ignore
          .attr('transform', (d) => `translate(${d.x}, ${d.y})`);
      });
    }

    // make sure we increase the id for next time render of this component
    id++;
  }

  public mounted() {
    this.doRender();
  }

  @Watch<D3>('nodes')
  public reRenderNodes() {
    this.doRender();
  }

  @Watch<D3>('links')
  public reRenderLinks() {
    this.doRender();
  }
}
</script>

<style lang="scss" scoped>
.svg {
  overflow: visible;
}
</style>
