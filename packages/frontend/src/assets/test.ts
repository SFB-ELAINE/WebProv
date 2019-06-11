import {
  WetLabData,
  ModelBuildingActivity,
  SimulationData,
  Model,
  ModelInformation,
  Nodes,
  ModelExplorationActivity,
} from 'specification';

// M1
const WX_7: WetLabData = {
  id: 7,
  groupId: 1,
  name: 'Wx_7',
  type: 'wet-lab data',
  information: {
    'Cell line': 'Xenopus egg extract',
  },
};

const W1_1: WetLabData = {
  id: 8,
  groupId: 1,
  name: 'W1_1',
  type: 'wet-lab data',
  information: {
    'Cell line': 'Xenopus egg extract',
  },
};

const W1_2: WetLabData = {
  id: 9,
  groupId: 1,
  name: 'W1_2',
  type: 'wet-lab data',
  information: {
    'Cell line': 'Xenopus egg extract',
  },
};

const MBA_3: ModelBuildingActivity = {
  id: 3,
  groupId: 1,
  type: 'model-building-activity',
  wetLabsUsedForCalibration: [WX_7, W1_1],
  wetLabsUsedForValidation: [W1_2],
  simulationsUsedForCalibration: [],
  simulationsUsedForValidation: [],
  used: [],
};

const S1_1: SimulationData = {
  id: 3,
  groupId: 1,
  type: 'simulation data',
  name: 'S1_1',
  wasGeneratedByModelBuildingActivity: MBA_3,
  wasGeneratedByModelExplorationActivity: null,
};

const modelInformation1: ModelInformation = {
  id: 2,
  modelNumber: 1,
  bibInformation: 'Lee et al., PLoS bio. 2003',
};

const model3: Model = {
  id: 3,
  groupId: 1,
  type: 'model',
  modelInformation: modelInformation1,
  version: 2,
  wasGeneratedBy: MBA_3,
  derivedFrom: null,
};

const MEA: ModelExplorationActivity = {
  id: 1,
  groupId: 1,
  type: 'model exploration activity',
  used: model3,
};

const S1_2: SimulationData = {
  id: 4,
  groupId: 1,
  type: 'simulation data',
  name: 'S1_2',
  wasGeneratedByModelBuildingActivity: null,
  wasGeneratedByModelExplorationActivity: MEA,
};

// M12
const modelInformation12: ModelInformation = {
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

// TODO Leaving out simulationsUsedForCalibration from M1
const MBA_1: ModelBuildingActivity = {
  id: 1,
  groupId: 12,
  type: 'model-building-activity',
  wetLabsUsedForCalibration: [W12_1, WX_2, WX_1],
  wetLabsUsedForValidation: [],
  simulationsUsedForCalibration: [],
  simulationsUsedForValidation: [S1_2],
  used: [],
};

const S12_1: SimulationData = {
  id: 1,
  groupId: 12,
  type: 'simulation data',
  name: 'S12_1',
  wasGeneratedByModelBuildingActivity: MBA_1,
  wasGeneratedByModelExplorationActivity: null,
};

const model1: Model = {
  id: 1,
  groupId: 12,
  type: 'model',
  modelInformation: modelInformation12,
  version: 1,
  wasGeneratedBy: MBA_1,
  derivedFrom: null,
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
  wasGeneratedByModelBuildingActivity: MBA_2,
  wasGeneratedByModelExplorationActivity: null,
};

const model2: Model = {
  id: 2,
  groupId: 12,
  type: 'model',
  modelInformation: modelInformation12,
  version: 2,
  wasGeneratedBy: MBA_2,
  derivedFrom: null,
};

export const nodes: Nodes[] = [
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









