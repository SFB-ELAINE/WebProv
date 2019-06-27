<script lang="ts">
import * as d3 from 'd3';
import { ID3, isD3 } from '@/d3';
import { Component, Vue, Prop } from 'vue-property-decorator';

// Called Relationship because <link> is a builtin html tag
@Component
export default class Relationship extends Vue {
  @Prop({ type: Number, required: true }) public target!: number;
  @Prop({ type: Number, required: true }) public source!: number;
  @Prop({ type: String, required: false }) public color?: string;

  public mounted() {
    if (!isD3(this.$parent)) {
      throw Error('parent must be D3');
    }

    this.$parent.addLink({
      target: this.target,
      source: this.source,
      color: this.color,
    });
  }

  public render() {
    return null;
  }
}
</script>


<style scoped>

</style>
