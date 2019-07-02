<template>
  <card :title="title" closeable @close="$emit('close')">
    <b-field>
      <b-select :value="value" @input="$emit('input', $event)" expanded>
        <option v-for="option in options" :key="option" :value="option">{{ option }}</option>
      </b-select>
    </b-field>
    <template v-slot:footer>
      <a class="card-footer-item" @click="$emit('close')">Cancel</a>
      <a class="card-footer-item" @click="$emit('delete')">Delete</a>
    </template>
  </card>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import Card from '@/components/Card.vue';

@Component({
  components: { Card },
})
export default class CardSelect extends Vue {
  @Prop({ type: Array, required: true }) public options!: string[];
  @Prop({ type: String, required: true }) public value!: string;
  @Prop({ type: String, required: true }) public title!: string;
}
</script>

<style lang="sass" scoped>

</style>