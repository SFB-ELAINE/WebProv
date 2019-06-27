<template>
  <card :title="title">
    <b-field 
      v-for="(field, i) in fields" 
      :key="i"
      :label="field.name | uppercase"
    >
      <!-- A select option -->
      <b-select v-if="field.options" v-model="values[i]" expanded>
        <option v-for="option in field.options" :key="option" :value="option">{{ option }}</option>
      </b-select>

      <!-- The dynamic field with a key, value pair -->
      <div v-else-if="field.multiple">
        <div v-for="(value, j) in values[i]" :key="value[0]" style="display: flex">
          <b-field>
            <b-input placeholder="Key" :value="value[0]" @input="update(value, 0, $event)" @ref="focus"></b-input>
          </b-field>
          <div style="flex: 0 0 10px"></div>
          <b-field>
            <b-input placeholder="Value" :value="value[1]" @input="update(value, 1, $event)"></b-input>
            <p class="control">
              <button class="button is-primary" @click="deleteField(values[i], i, j)">
                <b-icon icon="close"></b-icon>
              </button>
            </p>
          </b-field>
        </div>
        <b-button class="is-primary" @click="addField(i)">
          Add Field
        </b-button>
      </div>

      <!-- Just a regular field -->
      <b-input v-else :type="field.type" v-model="values[i]">
      </b-input>
    
    </b-field>
  </card>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import Card from '@/components/Card.vue';
import { FieldInformation, uppercase } from '../utils';


@Component({
  components: { Card },
  filters: { uppercase },
})
export default class FormCard extends Vue {
  @Prop({ type: Array, required: true }) public fields!: Array<FieldInformation<string>>;
  @Prop({ type: Array, required: true }) public values!: Array<string | number | Array<[string, string]>>;
  @Prop({ type: String, required: true }) public title!: string;

  public update(value: [string, string], i: 0 | 1, newValue: string) {
    // I don't understand why I need to do this... but it works
    // I tried to just use v-model, but I was getting weird blur
    // events that would trigger after the first character was typed
    value[i] = newValue;
  }

  public addField(i: number) {
    const value = this.values[i];
    if (typeof value !== 'object') {
      return;
    }

    value.push(['', '']);
  }

  public deleteField(value: any[], i: number, j: number) {
    // TODO THis is gross
    Vue.set(this.values, i, value.filter((_, index) => index !== j));
  }
}
</script>
