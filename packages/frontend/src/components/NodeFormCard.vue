<template>
  <card :title="`Node (${getLabel(node)})`">

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

    <b-field label="Label">
      <b-input type="string" :value="node.label" @input="labelChange"></b-input>
    </b-field>

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

    <b-field label="Related To" style="display: flex; flex-direction: column">
      <div v-if="relatedToLabel" style="margin-top: -0.3em; display: flex; align-items: center; justify-content: space-between">
        <div>
          Related to "{{ relatedToLabel }}"
        </div>
        <button class="here" style="text-transform: uppercase" @click="clearRelatedTo">Clear</button>
      </div>
      <div v-else-if="nodeToRelate" style="margin-top: -0.3em; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center">
        <div>
          Click another node...
        </div>
        <button class="here" style="text-transform: uppercase" @click="$emit('relate', undefined)">Cancel</button>

      </div>
      <div v-else style="margin-top: -0.3em; font-size: 0.85rem">
        This node is not currently related to any other node. To relate this node, click <button class="here" @click="$emit('relate', node)">here</button> and then immediately select another node.
      </div>
    </b-field>

    <b-field v-for="key in definedFields" :key="key" :label="key">
      <b-input v-if="!definedFieldsOptions[key]" :value="fieldsLookup[key] ? fieldsLookup[key].value : ''" @input="updateDefinedKey(key, $event)" type="textarea" class="defined-input"></b-input>
      <b-select v-else :value="fieldsLookup[key] ? fieldsLookup[key].value : ''" @input="updateDefinedKey(key, $event)" expanded>
        <option :value="undefined">None</option>
        <option 
          v-for="option in definedFieldsOptions[key]" 
          :key="option" 
          :value="option"
        >
          {{ option }}
        </option>
      </b-select>
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
  makeLookup,
} from 'common';
import { createComponent, computed, watch } from '@vue/composition-api';
import { getLabel } from '../utils';

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
    nodes: { type: Array as () => ProvenanceNode[], required: true },
    getLabel: { type: Function as unknown as () => ((node: ProvenanceNode) => string), required: true },
    nodeToRelate: { type: Object as () => ProvenanceNode, required: false },
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
          props.definition.informationFields.map((field) => field.split(",")[0]) : [] :
          []
    ));

    // See schemas.ts for more informatio about "informationFields"
    // Basically, these fileds are defined and can either be a text field
    // or an dropdown with options
    const definedFieldsOptions = computed(() => {
      if (!props.definition || !props.definition.informationFields) return {};
      const lookup: Record<string, string[] | undefined> = {};
      props.definition.informationFields.forEach((field) => {
        const [fieldName, ...options] = field.split(",");
        if (options.length === 0) return;
        lookup[fieldName] = options;
      })

      return lookup;
    })

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

    function clearRelatedTo() {
      updateNode('relatedTo', '')
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

    // Updated a defined "informationField"
    // Initially, this information field won't actually exist in the backend
    // But as you can see, we are lazily creating the node using a simple conditional
    function updateDefinedKey(key: string, newValue: string) {
      // If the field isn't defined yet (ie. not in the DB)
      let informationNode = fieldsLookup.value[key];

      // Ok so a bit of a hack but this ensures that we only send *one* request for this node
      // We assume that this node will be created quite quickly
      // As the user continues to edit the value, the node will be updated instead
      // Since we have debouncing, things *should* be ok
      // There is a small chance that an edit request somehow finishes *before* the create request
      // Note that the handler of "update:information:add" also adds the the information node array
      // Sooo "informationNode" should be defined within milliseconds
      // From testing, it seems like this logic works well enough
      const id = props.node.id + '///' + key;
      if (!informationNode && !sentRequests[id]) {
        sentRequests[id] = true;

        // After 10000 seconds, set to false again
        // Things *should* have returned by then
        setTimeout(() => {
          sentRequests[id] = false;
        }, 5000)

        informationNode = {
          id: uniqueId(),
          key,
          value: newValue,
        };

        context.emit('update:information:add', informationNode);
      } else {
        updateInformationNode(informationNode, 'value', newValue);
      }
    }

    const relatedToLabel =  computed(() => {
      // console.log(`Related to label: ${props.node.id} -> ${props.node.relatedTo}`)
      const n = props.node.relatedTo ? props.nodes.find((node) => node.id === props.node.relatedTo) : undefined
      return n ? props.getLabel(n) : undefined;
    });

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
      definedFieldsOptions,
      relatedToLabel,
      clearRelatedTo,
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

/* Making button look like link */
.here {
  background: none!important;
  border: none;
  padding: 0!important;
  /*optional*/
  font-family: arial, sans-serif;
  /*input has OS specific font-family*/
  color: #4299E1;
  cursor: pointer;
}

.here:hover {
  text-decoration: underline;
}
</style>