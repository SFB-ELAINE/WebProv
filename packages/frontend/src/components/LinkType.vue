<template>
  <card title="Link Type" closeable @close="$emit('close')">
    <b-field>
      <b-select :value="value" @input="$emit('input', $event)" expanded>
        <option v-for="r in relationships" :key="r" :value="r">{{ r }}</option>
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
export default class LinkType extends Vue {
  @Prop({ type: Array, required: true }) public relationships!: string[];
  @Prop({ type: String, required: true }) public value!: string;
}
</script>

<style lang="sass" scoped>

</style>