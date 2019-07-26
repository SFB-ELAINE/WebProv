<template>
  <vue-fab :actions="actions" v-on="on"></vue-fab>
</template>

<script lang="ts">
import { createComponent } from '@/utils';
import VueFab from 'vue-fab';

export interface FabAction {
  name: string;
  icon: string;
  callback: () => void;
}

export default createComponent({
  name: 'Fab',
  components: {
    VueFab,
  },
  props: {
    actions: {
      type: Array as () => FabAction[],
      required: true,
    },
  },
  setup(props) {
    const on: { [k: string]: () => void } = {};
    props.actions.forEach((action) => {
      on[action.name] = action.callback;
    });

    return {
      on,
    };
  },
});
</script>

<style lang="sass" scoped>

</style>