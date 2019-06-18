<template>
  <card title="Link Type">
    <b-field>
      <b-select v-model="type" icon="arrow-right" expanded>
        <option v-for="r in relationships" :key="r" :value="r">{{ r }}</option>
      </b-select>
    </b-field>
    <template v-slot:footer>
      <a class="card-footer-item">Cancel</a>
      <a class="card-footer-item">Ok</a>
    </template>
  </card>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import Card from '@/components/Card.vue';
import { relationships } from '@/constants';

@Component({
  components: { Card },
})
export default class LinkType extends Vue {
  // @Prop({ type: Boolean, required: true }) public prop!: boolean;

  public relationships = relationships;

  public type = relationships[0];
}
</script>

<style lang="sass" scoped>

</style>