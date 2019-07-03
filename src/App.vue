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
import { value, onMounted, onUnmounted } from 'vue-function-api';
import { PropsDefinition, ComponentOptions } from 'vue/types/options';
import { Context } from 'vue-function-api/dist/types/vue';

function useWindowSize() {
  const windowWidth = value(window.innerWidth);
  const windowHeight = value(window.innerHeight);

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

// type FullPropType<T> = T extends { required: boolean } ? T : T | undefined;
type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type ComponentOptionsWithSetup<Props> = Omit<ComponentOptions<Vue>, 'props' | 'setup'> & {
  props?: PropsDefinition<Props>;
  setup?: (
    this: undefined,
    props: Readonly<Props>,
    context: Context,
  ) => object | null | undefined | void;
};

// when props is an object
export function createComponent<Props>(
  compOpions: ComponentOptionsWithSetup<Props>,
): ComponentOptions<Vue>;

// when props is an array
export function createComponent<Props extends string = never>(
  compOpions: ComponentOptionsWithSetup<Record<Props, any>>,
): ComponentOptions<Vue>;

export function createComponent<Props>(
  compOpions: ComponentOptionsWithSetup<Props>,
): ComponentOptions<Vue> {
  return (compOpions as any) as ComponentOptions<Vue>;
}

// This just uses vue-function-api for fun!
// See https://github.com/vuejs/rfcs/blob/function-apis/active-rfcs/0000-function-api.md
export default createComponent({
  components: { Visualizer },
  props: {
    foo: {
      type: String,
      required: true,
    },
    bar: {
      type: String,
    },
  } as const,
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
