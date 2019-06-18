<template>
  <card title="Editor Tools">
    <b-field label="Node">
      <div class="nodes">
        <d3 
          :height="30" 
          :width="30" 
          class="node"
          drag
        >
          <node
            :size="30"
            :rx="nodeRadius"
            id="one"
            :stroke="nodeOutline"
            @mousedown="$emit('create-entity')"
          ></node>
        </d3>
        <div class="spacer"></div>
        <d3 
          :height="30" 
          :width="30"
          drag
          class="node"
        >
          <node
            :size="30"
            :rx="0"
            id="one"
            :stroke="nodeOutline"
            @mousedown="$emit('create-activity')"
          ></node>
        </d3>
      </div>
    </b-field>
  </card>
</template>


<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import Card from '@/components/Card.vue';
import D3 from '@/components/D3.vue';
import Node from '@/components/Node.vue';

@Component({
  components: { Card, D3, Node },
})
export default class NodePalette extends Vue {
  @Prop({ type: Number, required: true }) public nodeRadius!: number;
  @Prop({ type: String, required: true }) public nodeOutline!: string;
}
</script>

<style lang="scss" scoped>
.nodes {
  display: flex;
}

.node:hover {
  cursor: all-scroll;
}

.spacer {
  margin: 5px;
}
</style>
