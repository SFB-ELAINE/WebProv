<template>
  <card title="Prov DM Legend">
    <div class="legend">
      
      <div v-for="node in nodes" :key="node.type" class="legend--item">
        <d3 :height="25" :width="100">
          <node
            class="legend--block"
            :rx="node.rx || 0"
            :id="node.type"
            :size="25"
            :stroke="node.color"
          ></node>
        </d3>
        <div class="legend--text">{{ node.type }}</div>
      </div>

      <div class="legend--item" v-for="item in relationshipLegend" :key="item.relationship">
        <d3 :height="25" :width="100" arrows :arrow-size="5">
          <node
            class="legend--block"
            :rx="item.targetRadius"
            id="two"
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
            :rx="item.sourceRadius"
            id="one"
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
import { relationshipColors } from '@/constants';
import Card from '@/components/Card.vue';
import D3 from '@/components/D3.vue';
import Relationship from '@/components/Relationship.vue';
import Node from '@/components/Node.vue';
import { createComponent } from '@/utils';
import { computed } from 'vue-function-api';

export default createComponent({
  name: 'ProvLegendCard',
  components: { Node, Card, Relationship, D3 },
  props: {
    nodeRadius: { type: Number, required: true },
    nodeOutline: { type: String, required: true },
    studyOutline: { type: String, required: true },
  },
  setup(props) {
    return {
      relationshipLegend: computed(() => {
        return Object.entries(relationshipColors).map(([relationship, info]) => {
          return {
            ...info,
            sourceRadius: info.source === 'entity' ? props.nodeRadius : 0,
            targetRadius: info.target === 'entity' ? props.nodeRadius : 0,
            relationship,
          };
        });
      }),
      nodes: [
        {
          type: 'Entity',
          color: props.nodeOutline,
          rx: props.nodeRadius,
        },
        {
          type: 'Activity',
          color: props.nodeOutline,
        },
        {
          type: 'Study',
          color: props.studyOutline,
        },
      ],
    };
  },
});
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
