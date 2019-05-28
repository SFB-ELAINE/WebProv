<template>
  <div class="home">
    <svg ref="svg" :height="height" :width="width"></svg>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as d3 from 'd3';
import data from '@/assets/miserables';
import HelloWorld from '@/components/HelloWorld.vue'; // @ is an alias to /src

export default Vue.extend({
  name: 'home',
  components: {
    HelloWorld,
  },
  data: () => ({
    height: 600,
    width: 600,
  }),
  mounted() {
    const nodes = data.nodes.map((n) => ({
      ...n,
      index: 0, // this is useless but it gets rid of a type error
    }));
    const links = data.links.map((l) => ({ ...l }));

    const simulation = d3.forceSimulation(nodes)
      // @ts-ignore
      .force('link', d3.forceLink(links).id((d) => d.id))
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(this.width / 2, this.height / 2));

    const svg = d3.select(this.$refs.svg as Element);

    const link = svg.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (d) => Math.sqrt(d.value));

    const drag = (simulation: ReturnType<typeof d3.forceSimulation>) => {

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
    const node = svg.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 5)
      .attr('fill', (d) => scale(d.group + ''))
      .call(drag(simulation as any) as any);

    simulation.on('tick', () => {
      link
        // @ts-ignore
        .attr('x1', (d) => d.source.x)
        // @ts-ignore
        .attr('y1', (d) => d.source.y)
        // @ts-ignore
        .attr('x2', (d) => d.target.x)
        // @ts-ignore
        .attr('y2', (d) => d.target.y);

      node
        // @ts-ignore
        .attr('cx', (d) => d.x)
        // @ts-ignore
        .attr('cy', (d) => d.y);
    });
  },
});
</script>
