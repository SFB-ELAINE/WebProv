<script lang="ts">
import * as d3 from 'd3';
import { isD3 } from '@/d3';
import { createComponent } from '@/utils';
import { onMounted } from 'vue-function-api';

export default createComponent({
  name: 'Relationship',
  props: {
    target: { type: String, required: true },
    source: { type: String, required: true },
    color: { type: String, required: false },
  },
  setup(props, context) {
    onMounted(() => {
      if (!isD3(context.parent)) {
        throw Error('parent must be D3');
      }

      context.parent.addLink({
        target: props.target,
        source: props.source,
        color: props.color,
      });
    });
  },
  render() {
    return null as any;
  },
});
</script>


<style scoped>

</style>
