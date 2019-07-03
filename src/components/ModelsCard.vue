<template>
  <card title="Edit Model">
    <div>
      <b-field class="field" label="Model">
        <b-input 
          type="number" 
          :value="model.id"
          @input="setModel"
        ></b-input>
      </b-field>
      <b-field class="field" label="Source">
        <b-input 
          :value="model.bibInformation"
          @input="setBibInformation"
        ></b-input>
      </b-field>
    </div>
    <template v-slot:footer>
      <a class="card-footer-item" @click="deleteModel">Cancel</a>
      <a class="card-footer-item" @click="cancel">Delete</a>
      <a class="card-footer-item" @click="save">Save</a>
    </template>
  </card>
</template>


<script lang="ts">
import Card from '@/components/Card.vue';
import { ModelInformation } from '@/specification';
import { uniqueId, setVue, createComponent, makeRequest } from '@/utils';
import * as backend from '@/backend';
import { value } from 'vue-function-api';

export default createComponent({
  components: { Card },
  props: {
    model: {
      type: Object as () => ModelInformation,
      required: true,
    },
  },
  setup(props, context) {
    const searchModel = value('');

    function deleteModel() {
      makeRequest(() => backend.deleteModel(props.model.id));
    }

    function addModel() {
      // TODO
      // this.models.push({
      //   id: uniqueId(),
      // });
      // const model = this.models[this.models.length - 1];
      // this.makeRequest(() => backend.updateOrCreateModel(model.id, model));
    }

    function setModel(i: number, model: string) {
      // convert the model to a number if possible
      // if it is a number but the given string is empty, set to undefined
      setVue(props.model, 'id', model === '' ? undefined : +value);
      // TODO
      makeRequest(() => backend.updateOrCreateModel(props.model, ['id']));
    }

    function setBibInformation(i: number, source: string) {
      setVue(props.model, 'bibInformation', source);
      makeRequest(() => backend.updateOrCreateModel(props.model, ['bibInformation']));
    }

    return {
      deleteModel,
      addModel,
      setModel,
      searchModel,
      setBibInformation,
      cancel() {
        context.emit('cancel');
      },
      save() {
        // TODO
        context.emit('save');
      },
    };
  },
});
</script>

<style lang="scss" scoped>
.field ::v-deep .label {
  margin-bottom: 0.1em!important;
}
</style>
