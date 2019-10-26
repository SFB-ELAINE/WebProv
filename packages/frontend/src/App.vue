<template>
  <div id="app">
    <visualizer
      :window-height="windowHeight"
      :window-width="windowWidth"
    ></visualizer>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Visualizer from '@/Visualizer.vue';
import { ref, onMounted, onUnmounted, createComponent } from '@vue/composition-api';

function useWindowSize() {
  const windowWidth = ref(window.innerWidth);
  const windowHeight = ref(window.innerHeight);

  const update = () => {
    windowWidth.value = window.innerWidth;
    windowHeight.value = window.innerHeight;
  };

  onMounted(() => {
    window.addEventListener('resize', update);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', update);
  });

  return { windowWidth, windowHeight };
}

export default createComponent({
  components: { Visualizer },
  setup(props) {
    return useWindowSize();
  },
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
