<template>
  <svg>
  </svg>
</template>

<script lang="ts">
import * as d3 from 'd3';
import { CB, emitter, ID3, Link, Node } from '@/components/d3';
import { Component, Vue, Prop } from 'vue-property-decorator';

interface MyLink extends Link {
  color: string;
}

export default class D3 extends Vue implements ID3 {
  @Prop({ type: String, default: '#000' }) public defaultStrokeColor!: string;
  @Prop({ type: Boolean, default: false }) public arrows!: boolean;

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

  public mounted() {
    const svg = d3.select(this.$el as Element);

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
      .style('stroke', (d) => d.stroke);

    const data = this.links.map(({ color }) => color);

    if (this.arrows) {
      svg.append('svg:defs').selectAll('marker')
      .data(data)  // Different link/path types can be defined here
        .enter().append('svg:marker')  // This section adds in the arrows
        .attr('id', (d) => `${d}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 10)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('svg:path')
        .style('fill', (d) => d)
        .attr('d', 'M0,-5L10,0L0,5');
    }

    const link = svg.append('g')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(this.links)
      .join('line')
      .attr('stroke-width', (d) => 3)
      .attr('stroke', (d) => d.color)
      // This, along with the defs above, adds the arrows
      .attr('marker-end', (d) => `url(#${d.color})`);
  }
}
</script>
