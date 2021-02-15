import { computed, ref, onMounted } from '@vue/composition-api';
import { makeRequest, addBToA, HighLevelNode } from '@/utils';
import {
  NodeDefinition,
  makeLookup,
  Lookup,
  ProvenanceNode,
  RelationshipRule,
  DependencyType,
  RelationshipInformation,
  DependencyRelationship,
  uniqueId,
} from 'common';
import * as backend from '@/backend';

interface Can {
  can: true;
  connection: RelationshipInformation<DependencyRelationship>;
}

interface Cant {
  can: false;
}

interface Circular { circular: true; }
interface NonCircular { circular: false; lookup: Lookup<number>; }
type ModelVersionLookupResult = NonCircular | Circular;

export const useRules = () => {
  const rules = ref<RelationshipRule[]>([]);

  /**
   * Determines the default relationship between two nodes based on the valid relationship types. If none exist, nothing
   * is returned.
   *
   * @param a The source node.
   * @param b The target node.
   * @returns The default relationship (the first in the list) or nothing if the list of valid relationships is empty.
   */
  const getDefaultRelationshipType = (a: ProvenanceNode, b: ProvenanceNode) => {
    const rulesThatApply = rules.value.filter((rule) => {
      return rule.source === a.definitionId && rule.target === b.definitionId;
    });
    if (rulesThatApply.length === 0) {
      return undefined;
    }

    const types = rulesThatApply[0].type;
    if (types.length === 0) {
      return undefined;
    }

    return types[0];
  };

  onMounted(() => {
    makeRequest(backend.getRules, (result) => {
      rules.value = result.items;
    });
  });

  const isValidRelationship = (a: ProvenanceNode, b: ProvenanceNode, type?: DependencyType) => {
    if (!type) {
      return false;
    }

    return rules.value.some((rule) => {
      return rule.source === a.definitionId && rule.target === b.definitionId && rule.type.indexOf(type) !== -1;
    });
  };

  const createRelationship = (
    a: ProvenanceNode, b: ProvenanceNode, type?: DependencyType,
  ): Can | Cant => {
    if (!type) {
      return {
        can: false,
      };
    }

    const isValid = isValidRelationship(a, b, type);
    if (!isValid) {
      return {
        can: false,
      };
    }

    return {
      can: true,
      connection: {
        source: a.id,
        target: b.id,
        properties: {
          id: uniqueId(),
          type,
        },
      },
    };
  };

  return {
    getDefaultRelationshipType,
    isValidRelationship,
    createRelationship,
    getApplicableRules: (a: ProvenanceNode, b: ProvenanceNode) => {
      return rules.value.filter((rule) => {
        return rule.source === a.definitionId && rule.target === b.definitionId;
      });
    },
  };
};

export const useDefinitions = () => {
  const definitions = ref<NodeDefinition[]>([]);
  const definitionLookup = computed(() => makeLookup(definitions.value));
  const getDefinition = (node: ProvenanceNode): NodeDefinition | undefined => {
    if (!definitionLookup.value.hasOwnProperty(node.definitionId)) {
      return undefined;
    }

    return definitionLookup.value[node.definitionId];
  };

  /**
   * Gets the classification of the node base on the type.
   *
   * This method will need to be removed when a more general solution is created.
   * We can't have hard coded information like this, it will need to be stored in the database.
   *
   * @param type
   */
  const getClassification = (node: ProvenanceNode) => {
    const definition = getDefinition(node);
    if (!definition) {
      return undefined;
    }

    return definition.classification;
  };

  /**
   * Creates a model version lookup. The ID of the model nodes are used as a key and the values are their version
   * numbers.
   *
   * The algorithm constrains:
   * 1. Every version must be unique.
   * 2. A model of a higher version should not depend on a model of a lower version.
   *
   * To accomplish this, we count how many models each node depends on. Then, we sort the model nodes based on the
   * amount of model nodes each depends on. Then, we use the index as version number (we add one so that the version
   * numbers start at 1).
   *
   * @param highLevelNodes
   */
  const createModelVersionLookup = (highLevelNodes: HighLevelNode[]): ModelVersionLookupResult => {
    // lookup from node id -> node name (ie. `Model`, `ModelExplorationActivity`) -> count
    // this is kinda a dumb name but oh well
    const fullCountsLookup: Lookup<Lookup<number>> = {};
    const seen = new Set<string>();

    const traverse = (node: HighLevelNode): ModelVersionLookupResult => {
      if (fullCountsLookup[node.id] !== undefined) {
        return {
          circular: false,
          lookup: fullCountsLookup[node.id],
        };
      }

      // This detects cyclic dependencies
      if (seen.has(node.id)) {
        return {
          circular: true,
        };
      }

      seen.add(node.id);

      const count: Lookup<number> = {};
      for (const outgoing of node.outgoing) {
        const result = traverse(outgoing.target);
        if (result.circular) {
          return result;
        }

        addBToA(count, result.lookup);

        const definition = getDefinition(outgoing.target.node);
        if (!definition) {
          continue;
        }

        if (!count.hasOwnProperty(definition.id)) {
          count[definition.id] = 0;
        }

        count[definition.id]++;
      }

      fullCountsLookup[node.id] = count;
      return {
        circular: false,
        lookup: count,
      };
    };

    for (const node of highLevelNodes) {
      const { circular } = traverse(node);
      if (circular) {
        return { circular };
      }
    }

    const counts: Lookup<number> = {};
    highLevelNodes.forEach((node) => {
      const definition = getDefinition(node.node);
      counts[node.id] = definition ? fullCountsLookup[node.id][definition.id] : 0;
    });

    // sort smallest to largest by count
    const sorted = highLevelNodes.sort((a, b) => counts[a.id] - counts[b.id]);

    const indices: Lookup<number> = {}; // lookup from node name -> index
    const lookup: Lookup<number> = {}; // the version lookup (node id -> version)
    sorted.forEach((node) => {
      const definition = getDefinition(node.node);

      // The ID is a concatenation of the definition and study
      // This makes it so version numbers are only unique within a study
      const id = '' + (definition ? definition.id : '') + node.node.studyId;

      if (!indices.hasOwnProperty(id)) {
        indices[id] = 0;
      }

      // add one before so that the number starts at 1
      indices[id]++;

      // start the number at 1, not 0
      lookup[node.id] = indices[id];
    });

    return {
      circular: false,
      lookup,
    };
  };

  onMounted(() => {
    makeRequest(backend.getDefinitions, (result) => {
      definitions.value = result.items;
    });
  });

  return {
    definitions,
    getDefinition,
    getClassification,
    createModelVersionLookup,
  };
};
