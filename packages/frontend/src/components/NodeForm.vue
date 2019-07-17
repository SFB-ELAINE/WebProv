<template>
  <card title="Node">

    <b-field label="Type">
      <b-select :value="nodeCopy.type" @input="typeChange" expanded>
        <option v-for="option in typeOptions" :key="option" :value="option">{{ option }}</option>
      </b-select>
    </b-field>

    <b-field label="Label">
      <b-input type="string" :value="nodeCopy.label" @input="labelChange"></b-input>
    </b-field>

    <b-field label="Study ID">
      <b-input type="number" :value="nodeCopy.studyId" @input="studyIdChange"></b-input>
    </b-field>

    <b-field label="Information" style="flex-direction: column; align-items: flex-start;">
      <div v-for="(field, j) in informationCopy" :key="j" style="display: flex">
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
      <a class="card-footer-item" @click="save">Save</a>
    </template>
  </card>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import Card from '@/components/Card.vue';
import { FieldInformation, wordCase, makeRequest, setVue, Watch } from '../utils';
import { provenanceNodeTypes, ProvenanceNode, Information, uniqueId, ProvenanceNodeType } from 'common';
import * as backend from '@/backend';

type Values = string | number | Array<[string, string]>;

@Component({
  components: { Card },
  filters: { wordCase },
})
export default class NodeForm extends Vue {
  @Prop({ type: Object, required: true }) public node!: ProvenanceNode;
  @Prop({ type: Array, required: true }) public information!: Information[];

  public informationCopy: Information[] = this.information.map((field) => ({ ...field }));
  public nodeCopy: ProvenanceNode = { ...this.node };

  public typeOptions = provenanceNodeTypes;

  public updateKey(index: number, newValue: string) {
    this.informationCopy[index].key = newValue;
  }

  public updateValue(index: number, newValue: string) {
    this.informationCopy[index].value = newValue;
  }

  public save() {
    this.$emit('save', this.nodeCopy, this.informationCopy);
  }

  public addField() {
    this.informationCopy.push({
      id: uniqueId(),
      key: '',
      value: '',
    });
  }

  public deleteField(j: number) {
    this.informationCopy.splice(j, 1);
  }

  public labelChange(value: string) {
    this.nodeCopy.label = value;
  }

  public typeChange(value: ProvenanceNodeType) {
    this.nodeCopy.type = value;
  }

  public studyIdChange(value: string) {
    this.nodeCopy.studyId = value ? +value : undefined;
  }

  @Watch<NodeForm>('node')
  public setNodeCopy() {
    this.nodeCopy = this.node;
  }

  @Watch<NodeForm>('information')
  public setInformationCopy() {
    this.informationCopy = this.information.map((field) => ({ ...field }));
  }
}
</script>
