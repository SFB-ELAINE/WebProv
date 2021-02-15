<template>
  <card ref="card" style="height: fit-content">
    <template v-slot:header>
      <b-field style="margin: 1.5rem 1.5rem 0">
        <b-input
          ref="input" 
          placeholder="Cypher Query..."
          type="search"
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
            Query
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
            <h6 class="result--type">{{ result.study === undefined ? 'No Study' : result.study.source }}</h6>
            <p class="result--extra">{{ result.extra | format }}</p>
          </div>
          <div style="flex: 1"></div>
          <div style="display: flex">
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
import { ref, createComponent } from '@vue/composition-api';
import { IS_MOBILE } from '../constants';
import * as backend from '@/backend';
import { makeRequest, notifier } from '@/utils';
import { getType, ProvenanceNodeSchema, array, isLeft, PathReporter } from 'common';

export default createComponent({
  name: 'QueryCard',
  components: { Card },
  filters: {
    format(strings: string[]) {
      return strings.join(' • ');
    },
  },
  setup(_, context) {
    const cardRef = ref<Vue>(null);
    const inputRef = ref<Vue & { focus: () => void }>(null);

    const results = ref<SearchItem[]>([]);
    const searchText = ref('');

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
      if (!cardRef.value || !inputRef.value) {
        return;
      }

      const loadingComponent = context.root.$loading.open({
        container: cardRef.value.$el,
      });


      if (IS_MOBILE) {
        // Blur the input when the search is started. This is very useful for touch devices
        // If we don't do this, anytime the user touches the screen the keyboard will open
        const input = inputRef.value.$refs.input as HTMLInputElement;
        input.blur();
      }

      setTimeout(() => loadingComponent.close(), 0.5 * 1000);

      makeRequest(() => backend.executeQuery(searchText.value), (result) => {
        const type = getType(ProvenanceNodeSchema);
        const nodesType = array(type);

        const maybeNodes: unknown[] = [];

        // The query returns a arrays of arrays
        // Each element of the array should be the same length
        // e.g. the below query returns an array of arrays of length 2
        // MATCH (n:ProvenanceNode) <-[:DEPENDS*]- (p:ProvenanceNode) WHERE n.definitionId = "Model" RETURN n,p;
        for (const items of result.items) {
          if (items.length === 0) {
            notifier.info('Your query was successfull but returned nothing.');
            return;
          }

          maybeNodes.push(...items);
        }

        const decodeResult = nodesType.decode(maybeNodes);
        if (isLeft(decodeResult)) {
          notifier.danger(
            'Query result is not in expected format\n\n' +
            PathReporter.report(decodeResult).join('\n\n'),
          );

          return;
        }

        const nodes = decodeResult.right;

        // console.log("Showing " + nodes.length)
        context.emit('open', nodes.map((node) => node.id));
      });
    }

    function clear() {
      results.value = [];
      searchText.value = '';
      if (inputRef.value) {
        inputRef.value.focus();
      }
    }

    return {
      startSearch,
      searchText,
      results,
      checkEmpty,
      checkEnter,
      clear,
      card: cardRef,
      input: inputRef,
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