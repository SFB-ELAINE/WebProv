<template>
  <card>
    <div v-for="(model, i) in models" :key="i">
      <div style="display: flex">
        <h4 class="model--title">Model {{ model.modelId }}</h4>
        <div style="flex: 1"></div>
        <b-button rounded type="is-text" @click="clickChevron(i)">
          <b-icon :icon="expanded[i] ? 'chevron-up' : 'chevron-down'"></b-icon>
        </b-button>
      </div>
      <div v-if="expanded[i]">
        <b-field class="field" label="Model">
          <b-input 
            type="number" 
            :value="model.modelId"
            @input="setModel(i, $event)"
          ></b-input>
        </b-field>
        <b-field class="field" label="Source">
          <b-input 
            :value="model.bibInformation"
            @input="setBibInformation(i, $event)"
          ></b-input>
        </b-field>
        <b-button 
          type="is-primary" 
          outlined 
          style="margin-top: 5px"
          @click="deleteModel(i)"
        >
          Delete 
        </b-button>
      </div>
      <hr class="result--break" v-if="i !== models.length - 1">
    </div>
    <template v-slot:footer>
      <a class="card-footer-item" @click="addModel">Add Model</a>
    </template>
  </card>
</template>


<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import Card from '@/components/Card.vue';
import { ModelInformation } from 'specification';
import { uniqueId } from '../utils';

@Component({
  components: { Card },
})
export default class ModelsCard extends Vue {
  @Prop({ type: Array, required: true }) public models!: ModelInformation[];

  public expanded: boolean[] = [];

  public clickChevron(i: number) {
    Vue.set(this.expanded, i, !this.expanded[i]);
  }

  public deleteModel(i: number) {
    this.models.splice(i, 1);
    this.expanded.splice(i, 1);
  }

  public addModel() {
    this.models.push({
      id: uniqueId(),
    });
  }

  public setModel(i: number, value: string) {
    // convert the value to a number if possible
    // if it is a number but the given string is empty, set to undefined
    Vue.set(this.models[i], 'modelId', value === '' ? undefined : +value);
  }

  public setBibInformation(i: number, value: string) {
    Vue.set(this.models[i], 'bibInformation', value);
  }
}
</script>

<style lang="scss" scoped>
.model--title {
  font-weight: normal;
  font-size: 1.5em;
  margin-bottom: 0em;
}

.field ::v-deep .label {
  margin-bottom: 0.1em!important;
}
</style>
