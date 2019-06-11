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
import { CB, emitter, ID3, Link, Node } from '@/d3';
import { Component, Vue, Prop } from 'vue-property-decorator';

interface MyLink extends Link {
  color: string;
}

export const makeLookup = <T extends { id: string }>(array: Iterable<T>) => {
  const lookup: { [k: string]: T } = {};
  for (const item of array) {
    lookup[item.id] = item;
  }
  return lookup;
};

// This id is used to ensure that the ID atttribute doesn't conflict with others
// Since id is global
let id = 0;

@Component
export default class D3 extends Vue implements ID3 {
  @Prop({ type: String, default: '#000' }) public defaultStrokeColor!: string;
  @Prop({ type: Boolean, default: false }) public arrows!: boolean;
  @Prop({ type: Number, default: 100 }) public height!: number;
  @Prop({ type: Number, default: 100 }) public width!: number;
  @Prop({ type: Number, default: 6 }) public arrowSize!: number;

  public isD3: true = true;
  public links: MyLink[] = [];
  public nodes: Node[] = [];

  public addLink(link: Link) {
    this.links.push({
      ...link,
      color: link.color ? link.color : this.defaultStrokeColor,
    });
  }

  public addNode(node: Node) {
    this.nodes.push(node);
  }

  get nodeLookup() {
    return makeLookup(this.nodes);
  }

  public mounted() {
    const svg = d3.select(this.$refs.svg as Element);

    const g = svg.append('g')
      .attr('stroke', '#fff')
      .selectAll('.node')
      .data(this.nodes)
      .join('g')
      .attr('class', 'node')
      .append('rect')
      .attr('width', (d) => d.size)
      .attr('height', (d) => d.size)
      .attr('fill', (d) => 'white')
      .style('stroke-width', 3)
      .attr('rx', (d) => d.rx)
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .style('stroke', (d) => d.stroke);

    const data = this.links.map(({ color }) => color);

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

    const makeAttr = (xy: 'x' | 'y', st: 'source' | 'target') => (d: Link) => {
      const node = this.nodeLookup[d[st]];
      const toAdd = xy === 'y' ? node.size / 2 : st === 'source' ? node.size : 0;
      return node[xy] + toAdd;
    };

    const link = svg.append('g')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(this.links)
      .join('line')
      .attr('stroke-width', (d) => 3)
      .attr('stroke', (d) => d.color)
      .attr('x1', makeAttr('x', 'source'))
      .attr('y1', makeAttr('y', 'source'))
      .attr('x2', makeAttr('x', 'target'))
      .attr('y2', makeAttr('y', 'target'));

    if (this.arrows) {
      // This, along with the defs above, adds the arrows
      link.attr('marker-end', (d) => `url(#${id}-${d.color})`);
    }

    id++;
  }
}
</script>

<style lang="scss" scoped>
.svg {
  overflow: visible;
}
</style>
