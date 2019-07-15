import {
  SimulationStudy,
  ProvenanceNode,
  uniqueId,
  Information,
  Relationship,
  InformationRelationship,
  RelationshipSchema,
  Schema,
  DependsRelationship,
} from 'common';

export const connections: Relationship<Schema, Schema, RelationshipSchema<Schema, Schema>>[] = [];

const addRelationship = <A extends Schema, B extends Schema, R extends RelationshipSchema<A, B>>(
  relationship: Relationship<A, B, R>,
) => {
  connections.push(relationship);
}

// M1
const WX_7: ProvenanceNode = {
  id: uniqueId(),
  studyId: 1,
  label: 'Wx_7',
  type: 'WetLabData',
  classification: 'entity',
};

const WX_7_INFORMATION: Information = {
  id: uniqueId(),
  key: 'Cell line',
  value: 'Xenopus egg extract',
};

addRelationship({
  schema: InformationRelationship,
  source: WX_7,
  target: WX_7_INFORMATION,
  properties: {
    id: uniqueId(),
  }
})

const W1_1: ProvenanceNode = {
  id: uniqueId(),
  studyId: 1,
  label: 'W1_1',
  type: 'WetLabData',
  classification: 'entity',
};

const W1_1_INFORMATION: Information = {
  id: uniqueId(),
  key: 'Cell line',
  value: 'Xenopus egg extract',
}

addRelationship({
  schema: InformationRelationship,
  source: W1_1,
  target: W1_1_INFORMATION,
  properties: {
    id: uniqueId(),
  }
})

const W1_2: ProvenanceNode = {
  id: uniqueId(),
  studyId: 1,
  label: 'W1_2',
  type: 'WetLabData',
  classification: 'entity',
};

const W1_2_INFORMATION: Information = {
  id: uniqueId(),
  key: 'Cell line',
  value: 'Xenopus egg extract',
}

addRelationship({
  schema: InformationRelationship,
  source: W1_2,
  target: W1_2_INFORMATION,
  properties: {
    id: uniqueId(),
  }
})

const MBA_3: ProvenanceNode = {
  id: uniqueId(),
  studyId: 1,
  type: 'ModelBuildingActivity',
  classification: 'activity',
};

addRelationship({
  schema: DependsRelationship,
  source: MBA_3,
  target: WX_7,
  properties: {
    id: uniqueId(),
    type: 'used-for-calibration',
  }
})

addRelationship({
  schema: DependsRelationship,
  source: MBA_3,
  target: W1_1,
  properties: {
    id: uniqueId(),
    type: 'used-for-calibration',
  }
})

addRelationship({
  schema: DependsRelationship,
  source: MBA_3,
  target: W1_2,
  properties: {
    id: uniqueId(),
    type: 'used-for-validation',
  }
})


const S1_1: ProvenanceNode = {
  id: uniqueId(),
  studyId: 1,
  type: 'SimulationData',
  classification: 'entity',
  label: 'S1_1',
};

addRelationship({
  schema: DependsRelationship,
  source: S1_1,
  target: MBA_3,
  properties: {
    id: uniqueId(),
    type: 'generated-by',
  },
})

const study1: SimulationStudy = {
  id: uniqueId(),
  studyId: 1,
  source: 'Lee et al., PLoS bio. 2003',
};

const model3: ProvenanceNode = {
  id: uniqueId(),
  studyId: 1,
  type: 'Model',
  classification: 'entity',
};

addRelationship({
  schema: DependsRelationship,
  source: model3,
  target: MBA_3,
  properties: {
    id: uniqueId(),
    type: 'generated-by',
  }
})

const MEA: ProvenanceNode = {
  id: uniqueId(),
  studyId: 1,
  type: 'ModelExplorationActivity',
  classification: 'activity',
};

addRelationship({
  schema: DependsRelationship,
  source: MEA,
  target: model3,
  properties: {
    id: uniqueId(),
    type: 'used',
  }
})

const S1_2: ProvenanceNode = {
  id: uniqueId(),
  studyId: 1,
  type: 'SimulationData',
  classification: 'entity',
  label: 'S1_2',
};

addRelationship({
  schema: DependsRelationship,
  source: S1_2,
  target: MEA,
  properties: {
    id: uniqueId(),
    type: 'generated-by',
  }
})

// M12
const study12: SimulationStudy = {
  id: uniqueId(),
  studyId: 12,
  source: 'Haack et al., PLoS comp. bio. 2015',
};

const W12_1: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  label: 'W12_1',
  type: 'WetLabData',
  classification: 'entity',
};

const W12_1_INFORMATION: Information = {
  id: uniqueId(),
  key: 'Cell line',
  value: 'hNPCs',
}

addRelationship({
  schema: InformationRelationship,
  source: W12_1,
  target: W12_1_INFORMATION,
  properties: {
    id: uniqueId(),
  }
})

const WX_1: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  label: 'Wx_1',
  type: 'WetLabData',
  classification: 'entity',
};

const WX_1_INFORMATION: Information = {
  id: uniqueId(),
  key: 'Cell line',
  value: 'HEK293T',
}

