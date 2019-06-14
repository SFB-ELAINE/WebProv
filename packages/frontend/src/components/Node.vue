<script lang="ts">
import * as d3 from 'd3';
import { ID3, isD3 } from '@/d3';
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class Node extends Vue {
  @Prop({ type: String, required: true }) public id!: string;
  @Prop({ type: Number, required: true }) public rx!: number;
  @Prop({ type: Number, default: 0 }) public x!: number;
  @Prop({ type: Number, default: 0 }) public y!: number;
  @Prop({ type: Number, required: true }) public size!: number;
  @Prop({ type: String, default: '' }) public text!: string;
  @Prop({ type: String, required: true }) public stroke!: string;

  public mounted() {
    if (!isD3(this.$parent)) {
      throw Error('parent must be D3');
    }

    const that = this;
    this.$parent.addNode({
      id: this.id,
      rx: this.rx,
      x: this.x,
      y: this.y,
      text: this.text,
      height: this.size,
      width: this.size,
      stroke: this.stroke,
      onDidClick()  {
        that.$emit('click', this);
      },
      onDidMousedown()  {
        that.$emit('mousedown', this);
      },
      onDidDblclick()  {
        that.$emit('dblclick', this);
      },
    });
  }

  public render() {
    return null;
  }
}
</script>

<style scoped>
.node {
  overflow: visible;
}
</style>
