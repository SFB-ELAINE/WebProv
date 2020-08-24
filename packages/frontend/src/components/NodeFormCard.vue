<template>
  <card title="Node">

    <b-field label="Type">
      <b-select :value="node.definitionId" @input="definitionChange" expanded>
        <option 
          v-for="definition in definitions" 
          :key="definition.id" 
          :value="definition.id"
        >
          {{ definition.id }}
        </option>
      </b-select>
    </b-field>

<!--
    <b-field label="Label">
      <b-input type="string" :value="node.label" @input="labelChange"></b-input>
    </b-field>
-->

    <b-field label="Study ID">
      <b-select :value="node.studyId" @input="studyIdChange" expanded>
        <!-- Undefined is a valid value -->
        <option :value="undefined"></option>
        <option 
          v-for="study in studies" 
          :key="study.id" 
          :value="study.id"
        >
          {{ study.source }}
        </option>
      </b-select>
    </b-field>

    <b-field v-for="key in definedFields" :key="key" :label="key">
      <b-input :value="fieldsLookup[key] ? fieldsLookup[key].value : ''" @input="updateDefinedKey(key, $event)" type="textarea" class="defined-input"></b-input>
    </b-field>


    <b-field label="Further Information" style="flex-direction: column; align-items: flex-start;">
      <div v-for="(field, j) in extraFields" :key="j" style="display: flex">
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
import {
  ProvenanceNode,
  InformationField,
  uniqueId,
  Study,
  NodeDefinition,
} from 'common';
import { createComponent, computed, watch } from '@vue/composition-api';

const sentRequests: Record<string, boolean> = {};

export default createComponent({
  name: 'NodeFormCard',
  components: { Card },
  props: {
    node: { type: Object as () => ProvenanceNode, required: true },
    definition: { type: Object as () => NodeDefinition | undefined, required: false },
    fields: { type: Array as () => InformationField[], required: true },
    studies: { type: Array as () => Study[], required: true },
    definitions: { type: Array as () => NodeDefinition[], required: true },
  },
  setup(props, context) {
    const fieldsLookup = computed((): Record<string, InformationField> => {
      const lookup: Record<string, InformationField> = {};
      props.fields.forEach((field) => lookup[field.key] = field);
      return lookup;
    });

    const definedFields = computed((): string[] => (
      props.definition ?
        props.definition.informationFields ?
          props.definition.informationFields : [] :
          []
    ));

    const extraFields = computed((): InformationField[] => props.fields.filter((field) => (
      !definedFields.value.includes(field.key)
    )));

    function updateKey(index: number, newValue: string) {
      updateInformationNode(props.fields[index], 'key', newValue);
    }

    function updateValue(index: number, newValue: string) {
      updateInformationNode(props.fields[index], 'value', newValue);
    }

    function addField() {
      const information = {
        id: uniqueId(),
        key: '',
        value: '',
      };

      context.emit('update:information:add', information);
    }

    function deleteField(j: number) {
      context.emit('update:information:delete', props.fields[j]);
    }

    function labelChange(value: string) {
      updateNode('label', value);
    }

    function definitionChange(definitionId: string) {
      updateNode('definitionId', definitionId);
    }

    function studyIdChange(value: string | undefined) {
      updateNode('studyId', value);
    }

    function updateNode<K extends keyof ProvenanceNode>(key: K, value: ProvenanceNode[K]) {
      context.emit('update:node', props.node, key, value);
    }

    function updateInformationNode<K extends keyof InformationField>(
      information: InformationField, key: K, value: InformationField[K],
    ) {
      context.emit('update:information', information, key, value);
    }

    // This is a bit of a hacky solution.
    // Basically, we are lazily creating the information field nodes and the relationship
    // when this node card is created
    // We ensure we don't send > 1 request to create a new information node using a lookup
    watch(() => {
      definedFields.value.forEach((field) => {
        const sentId = props.node.id + '///' + field;
        if (!fieldsLookup.value[field] && !sentRequests[sentId]) {
          sentRequests[sentId] = true;
          const information = {
            id: uniqueId(),
            key: field,
            value: '',
          };

          context.emit('update:information:add', information);
        }
      });
    });

    function updateDefinedKey(key: string, newValue: string) {
      // If the field isn't defined yet (ie. not in the DB)
      if (!fieldsLookup.value[key]) {
        return;
      }

      const field = fieldsLookup.value[key];
      updateInformationNode(field, 'value', newValue);
    }

    return {
      deleteField,
      labelChange,
      definitionChange,
      studyIdChange,
      updateNode,
      addField,
      updateValue,
      updateKey,
      definedFields,
      extraFields,
      fieldsLookup,
      updateDefinedKey,
    };
  },
});
</script>

<style>
.defined-input .textarea, .defined-input {
  /* height: 100px!important; */
  min-height: 60px!important;
}

.defined-input .textarea {
  padding: 0.5em!important;
}
</style>