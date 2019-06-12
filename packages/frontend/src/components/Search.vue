<template>
  <card>
    <template v-slot:header>
      <b-field style="margin: 1.5rem 1.5rem 0">
        <b-input placeholder="Search..."
          type="search"
          icon="magnify"
          expanded
          v-model="searchText"
          @input="checkEnter"
        ></b-input>
        <p class="control">
          <button 
            @click="search"
            class="button is-primary"
          >
            Search
          </button>
        </p>
      </b-field>
    </template>
    <div class="results">
      <div
        v-for="(result, i) in results"
        :key="i"
      >
        <h3 class="result--title">{{ result.title }}</h3>
        <h6 class="result--type">{{ result.type }}</h6>
        <p class="result--extra">{{ result.information | format }}</p>
        <hr class="result--break" v-if="i !== results.length - 1">
      </div>
    </div>
  </card>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import Card from '@/components/Card.vue';
import { Result } from '@/search';

@Component({
  components: { Card },
  filters: {
    format(strings: string[]) {
      return strings.join(' • ');
    },
  },
})
export default class Search extends Vue {
  @Prop({ type: Array, required: true }) public results!: Result[];

  public searchText = '';

  public checkEnter(e: MouseEvent) {
    if (e.which === 13) { // ENTER
      this.search();
    }
  }

  public search() {
    const loadingComponent = this.$loading.open({
      container: this.$el,
    });

    setTimeout(() => loadingComponent.close(), 0.5 * 1000);
    this.$emit('search', this.searchText);
  }
}
</script>

<style lang="scss" scoped>
.result--title, .result--type, .result--extra {
  margin-bottom: 0;
}

.result--break {
  margin: 0.5rem 0;
}
</style>