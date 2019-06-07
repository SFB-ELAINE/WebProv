<script lang="ts">
import * as d3 from 'd3';
import { ID3, isD3 } from '@/components/d3';
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class Node extends Vue {
  @Prop({ type: String, required: true }) public id!: string;
  @Prop({ type: Number, required: true }) public rx!: number;
  @Prop({ type: Number, required: true }) public size!: number;
  @Prop({ type: String, required: true }) public stroke!: string;

  public mounted() {
    if (!isD3(this.$parent)) {
      throw Error('parent must be D3');
    }

    this.$parent.addNode({
      id: this.id,
      rx: this.rx,
      size: this.size,
      stroke: this.stroke,
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
