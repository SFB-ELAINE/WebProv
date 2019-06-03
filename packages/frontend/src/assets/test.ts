import {
  WetLabData,
  ModelBuildingActivity,
  SimulationData,
  Model,
  ModelInformation,
  NodeTypes,
} from 'specification';

export type NodeType =
  'model' |
  'wet-lab data' |
  'simulation data' |
  'model-building-activity' |
  'model exploration activity';

const modelInformation: ModelInformation = {
  id: 1,
  modelNumber: 12,
  bibInformation: 'Haack et al., PLoS comp. bio. 2015',
};

const W12_1: WetLabData = {
  id: 1,
  name: 'W12_1',
  type: 'wet-lab data',
};

const WX_1: WetLabData = {
  id: 2,
  name: 'Wx_1',
  type: 'wet-lab data',
};

const WX_2: WetLabData = {
  id: 3,
  name: 'Wx_2',
  type: 'wet-lab data',
};

const WX_5: WetLabData = {
  id: 7,
  name: 'Wx_5',
  type: 'wet-lab data',
};

// TODO Leaving out simulationsUsedForCalibration from M1
const MBA_1: ModelBuildingActivity = {
  id: 1,
  type: 'model-building-activity',
  wetLabsUsedForCalibration: [W12_1, WX_2, WX_1],
  wetLabsUsedForValidation: [WX_5],
  simulationsUsedForCalibration: [],
  simulationsUsedForValidation: [],
  used: [],
};

const S12_1: SimulationData = {
  id: 1,
  type: 'simulation data',
  name: 'S12_1',
  usedModelBuildingActivity: MBA_1,
  usedModelExplorationActivity: null,
};

const model1: Model = {
  id: 1,
  type: 'model',
  modelInformation,
  version: 1,
  used: MBA_1,
};

const W12_2: WetLabData = {
  id: 4,
  name: 'W12_2',
  type: 'wet-lab data',
};

const W12_3: WetLabData = {
  id: 5,
  name: 'W12_3',
  type: 'wet-lab data',
};

const WX_3: WetLabData = {
  id: 6,
  name: 'Wx_3',
  type: 'wet-lab data',
};

const MBA_2: ModelBuildingActivity = {
  id: 2,
  type: 'model-building-activity',
  wetLabsUsedForCalibration: [WX_3],
  wetLabsUsedForValidation: [W12_2, W12_3],
  simulationsUsedForCalibration: [],
  simulationsUsedForValidation: [],
  used: [model1],
};

const S12_2: SimulationData = {
  id: 2,
  type: 'simulation data',
  name: 'S12_2',
  usedModelBuildingActivity: MBA_2,
  usedModelExplorationActivity: null,
};

const model2: Model = {
  id: 1,
  type: 'model',
  modelInformation,
  version: 2,
  used: MBA_2,
};

export const nodes: NodeTypes[] = [
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
