import {
  WetLabData,
  ModelBuildingActivity,
  SimulationData,
  Model,
  ModelInformation,
  ProvenanceNode,
  ModelExplorationActivity,
} from 'specification';

// M1
const WX_7: WetLabData = {
  id: 7,
  modelId: 1,
  name: 'Wx_7',
  type: 'wet-lab-data',
  information: {
    'Cell line': 'Xenopus egg extract',
  },
};

const W1_1: WetLabData = {
  id: 8,
  modelId: 1,
  name: 'W1_1',
  type: 'wet-lab-data',
  information: {
    'Cell line': 'Xenopus egg extract',
  },
};

const W1_2: WetLabData = {
  id: 9,
  modelId: 1,
  name: 'W1_2',
  type: 'wet-lab-data',
  information: {
    'Cell line': 'Xenopus egg extract',
  },
};

const MBA_3: ModelBuildingActivity = {
  id: 3,
  modelId: 1,
  type: 'model-building-activity',
  connections: [
    {
      id: 0,
      target: WX_7,
      type: 'used-for-calibration',
    },
    {
      id: 1,
      target: W1_1,
      type: 'used-for-calibration',
    },
  ],
};

const S1_1: SimulationData = {
  id: 3,
  modelId: 1,
  type: 'simulation-data',
  name: 'S1_1',
  connections: [
    {
      id: 2,
      target: MBA_3,
      type: 'generated-by',
    },
  ],
};

const modelInformation1: ModelInformation = {
  id: 2,
  modelNumber: 1,
  bibInformation: 'Lee et al., PLoS bio. 2003',
};

const model3: Model = {
  id: 3,
  modelId: 1,
  type: 'model',
  modelInformation: modelInformation1,
  version: 1,
  connections: [{ id: 3, target: MBA_3, type: 'generated-by' }],
};

const MEA: ModelExplorationActivity = {
  id: 1,
  modelId: 1,
  type: 'model-exploration-activity',
  connections: [{ id: 4, target: model3, type: 'used' }],
};

const S1_2: SimulationData = {
  id: 4,
  modelId: 1,
  type: 'simulation-data',
  name: 'S1_2',
  connections: [{ id: 5, target: MEA, type: 'generated-by' }],
};

// M12
const modelInformation12: ModelInformation = {
  id: 1,
  modelNumber: 12,
  bibInformation: 'Haack et al., PLoS comp. bio. 2015',
};

const W12_1: WetLabData = {
  id: 1,
  modelId: 12,
  name: 'W12_1',
  type: 'wet-lab-data',
  information: {
    'Cell line': 'hNPCs',
  },
};

const WX_1: WetLabData = {
  id: 2,
  modelId: 12,
  name: 'Wx_1',
  type: 'wet-lab-data',
  information: {
    'Cell line': 'HEK293T',
  },
};

const WX_2: WetLabData = {
  id: 3,
  modelId: 12,
  name: 'Wx_2',
  type: 'wet-lab-data',
  information: {
    'Cell line': 'Diverse cell lines (L, HIH3T3, N1E-115, nHPC, BHK, PTK2)',
  },
};

// TODO Leaving out simulationsUsedForCalibration from M1
const MBA_1: ModelBuildingActivity = {
  id: 1,
  modelId: 12,
  type: 'model-building-activity',
  connections: [
    {
      id: 6,
      target: W12_1,
      type: 'used-for-calibration',
    },
    {
      id: 7,
      target: WX_2,
      type: 'used-for-calibration',
    },
    {
      id: 8,
      target: WX_1,
      type: 'used-for-calibration',
    },
    {
      id: 9,
      target: S1_2,
      type: 'used-for-validation',
    },
  ],
};

const S12_1: SimulationData = {
  id: 1,
  modelId: 12,
  type: 'simulation-data',
  name: 'S12_1',
  connections: [{ id: 10, target: MBA_1, type: 'generated-by' }],
};

const model1: Model = {
  id: 1,
  modelId: 12,
  type: 'model',
  modelInformation: modelInformation12,
  version: 1,
  connections: [{ id: 11, target: MBA_1, type: 'generated-by' }],
};

const W12_2: WetLabData = {
  id: 4,
  modelId: 12,
  name: 'W12_2',
  type: 'wet-lab-data',
  information: {
    'Cell line': 'hNPCs',
  },
};

const W12_3: WetLabData = {
  id: 5,
  modelId: 12,
  name: 'W12_3',
  type: 'wet-lab-data',
  information: {
    'Cell line': 'Diverse cell lines (L, HIH3T3, N1E-115, nHPC, BHK, PTK2)',
  },
};

const WX_3: WetLabData = {
  id: 6,
  modelId: 12,
  name: 'Wx_3',
  type: 'wet-lab-data',
  information: {
    'Cell line': 'hNPCs',
  },
};

const MBA_2: ModelBuildingActivity = {
  id: 2,
  modelId: 12,
  type: 'model-building-activity',
  connections: [
    {
      id: 13,
      target: WX_3,
      type: 'used-for-calibration',
    },
    {
      id: 14,
      target: W12_2,
      type: 'used-for-validation',
    },
    {
      id: 15,
      target: W12_3,
      type: 'used-for-validation',
    },
    {
      id: 16,
      target: model1,
      type: 'used',
    },
  ],
};

const S12_2: SimulationData = {
  id: 2,
  modelId: 12,
  type: 'simulation-data',
  name: 'S12_2',
  connections: [{ id: 17, target: MBA_2, type: 'generated-by' }],
};

const model2: Model = {
  id: 2,
  modelId: 12,
  type: 'model',
  modelInformation: modelInformation12,
  version: 2,
  connections: [{ id: 18, target: MBA_2, type: 'generated-by' }],
};

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









