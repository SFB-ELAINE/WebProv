<template>
  <card title="Node Information">
    <div v-for="([key, value], index) in informationFields" :key="key">
      <div class="field-title">{{ key }}</div>
      <div class="field-text">{{ value }}</div>
      <div v-if="index !== informationFields.length - 1" class="field-spacer"></div>
    </div>
    <template v-slot:footer>
      <a class="card-footer-item">Edit</a>
      <a class="card-footer-item">Delete</a>
    </template>
  </card>  
</template>


<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import Card from '@/components/Card.vue';

@Component({
  components: { Card },
})
export default class InformationCard extends Vue {
  @Prop({ type: Array, required: true }) public informationFields!: Array<[string, string]>;
}
</script>

<style lang="scss" scoped>
.field-title {
  font-weight: bold;
}

.field-spacer {
  margin: 5px 0;
}
</style>
