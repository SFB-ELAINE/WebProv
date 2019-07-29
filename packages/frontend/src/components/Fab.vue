<template>
  <vue-fab 
    :actions="actionsWithTooltip" 
    v-on="on"
    class="fab"
  ></vue-fab>
</template>

<script lang="ts">
import { createComponent } from '@/utils';
import VueFab from 'vue-fab';
import { computed } from 'vue-function-api';

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
      actionsWithTooltip: computed(() => {
        return props.actions.map((action) => ({ ...action, tooltip: action.name }));
      }),
    };
  },
});
</script>

<style lang="scss" scoped>
.fab {
  right: 4vh;

  &:hover {
    cursor: pointer;
  }
}
</style>