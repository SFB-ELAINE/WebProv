import {
  WetLabData,
  ModelBuildingActivity,
  SimulationData,
  Model,
  ModelInformation,
  Nodes,
} from 'specification';

const modelInformation: ModelInformation = {
  id: 1,
  modelNumber: 12,
  bibInformation: 'Haack et al., PLoS comp. bio. 2015',
};

const W12_1: WetLabData = {
  id: 1,
  groupId: 12,
  name: 'W12_1',
  type: 'wet-lab data',
  information: {
    'Cell line': 'hNPCs',
  },
};

const WX_1: WetLabData = {
  id: 2,
  groupId: 12,
  name: 'Wx_1',
  type: 'wet-lab data',
  information: {
    'Cell line': 'HEK293T',
  },
};

const WX_2: WetLabData = {
  id: 3,
  groupId: 12,
  name: 'Wx_2',
  type: 'wet-lab data',
  information: {
    'Cell line': 'Diverse cell lines (L, HIH3T3, N1E-115, nHPC, BHK, PTK2)',
  },
};

const WX_5: WetLabData = {
  id: 7,
  groupId: 12,
  name: 'Wx_5',
  type: 'wet-lab data',
  information: {
    'Cell line': 'L-Cells',
  },
};

// TODO Leaving out simulationsUsedForCalibration from M1
const MBA_1: ModelBuildingActivity = {
  id: 1,
  groupId: 12,
  type: 'model-building-activity',
  wetLabsUsedForCalibration: [W12_1, WX_2, WX_1],
  wetLabsUsedForValidation: [WX_5],
  simulationsUsedForCalibration: [],
  simulationsUsedForValidation: [],
  used: [],
};

const S12_1: SimulationData = {
  id: 1,
  groupId: 12,
  type: 'simulation data',
  name: 'S12_1',
  usedModelBuildingActivity: MBA_1,
  usedModelExplorationActivity: null,
};

const model1: Model = {
  id: 1,
  groupId: 12,
  type: 'model',
  modelInformation,
  version: 1,
  used: MBA_1,
};

const W12_2: WetLabData = {
  id: 4,
  groupId: 12,
  name: 'W12_2',
  type: 'wet-lab data',
  information: {
    'Cell line': 'hNPCs',
  },
};

const W12_3: WetLabData = {
  id: 5,
  groupId: 12,
  name: 'W12_3',
  type: 'wet-lab data',
  information: {
    'Cell line': 'Diverse cell lines (L, HIH3T3, N1E-115, nHPC, BHK, PTK2)',
  },
};

const WX_3: WetLabData = {
  id: 6,
  groupId: 12,
  name: 'Wx_3',
  type: 'wet-lab data',
  information: {
    'Cell line': 'hNPCs',
  },
};

const MBA_2: ModelBuildingActivity = {
  id: 2,
  groupId: 12,
  type: 'model-building-activity',
  wetLabsUsedForCalibration: [WX_3],
  wetLabsUsedForValidation: [W12_2, W12_3],
  simulationsUsedForCalibration: [],
  simulationsUsedForValidation: [],
  used: [model1],
};

const S12_2: SimulationData = {
  id: 2,
  groupId: 12,
  type: 'simulation data',
  name: 'S12_2',
  usedModelBuildingActivity: MBA_2,
  usedModelExplorationActivity: null,
};

const model2: Model = {
  id: 2,
  groupId: 12,
  type: 'model',
  modelInformation,
  version: 2,
  used: MBA_2,
};

export const nodes: Nodes[] = [
  W12_1,
  WX_1,
  WX_2,
  WX_5,
  MBA_1,
  S12_1,
  model1,
  W12_2,
  W12_3,
  WX_3,
  MBA_2,
  S12_2,
  model2,
];
