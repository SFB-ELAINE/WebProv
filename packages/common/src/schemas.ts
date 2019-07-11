import * as n from './neon';

interface RelationshipConstraints {
  /**
   * The type of relationship.
   */
  relationship: ProvenanceNodeRelationships;

  /**
   * Whether this relationship is a one-to-ony relationship. By default, it is a one-to-many relationship.
   */
  single?: boolean;
}

type RelationshipRules = {
  [A in ProvenanceNodeType]: {
    [B in ProvenanceNodeType]?: Array<ProvenanceNodeRelationships | RelationshipConstraints>
  }
};

export const relationshipRules: RelationshipRules = {
  ModelBuildingActivity: {
    WetLabData: [
      'used-for-validation',
      'used-for-calibration',
    ],
    SimulationData: [
      'used-for-validation',
      'used-for-calibration',
    ],
    Model: ['used'],
  },
  Model: {
    Model: [{
      relationship: 'derived-from',
      single: true,
    }],
    ModelBuildingActivity: [{
      relationship: 'generated-by',
      single: true,
    }],
  },
  ModelExplorationActivity: {
    Model: [{
      relationship: 'used',
      single: true,
    }],
  },
  SimulationData: {
    ModelBuildingActivity: [{
      relationship: 'generated-by',
      single: true,
    }],
    ModelExplorationActivity: [{
      relationship: 'generated-by',
      single: true,
    }],
  },
  WetLabData: {
    // no possible relationships
  },
};

export const SimulationStudyModel = n.schema({
  name: 'SimulationStudy',
  required: {
    /**
     * The id.
     */
    id: {
      primary: true,
      type: n.string,
    },
    /**
     * The study id. Must be unique.
     */
    studyId: {
      unique: true,
      type: n.number,
    },
  },
  optional: {
    /**
     * The signaling pathway information.
     */
    signalingPathway: {
      type: n.string,
    },
    /**
     * The information regarding the source of the model. For example, `Haack et al., PLoS comp. bio. 2015`.
     */
    source: {
      type: n.string,
    },
  },
});

export const InformationSchema = n.schema({
  name: 'Information',
  required: {
    id: {
      primary: true,
      type: n.string,
    },
  },
});

export const ProvenanceNodeSchema = n.schema({
  name: 'Node',
  required: {
    /**
     * The unique id.
     */
    id: {
      primary: true,
      type: n.string,
    },
    type: {
      type: n.union([
        n.literal('ModelBuildingActivity'),
        n.literal('ModelExplorationActivity'),
        n.literal('Model'),
        n.literal('WetLabData'),
        n.literal('SimulationData'),
      ]),
    },
    classification: {
      type: n.union([
        n.literal('activity'),
        n.literal('entity'),
      ]),
    },
  },
  optional: {
    /**
     * The model id. This information is what links nodes together.
     */
    studyId: {
      type: n.number,
    },
    label: {
      /**
       * The optional label.
       */
      type: n.string,
    },
  },
});

export type ProvenanceNode = n.TypeOf<typeof ProvenanceNodeSchema>;

export type SimulationStudy = n.TypeOf<typeof SimulationStudyModel>;

export type ProvenanceNodeType = ProvenanceNode['type'];

export const provenanceNodeTypes = ProvenanceNodeSchema.required.type.type.types.map((t) => t._A);

export const InformationRelationship = n.relationship({
  name: 'HAS_INFORMATION',
  source: ProvenanceNodeSchema,
  target: InformationSchema,
  required: {
    id: {
      primary: true,
      type: n.string,
    },
  },
});

export const DependsRelationship = n.relationship({
  name: 'DEPENDS',
  source: ProvenanceNodeSchema,
  target: ProvenanceNodeSchema,
  required: {
    id: {
      primary: true,
      type: n.string,
    },
    type: {
      type: n.union([
        n.literal('used'),
        n.literal('used-for-validation'),
        n.literal('used-for-calibration'),
        n.literal('derived-from'),
        n.literal('generated-by'),
      ]),
    },
  },
});

export type Depends = n.TypeOf<typeof DependsRelationship>;

export type ProvenanceNodeRelationships = Depends['type'];

export type Information = n.TypeOf<typeof InformationRelationship>;

export const provenanceNodeRelationships = DependsRelationship.required.type.type.types.map((t) => t._A);
