<template>
  <card title="Node">

    <b-field label="Type">
      <b-select :value="node.type" @input="typeChange" expanded>
        <option v-for="option in provenanceNodeTypes" :key="option" :value="option">{{ option }}</option>
      </b-select>
    </b-field>

    <b-field label="Label">
      <b-input type="string" :value="node.label" @input="labelChange"></b-input>
    </b-field>

    <b-field label="Study ID">
      <b-select :value="node.studyId" @input="studyIdChange" expanded>
        <!-- Undefined is a valid value -->
        <option :value="undefined"></option>
        <option 
          v-for="study in studies" 
          :key="study.studyId" 
          :value="study.studyId"
        >
          {{ study.studyId }}
        </option>
      </b-select>
    </b-field>


    <b-field label="Information Fields" style="flex-direction: column; align-items: flex-start;">
      <div v-for="(field, j) in fields" :key="j" style="display: flex">
        <b-field>
          <b-input placeholder="Key" :value="field.key" @input="updateKey(j, $event)"></b-input>
        </b-field>
        <div style="flex: 0 0 10px"></div>
        <b-field>
          <b-input placeholder="Value" :value="field.value" @input="updateValue(j, $event)"></b-input>
          <p class="control">
            <button class="button is-primary" @click="deleteField(j)">
              <b-icon icon="close"></b-icon>
            </button>
          </p>
        </b-field>
      </div>
      <b-button class="is-primary" @click="addField">
        Add Field
      </b-button>
    </b-field>

    <template v-slot:footer>
      <a class="card-footer-item" @click="$emit('close')">Close</a>
      <a class="card-footer-item" @click="$emit('delete')">Delete</a>
    </template>
  </card>
</template>

<script lang="ts">
import Card from '@/components/Card.vue';
import { createComponent, map, zip } from '../utils';
import {
  provenanceNodeTypes,
  ProvenanceNode,
  uniqueId,
  ProvenanceNodeType,
  SimulationStudy,
} from 'common';
import { computed } from 'vue-function-api';

export default createComponent({
  name: 'NodeFormCard',
  components: { Card },
  props: {
    node: { type: Object as () => ProvenanceNode, required: true },
    studies: { type: Array as () => SimulationStudy[], required: true },
  },
  setup(props, context) {
    const emitUpdate = (key: keyof ProvenanceNode) => {
      context.emit('update', props.node, key);
    };

    function updateKey(index: number, newValue: string) {
      props.node.keys[index] = newValue;
      emitUpdate('keys');
    }

    function updateValue(index: number, newValue: string) {
      props.node.values[index] = newValue;
      emitUpdate('values');
    }

    function addField() {
      props.node.keys.push('');
      props.node.values.push('');
      emitUpdate('keys');
      emitUpdate('values');
    }

    function deleteField(j: number) {
      props.node.keys.splice(j, 1);
      props.node.values.splice(j, 1);
      emitUpdate('keys');
      emitUpdate('values');
    }

    function labelChange(value: string) {
      updateNode('label', value);
    }

    function typeChange(value: ProvenanceNodeType) {
      updateNode('type', value);
    }

    function studyIdChange(value: string) {
      updateNode('studyId', value ? +value : undefined);
    }

    function updateNode<K extends keyof ProvenanceNode>(key: K, value: ProvenanceNode[K]) {
      props.node[key] = value;
      emitUpdate(key);
    }

    return {
      provenanceNodeTypes,
      deleteField,
      labelChange,
      typeChange,
      studyIdChange,
      updateNode,
      addField,
      updateValue,
      updateKey,
      fields: computed(() => {
        return map(zip(props.node.keys, props.node.values), ([key, value]) => {
          return {
            key,
            value,
          };
        });
      }),
    };
  },
});
</script>
