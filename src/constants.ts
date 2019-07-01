import { ProvenanceNodeRelationships } from '@/specification';

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

export const NODE_OUTLINE = 'rgb(22, 89, 136)';
export const VALID_ENDPOINT_OUTLINE = 'rgb(55, 130, 33)';
export const INVALID_ENDPOINT_OUTLINE = 'rgb(130, 55, 33)';
export const NODE_HEIGHT = 40;
export const NODE_RADIUS = 10;
export const MODEL_STROKE = 'rgb(0, 0, 0)';
export const MODEL_WIDTH = 50;
