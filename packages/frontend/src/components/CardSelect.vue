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
import { createComponent } from '@/utils';

export default createComponent({
  name: 'CardSelect',
  components: { Card },
  props: {
    options: { type: Array as () => string[], required: true },
    value: { type: String, required: true },
    title: { type: String, required: true },
  },
});
</script>

<style lang="sass" scoped>

</style>