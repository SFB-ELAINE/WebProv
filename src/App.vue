<template>
  <div id="app">
    <visualizer></visualizer>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Visualizer from '@/Visualizer.vue';

export default Vue.extend({
  components: { Visualizer },
});
</script>


<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

// Override buefy!!
.notification {
  pointer-events: visible!important;
}
</style>
