<template>
  <div class="home">
    <svg ref="svg" :height="height" :width="width"></svg>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as d3 from 'd3';
import data from '@/assets/fake';
import * as fake from '@/assets/fake';
import HelloWorld from '@/components/HelloWorld.vue'; // @ is an alias to /src

const rightToLeftForce = <Node extends d3.SimulationNodeDatum>() => {
  let nodes: fake.Node[] = [];

  const doWork = (alpha: number) => {
    //
  };

  doWork.initialize = (n: fake.Node[]) => {
    nodes = n;
  };

  return doWork;
};

export default Vue.extend({
  name: 'home',
  components: {
    HelloWorld,
  },
  data: () => ({
    height: window.innerHeight,
    width: window.innerWidth,
    size: 40,
  }),
  mounted() {
    const nodes = data.nodes.map((n) => ({
      ...n,
      index: 0, // this is useless but it gets rid of a type error
    }));
    const links = data.links.map((l) => ({ ...l }));

    const simulation = d3.forceSimulation(nodes)
      // @ts-ignore
      .force('link', d3.forceLink(links).id((d) => d.id).strength(0.3))
      .velocityDecay(0.5)
      .force('charge', d3.forceManyBody().strength(-1000))
      .force('another', rightToLeftForce())
      .force('center', d3.forceCenter(this.width / 2, this.height / 2));

    const svg = d3.select(this.$refs.svg as Element);
    // svg.style

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

    const node = g
      .append('rect')
      .attr('width', (d) => d.text.length * 8 + 10) // 8 just kinda works well (10 is the padding)
      .attr('height', this.size)
      .attr('fill', (d) => 'white')
      .style('stroke-width', 3)
      .attr('rx', (d) => d.type === 'wet-lab data' || d.type === 'simulation data' ? 5 : 0)
      .style('stroke', 'rgb(22, 89, 136)');

    g.append('text')
      // @ts-ignore
      .attr('x', (d) => d.text.length * 4 + 5) // duplicate from above
      .attr('y', () => this.size / 2 + 5) // the extra 5 is just random
      .style('stroke-width', 0)
      .style('', '')
      .style('font-family', 'monospace')
      .style('user-select', 'none')
      .style('text-anchor', 'middle')
      .text((d) => d.text);

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

      g
        // @ts-ignore
        .attr('transform', (d) => `translate(${d.x}, ${d.y})`);
    });
  },
});
</script>
