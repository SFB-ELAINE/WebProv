<template>
  <card title="Prov DM Legend">
    <div class="legend">
      
      <div v-for="type in ['entity', 'activity']" :key="type" class="legend--item">
        <d3 :height="25" :width="100">
          <node
            class="legend--block"
            :rx="type === 'entity' ? nodeRadius : 0"
            :id="type"
            :size="25"
            :stroke="nodeOutline"
          ></node>
        </d3>
        <div class="legend--text">{{ type | uppercase }}</div>
      </div>

      <div class="legend--item" v-for="item in relationshipLegend" :key="item.relationship">
        <d3 :height="25" :width="100" arrows :arrow-size="5">
          <node
            class="legend--block"
            :rx="item.sourceRadius"
            id="one"
            :size="25"
            :stroke="nodeOutline"
          ></node>
          <relationship
            source="one"
            target="two"
            :color="item.color"
          ></relationship>
          <node
            class="legend--block"
            :rx="item.targetRadius"
            id="two"
            :size="25"
            :x="75"
            :stroke="nodeOutline"
          ></node>
        </d3>

        <div class="legend--text">{{ item.relationship }}</div>
      </div>

    </div>
  </card>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { relationshipColors } from '@/constants';
import Card from '@/components/Card.vue';
import D3 from '@/components/D3.vue';
import Relationship from '@/components/Relationship.vue';
import Node from '@/components/Node.vue';
import { uppercase } from '@/utils';

@Component({
  components: { Node, Card, Relationship, D3 },
  filters: {
    uppercase,
  },
})
export default class ProvLegend extends Vue {
  @Prop({ type: Number, required: true }) public nodeRadius!: number;
  @Prop({ type: String, required: true }) public nodeOutline!: string;

  get relationshipLegend() {
    return Object.entries(relationshipColors).map(([relationship, info]) => {
      return {
        ...info,
        sourceRadius: info.source === 'entity' ? this.nodeRadius : 0,
        targetRadius: info.target === 'entity' ? this.nodeRadius : 0,
        relationship,
      };
    });
  }
}
</script>


<style lang="scss" scoped>
.legend--item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.legend--block {
  height: 25px;
  width: 25px;
}

.legend--text {
  margin-left: 20px;
}
</style>
