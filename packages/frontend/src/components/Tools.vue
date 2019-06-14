<template>
  <card title="Editor Tools">
    <b-field label="Link Type">
      <b-select v-model="type" icon="arrow-right">
        <option v-for="r in relationships" :key="r" :value="r">{{ r }}</option>
      </b-select>
    </b-field>
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
            text="M"
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
    <div class="field has-addons">
    <p class="control">
      <a class="button">
        <b-icon icon="arrow-left"></b-icon>
        <span>Left</span>
      </a>
    </p>
    <p class="control">
      <a class="button">
        <span class="icon is-small">
          <i class="fas fa-align-center"></i>
        </span>
        <span>Center</span>
      </a>
    </p>
    <p class="control">
      <a class="button">
        <span class="icon is-small">
          <i class="fas fa-align-right"></i>
        </span>
        <span>Right</span>
      </a>
    </p>
  </div>
  </card>
</template>


<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import Card from '@/components/Card.vue';
import D3 from '@/components/D3.vue';
import Node from '@/components/Node.vue';
import { relationships } from '@/constants';

@Component({
  components: { Card, D3, Node },
})
export default class Tools extends Vue {
  @Prop({ type: Number, required: true }) public nodeRadius!: number;
  @Prop({ type: String, required: true }) public nodeOutline!: string;

  public relationships = relationships;

  public type = relationships[0];
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
