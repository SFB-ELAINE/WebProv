<template>
  <card :title="title">
    <b-field 
      v-for="(field, i) in fields" 
      :key="i"
      :label="field.name | wordCase"
    >
      <!-- A select option -->
      <b-select v-if="field.options" :value="node[field.name]" @input="onInput(field.name, field.type, $event)" expanded>
        <option v-for="option in field.options" :key="option" :value="option">{{ option }}</option>
      </b-select>

      <!-- The dynamic field with a key, value pair -->
      <div v-else-if="field.multiple">
        <div v-for="(value, j) in node[field.name]" :key="`${field.name}-${j}`" style="display: flex">
          <b-field>
            <b-input placeholder="Key" :value="value[0]" @input="update(value, 0, $event)"></b-input>
          </b-field>
          <div style="flex: 0 0 10px"></div>
          <b-field>
            <b-input placeholder="Value" :value="value[1]" @input="update(value, 1, $event)"></b-input>
            <p class="control">
              <button class="button is-primary" @click="deleteField(node[field.name], field.name, j)">
                <b-icon icon="close"></b-icon>
              </button>
            </p>
          </b-field>
        </div>
        <b-button class="is-primary" @click="addField(field.name)">
          Add Field
        </b-button>
      </div>

      <!-- Just a regular field -->
      <b-input v-else :type="field.type" :value="node[field.name]" @input="onInput(field.name, field.type, $event)">
      </b-input>
    
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
import { FieldInformation, wordCase } from '../utils';


type Values = string | number | Array<[string, string]>;

@Component({
  components: { Card },
  filters: { wordCase },
})
export default class FormCard<T extends { [k: string]: Values | undefined }> extends Vue {
  @Prop({ type: Array, required: true }) public fields!: Array<FieldInformation<keyof T & string>>;
  @Prop({ type: Object, required: true }) public node!: T;
  @Prop({ type: String, required: true }) public title!: string;

  public update(value: [string, string], i: 0 | 1, newValue: string) {
    // I don't understand why I need to do this... but it works
    // I tried to just use v-model, but I was getting weird blur
    // events that would trigger after the first character was typed
    value[i] = newValue;
  }

  public addField(key: string) {
    let value = this.node[key];
    if (typeof value === 'string') {
      return;
    }

    if (typeof value === 'number') {
      return;
    }

    if (value === undefined) {
      value = [];
      Vue.set(this.node, key, value);
    }


    value.push(['', '']);
  }

  public deleteField(value: any[], key: string, j: number) {
    // TODO THis is gross
    Vue.set(this.node, key, value.filter((_, index) => index !== j));
  }

  public onInput(key: string, type: 'string' | 'number', str: string) {
    // convert the value to a number if possible
    // if it is a number but the given string is empty, set to undefined
    const value = type === 'string' ? str : str === '' ? undefined : +str;
    Vue.set(this.node, key, value);
    this.$emit('input', key, value);
  }
}
</script>
