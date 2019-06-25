import { ProvenanceNodeRelationships } from 'specification';

export type RelationshipColors = {
  [r in ProvenanceNodeRelationships]: {
    color: string,
    source: 'entity' | 'activity',
    target: 'entity' | 'activity',
  }
};

export const relationshipColors: RelationshipColors = {
  'generated-by': {
    color: 'blue',
    source: 'entity',
    target: 'activity',
  },
  'derived-from': {
    color: 'blue',
    source: 'entity',
    target: 'entity',
  },
  'used': {
    color: 'blue',
    source: 'activity',
    target: 'entity',
  },
  'used-for-calibration': {
    color: 'red',
    source: 'activity',
    target: 'entity',
  },
  'used-for-validation': {
    color: 'green',
    source: 'activity',
    target: 'entity',
  },
};
