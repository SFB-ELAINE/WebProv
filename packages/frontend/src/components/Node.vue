<template>
  <svg></svg>  
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import * as d3 from 'd3';

export default Vue.extend({
  name: 'Node',
  props: {
    type: String as PropType<'entity' | 'activity'>,
    radius: Number as PropType<number>,
    height: Number as PropType<number>,
    width: Number as PropType<number>,
    stroke: String as PropType<string>,
  },
  computed: {
    rx(): number {
      return this.type === 'entity' ? this.radius : 0;
    },
  },
  methods: {
    doRender() {
      const svg = d3.select(this.$el);

      const g = svg.append('g')
        .attr('stroke', '#fff')
        .selectAll('.node')
        .data([{}])
        .join('g')
        .attr('class', 'node')
        .append('rect')
        .attr('width', this.width)
        .attr('height', this.height)
        .attr('fill', (d) => 'white')
        .style('stroke-width', 3)
        .attr('rx', (d) => this.rx)
        .style('stroke', this.stroke);
    },
  },
  mounted() {
    this.doRender();
  },
});
</script>
