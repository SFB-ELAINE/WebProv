<template>
  <card title="Node">

    <b-field label="Type">
      <b-select :value="node.type" @input="typeChange" expanded>
        <option v-for="option in typeOptions" :key="option" :value="option">{{ option }}</option>
      </b-select>
    </b-field>

    <b-field label="Label">
      <b-input type="string" :value="node.label" @input="labelChange"></b-input>
    </b-field>

    <b-field label="Study ID">
      <b-input type="number" :value="node.studyId" @input="studyIdChange"></b-input>
    </b-field>

    <b-field label="Information" style="flex-direction: column; align-items: flex-start;">
      <div v-for="(field, j) in information" :key="j" style="display: flex">
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
import { Component, Vue, Prop } from 'vue-property-decorator';
import Card from '@/components/Card.vue';
import { FieldInformation, makeRequest, setVue, Watch } from '../utils';
import { provenanceNodeTypes, ProvenanceNode, Information, uniqueId, ProvenanceNodeType } from 'common';
import * as backend from '@/backend';

@Component({
  components: { Card },
})
export default class NodeForm extends Vue {
  @Prop({ type: Object, required: true }) public node!: ProvenanceNode;
  @Prop({ type: Array, required: true }) public information!: Information[];

  public typeOptions = provenanceNodeTypes;

  public updateKey(index: number, newValue: string) {
    this.updateInformationNode(this.information[index], 'key', newValue);
  }

  public updateValue(index: number, newValue: string) {
    this.updateInformationNode(this.information[index], 'value', newValue);
  }

  public addField() {
    const information = {
      id: uniqueId(),
      key: '',
      value: '',
    };

    this.$emit('update:information:add', information);
  }

  public deleteField(j: number) {
    this.$emit('update:information:delete', this.information[j]);
  }

  public labelChange(value: string) {
    this.updateNode('label', value);
  }

  public typeChange(value: ProvenanceNodeType) {
    this.updateNode('type', value);
  }

  public studyIdChange(value: string) {
    this.updateNode('studyId', value ? +value : undefined);
  }

  public updateNode<K extends keyof ProvenanceNode>(key: K, value: ProvenanceNode[K]) {
    this.$emit('update:node', this.node, key, value);
  }

  public updateInformationNode<K extends keyof Information>(information: Information, key: K, value: Information[K]) {
    this.$emit('update:information', information, key, value);
  }
}
</script>
