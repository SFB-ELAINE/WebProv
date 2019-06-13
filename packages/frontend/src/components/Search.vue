<template>
  <card>
    <template v-slot:header>
      <b-field style="margin: 1.5rem">
        <b-input placeholder="Search..."
          type="search"
          icon="magnify"
          expanded
          v-model="searchText"
          @input="checkEmpty"
          @keydown.native="checkEnter"
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
        <div style="display: flex">
          <div>
            <h4 class="result--title">{{ result.title }}</h4>
            <h6 class="result--type">Model {{ result.model }}</h6>
            <p class="result--extra">{{ result.information | format }}</p>
            <hr class="result--break" v-if="i !== results.length - 1">
          </div>
          <div style="flex: 1"></div>
          <div style="display: flex">
            <b-button 
              type="is-text" 
              icon-right="call-split"
              @click="$emit('dependency', result)"
            ></b-button>
            <b-button 
              type="is-text" 
              icon-right="launch"
              @click="$emit('open', result)"
            ></b-button>
          </div>
        </div>
      </div>
    </div>
  </card>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import Card from '@/components/Card.vue';
import { SearchItem } from '@/search';

@Component({
  components: { Card },
  filters: {
    format(strings: string[]) {
      return strings.join(' • ');
    },
  },
})
export default class Search extends Vue {
  @Prop({ type: Array, required: true }) public results!: SearchItem[];

  public searchText = '';

  public checkEnter(e: MouseEvent) {
    if (e.which === 13) { // ENTER
      this.search();
    }
  }

  public checkEmpty() {
    if (this.searchText === '') {
      this.$emit('clear');
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

.result--type {
  font-weight: normal;
}

.result--extra {
  font-size: 0.9em;
}

.result--break {
  margin: 0.5rem 0;
}
</style>