addRelationship({
  schema: InformationRelationship,
  source: WX_1,
  target: WX_1_INFORMATION,
  properties: {
    id: uniqueId(),
  }
})

const WX_2: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  label: 'Wx_2',
  type: 'WetLabData',
  classification: 'entity',
};

const WX_2_INFORMATION: Information = {
  id: uniqueId(),
  key: 'Cell line',
  value: 'Diverse cell lines (L, HIH3T3, N1E-115, nHPC, BHK, PTK2)',
}

addRelationship({
  schema: InformationRelationship,
  source: WX_2,
  target: WX_2_INFORMATION,
  properties: {
    id: uniqueId(),
  }
})

// TODO Leaving out simulationsUsedForCalibration from M1
const MBA_1: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  type: 'ModelBuildingActivity',
  classification: 'activity',
};

addRelationship({
  schema: DependsRelationship,
  source: MBA_1,
  target: W12_1,
  properties: {
    id: uniqueId(),
    type: 'used-for-calibration',
  }
})

addRelationship({
  schema: DependsRelationship,
  source: MBA_1,
  target: WX_2,
  properties: {
    id: uniqueId(),
    type: 'used-for-calibration',
  }
})

addRelationship({
  schema: DependsRelationship,
  source: MBA_1,
  target: WX_1,
  properties: {
    id: uniqueId(),
    type: 'used-for-calibration',
  }
})

addRelationship({
  schema: DependsRelationship,
  source: MBA_1,
  target: S1_2,
  properties: {
    id: uniqueId(),
    type: 'used-for-validation',
  }
})


const S12_1: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  type: 'SimulationData',
  classification: 'entity',
  label: 'S12_1',
};

addRelationship({
  schema: DependsRelationship,
  source: S12_1,
  target: MBA_1,
  properties: {
    id: uniqueId(),
    type: 'generated-by',
  }
})

const model1: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  type: 'Model',
  classification: 'entity',
};

addRelationship({
  schema: DependsRelationship,
  source: model1,
  target: MBA_1,
  properties: {
    id: uniqueId(),
    type: 'generated-by',
  }
})

const W12_2: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  label: 'W12_2',
  type: 'WetLabData',
  classification: 'entity',
};

const W12_2_INFORMATION: Information = {
  id: uniqueId(),
  key: 'Cell line',
  value: 'hNPCs',
}

addRelationship({
  schema: InformationRelationship,
  source: W12_2,
  target: W12_2_INFORMATION,
  properties: {
    id: uniqueId(),
  }
})

const W12_3: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  label: 'W12_3',
  type: 'WetLabData',
  classification: 'entity',
};

const W12_3_INFORMATION: Information = {
  id: uniqueId(),
  key: 'Cell line',
  value: 'Diverse cell lines (L, HIH3T3, N1E-115, nHPC, BHK, PTK2)',
}

addRelationship({
  schema: InformationRelationship,
  source: W12_3,
  target: W12_3_INFORMATION,
  properties: {
    id: uniqueId(),
  }
})

const WX_3: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  label: 'Wx_3',
  type: 'WetLabData',
  classification: 'entity',
};

const WX_3_INFORMATION: Information = {
  id: uniqueId(),
  key: 'Cell line',
  value: 'hNPCs',
}

addRelationship({
  schema: InformationRelationship,
  source: WX_3,
  target: WX_3_INFORMATION,
  properties: {
    id: uniqueId(),
  }
})

const MBA_2: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  type: 'ModelBuildingActivity',
  classification: 'activity',
};

addRelationship({
  schema: DependsRelationship,
  source: MBA_2,
  target: WX_3,
  properties: {
    id: uniqueId(),
    type: 'used-for-calibration',
  }
})

addRelationship({
  schema: DependsRelationship,
  source: MBA_2,
  target: W12_2,
  properties: {
    id: uniqueId(),
    type: 'used-for-validation',
  }
})

addRelationship({
  schema: DependsRelationship,
  source: MBA_2,
  target: W12_3,
  properties: {
    id: uniqueId(),
    type: 'used-for-validation',
  }
})

addRelationship({
  schema: DependsRelationship,
  source: MBA_2,
  target: model1,
  properties: {
    id: uniqueId(),
    type: 'used',
  }
})


const S12_2: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  type: 'SimulationData',
  classification: 'entity',
  label: 'S12_2',
};

addRelationship({
  schema: DependsRelationship,
  source: S12_2,
  target: MBA_2,
  properties: {
    id: uniqueId(),
    type: 'generated-by',
  }
})

const model2: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  type: 'Model',
  classification: 'entity',
};

addRelationship({
  schema: DependsRelationship,
  source: model2,
  target: MBA_2,
  properties: {
    id: uniqueId(),
    type: 'generated-by',
  }
})

export const nodes: ProvenanceNode[] = [
  // MODEL 12
  W12_1,
  WX_1,
  WX_2,
  MBA_1,
  S12_1,
  model1,
  W12_2,
  W12_3,
  WX_3,
  MBA_2,
  S12_2,
  model2,

  // MODEL 1
  WX_7,
  W1_1,
  W1_2,
  MBA_3,
  S1_1,
  model3,
  MEA,
  S1_2,
];

export const studies = {
  study1,
  study12,
};









