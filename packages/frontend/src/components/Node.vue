<script lang="ts">
import { isD3 } from '@/d3';
import { createComponent } from '@/utils';
import { onMounted } from 'vue-function-api';

export default createComponent({
  name: 'Node',
  props: {
    id: { type: String, required: true },
    rx: { type: Number, required: true },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    size: { type: Number, required: true },
    text: { type: String, default: '' },
    stroke: { type: String, required: true },
  },
  setup(props, context) {
    onMounted(() => {
      if (!isD3(context.parent)) {
        throw Error('parent must be D3');
      }

      context.parent.addNode({
        id: props.id,
        rx: props.rx,
        x: props.x,
        y: props.y,
        text: props.text,
        height: props.size,
        width: props.size,
        stroke: props.stroke,
        vx: 0,
        vy: 0,
        index: 0,
        onDidClick()  {
          context.emit('click', this);
        },
        onDidMousedown()  {
          context.emit('mousedown', this);
        },
        onDidDblclick()  {
          context.emit('dblclick', this);
        },
        onDidRightClick()  {
          context.emit('contextmenu', this);
        },
      });
    });
  },
  render() {
    return null as any;
  },
});
</script>

<style scoped>
.node {
  overflow: visible;
}
</style>
