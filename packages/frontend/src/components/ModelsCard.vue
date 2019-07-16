<template>
  <card title="Simulation Study">
    <div>
      <b-field class="field" label="Study ID">
        <b-input 
          type="number" 
          :value="model.id"
          @input="setModel"
        ></b-input>
      </b-field>
      <b-field class="field" label="Source">
        <b-input 
          :value="model.source"
          @input="setSource"
        ></b-input>
      </b-field>
    </div>
    <template v-slot:footer>
      <a class="card-footer-item" @click="cancel">Cancel</a>
      <a class="card-footer-item" @click="deleteModel">Delete</a>
      <a class="card-footer-item" @click="save">Save</a>
    </template>
  </card>
</template>


<script lang="ts">
import Card from '@/components/Card.vue';
import { SimulationStudy, uniqueId } from 'common';
import { setVue, createComponent, makeRequest } from '@/utils';
import { value } from 'vue-function-api';

export default createComponent({
  components: { Card },
  props: {
    model: {
      type: Object as () => SimulationStudy,
      required: true,
    },
  },
  setup(props, context) {
    const searchModel = value('');

    const cancel = () => {
      context.emit('cancel');
    };

    const deleteModel = () => {
      context.emit('delete');
    };

    const setModel = (model: string) => {
      // convert the model to a number if possible
      // if it is a number but the given string is empty, set to undefined
      setVue(props.model, 'id', model === '' ? undefined : +model);
    };

    const setSource = (source: string) => {
      setVue(props.model, 'source', source);
    };

    const setSignalingPathway = (signalingPathway: string) => {
      setVue(props.model, 'signalingPathway', signalingPathway);
    };

    const save = () => {
      context.emit('save');
      cancel();
    };

    return {
      deleteModel,
      setModel,
      searchModel,
      setSource,
      cancel,
      save,
    };
  },
});
</script>

<style lang="scss" scoped>
.field ::v-deep .label {
  margin-bottom: 0.1em!important;
}
</style>
