<template>
  <card ref="el">
    <template v-slot:header>
      <b-field style="margin: 1.5rem 1.5rem 0">
        <b-input
          ref="input" 
          placeholder="Search..."
          type="search"
          icon="magnify"
          expanded
          v-model="searchText"
          @input="checkEmpty"
          @keydown.native="checkEnter"
        ></b-input>
        <p class="control">
          <button 
            @click="startSearch"
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
        <div style="display: flex; align-items: flex-start">
          <div>
            <h4 class="result--title">{{ result.title }}</h4>
            <h6 class="result--type">{{ result.studyText === undefined ? 'No Study' : result.studyText }}</h6>
            <p class="result--extra">{{ result.information | format }}</p>
          </div>
          <div style="flex: 1"></div>
          <div style="display: flex">
            <b-tooltip label="Open Study Information" position="is-left">
              <b-button
                type="is-text"
                icon-right="information-outline"
                @click="$emit('open-study', result)"
              ></b-button>
            </b-tooltip>
            <b-tooltip label="Show Provenance Graph" position="is-left">
              <b-button
                style="transform: rotate(-90deg)"
                type="is-text" 
                icon-right="call-split"
                @click="$emit('dependency', result)"
              ></b-button>
            </b-tooltip>
            <b-tooltip label="Show Entire Study" position="is-left">
              <b-button 
                type="is-text" 
                icon-right="arrow-expand-all"
                @click="$emit('open', result)"
              ></b-button>
            </b-tooltip>
          </div>
        </div>
        <hr class="result--break" v-if="i !== results.length - 1">
      </div>
    </div>
    <template v-slot:footer>
      <!-- href="#" allows users to tab to the link -->
      <a v-if="results.length" href="#" class="card-footer-item" @click="clear">Clear</a>
    </template>
  </card>
</template>

<script lang="ts">
import Vue from 'vue';
import Card from '@/components/Card.vue';
import { SearchItem, search } from '@/search';
import { createComponent } from '@/utils';
import { value } from 'vue-function-api';

export default createComponent({
  name: 'SearchCard',
  components: { Card },
  filters: {
    format(strings: string[]) {
      return strings.join(' • ');
    },
  },
  props: {
    items: { type: Array as () => SearchItem[], required: true },
  },
  setup(props, context) {
    const results = value<SearchItem[]>([]);
    const searchText = value('');

    function checkEnter(e: MouseEvent) {
      if (e.which === 13) { // ENTER
        startSearch();
      }
    }

    function checkEmpty() {
      if (searchText.value === '') {
        results.value = [];
      }
    }

    function startSearch() {
      const card = context.refs.el as Vue;
      const loadingComponent = context.root.$loading.open({
        container: card.$el,
      });

      setTimeout(() => loadingComponent.close(), 0.5 * 1000);
      results.value = search(props.items, searchText.value);
    }

    function clear() {
      results.value = [];
      searchText.value = '';
      const input = context.refs.input as Vue & { focus: () => void };
      input.focus();
    }

    return {
      startSearch,
      searchText,
      results,
      checkEmpty,
      checkEnter,
      clear,
    };
  },
});
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
  margin: 0.75rem 0;
}
</style>