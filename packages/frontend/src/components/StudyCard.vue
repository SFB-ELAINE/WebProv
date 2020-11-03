<template>
  <card title="Study">
    <div>
      <b-field class="field" label="Reference (ID)">
        <b-input 
          :value="study.source"
          @input="setSource"
        ></b-input>
      </b-field>
      <b-field class="field" label="Signaling Pathway">
        <b-input 
          :value="study.signalingPathway"
          @input="setSignalingPathway"
        ></b-input>
      </b-field>
    </div>
    <template v-slot:footer>
      <a class="card-footer-item" @click="close">Close</a>
      <a class="card-footer-item" @click="deleteStudy">Delete</a>
    </template>
  </card>
</template>


<script lang="ts">
import Card from '@/components/Card.vue';
import { Study, uniqueId } from 'common';
import { setVue, makeRequest } from '@/utils';
import { ref, createComponent } from '@vue/composition-api';

export default createComponent({
  name: 'StudyCard',
  components: { Card },
  props: {
    study: {
      type: Object as () => Study,
      required: true,
    },
  },
  setup(props, context) {
    const searchModel = ref('');

    const close = () => {
      context.emit('close');
    };

    const deleteStudy = () => {
      context.emit('delete');
    };

    const setSource = (source: string) => {
      setVue(props.study, 'source', source);
      context.emit('update');
    };

    const setSignalingPathway = (signalingPathway: string) => {
      setVue(props.study, 'signalingPathway', signalingPathway);
      context.emit('update');
    };

    return {
      deleteStudy,
      setSignalingPathway,
      searchModel,
      setSource,
      close,
    };
  },
});
</script>

<style lang="scss" scoped>
.field ::v-deep .label {
  margin-bottom: 0.1em!important;
}
</style>
