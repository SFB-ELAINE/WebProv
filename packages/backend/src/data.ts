import {
  WetLabData,
  ModelBuildingActivity,
  SimulationData,
  Model,
  ModelInformation,
  ProvenanceNode,
  ModelExplorationActivity,
  uniqueId,
} from 'common';

// M1
const WX_7: WetLabData = {
  id: uniqueId(),
  modelId: 1,
  name: 'Wx_7',
  type: 'WetLabData',
  information: [['Cell line', 'Xenopus egg extract']],
};

const W1_1: WetLabData = {
  id: uniqueId(),
  modelId: 1,
  name: 'W1_1',
  type: 'WetLabData',
  information: [['Cell line', 'Xenopus egg extract']],
};

const W1_2: WetLabData = {
  id: uniqueId(),
  modelId: 1,
  name: 'W1_2',
  type: 'WetLabData',
  information: [['Cell line', 'Xenopus egg extract']],
};

const MBA_3: ModelBuildingActivity = {
  id: uniqueId(),
  modelId: 1,
  type: 'ModelBuildingActivity',
  connections: [
    {
      id: uniqueId(),
      targetId: WX_7.id,
      type: 'used-for-calibration',
    },
    {
      id: uniqueId(),
      targetId: W1_1.id,
      type: 'used-for-calibration',
    },
    {
      id: uniqueId(),
      targetId: W1_2.id,
      type: 'used-for-validation',
    },
  ],
};

const S1_1: SimulationData = {
  id: uniqueId(),
  modelId: 1,
  type: 'SimulationData',
  name: 'S1_1',
  connections: [
    {
      id: uniqueId(),
      targetId: MBA_3.id,
      type: 'generated-by',
    },
  ],
};

const modelInformation1: ModelInformation = {
  id: 1,
  source: 'Lee et al., PLoS bio. 2003',
};

const model3: Model = {
  id: uniqueId(),
  modelId: 1,
  type: 'Model',
  version: 1,
  connections: [{ id: uniqueId(), targetId: MBA_3.id, type: 'generated-by' }],
};

const MEA: ModelExplorationActivity = {
  id: uniqueId(),
  modelId: 1,
  type: 'ModelExplorationActivity',
  connections: [{ id: uniqueId(), targetId: model3.id, type: 'used' }],
};

const S1_2: SimulationData = {
  id: uniqueId(),
  modelId: 1,
  type: 'SimulationData',
  name: 'S1_2',
  connections: [{ id: uniqueId(), targetId: MEA.id, type: 'generated-by' }],
};

// M12
const modelInformation12: ModelInformation = {
  id: 12,
  source: 'Haack et al., PLoS comp. bio. 2015',
};

const W12_1: WetLabData = {
  id: uniqueId(),
  modelId: 12,
  name: 'W12_1',
  type: 'WetLabData',
  information: [['Cell line', 'hNPCs']],
};

const WX_1: WetLabData = {
  id: uniqueId(),
  modelId: 12,
  name: 'Wx_1',
  type: 'WetLabData',
  information: [['Cell line', 'HEK293T']],
};

const WX_2: WetLabData = {
  id: uniqueId(),
  modelId: 12,
  name: 'Wx_2',
  type: 'WetLabData',
  information: [['Cell line', 'Diverse cell lines (L, HIH3T3, N1E-115, nHPC, BHK, PTK2)']],
};

// TODO Leaving out simulationsUsedForCalibration from M1
const MBA_1: ModelBuildingActivity = {
  id: uniqueId(),
  modelId: 12,
  type: 'ModelBuildingActivity',
  connections: [
    {
      id: uniqueId(),
      targetId: W12_1.id,
      type: 'used-for-calibration',
    },
    {
      id: uniqueId(),
      targetId: WX_2.id,
      type: 'used-for-calibration',
    },
    {
      id: uniqueId(),
      targetId: WX_1.id,
      type: 'used-for-calibration',
    },
    {
      id: uniqueId(),
      targetId: S1_2.id,
      type: 'used-for-validation',
    },
  ],
};

const S12_1: SimulationData = {
  id: uniqueId(),
  modelId: 12,
  type: 'SimulationData',
  name: 'S12_1',
  connections: [{ id: uniqueId(), targetId: MBA_1.id, type: 'generated-by' }],
};

const model1: Model = {
  id: uniqueId(),
  modelId: 12,
  type: 'Model',
  version: 1,
  connections: [{ id: uniqueId(), targetId: MBA_1.id, type: 'generated-by' }],
};

const W12_2: WetLabData = {
  id: uniqueId(),
  modelId: 12,
  name: 'W12_2',
  type: 'WetLabData',
  information: [['Cell line', 'hNPCs']],
};

const W12_3: WetLabData = {
  id: uniqueId(),
  modelId: 12,
  name: 'W12_3',
  type: 'WetLabData',
  information: [['Cell line', 'Diverse cell lines (L, HIH3T3, N1E-115, nHPC, BHK, PTK2)']],
};

const WX_3: WetLabData = {
  id: uniqueId(),
  modelId: 12,
  name: 'Wx_3',
  type: 'WetLabData',
  information: [['Cell line', 'hNPCs']],
};

const MBA_2: ModelBuildingActivity = {
  id: uniqueId(),
  modelId: 12,
  type: 'ModelBuildingActivity',
  connections: [
    {
      id: uniqueId(),
      targetId: WX_3.id,
      type: 'used-for-calibration',
    },
    {
      id: uniqueId(),
      targetId: W12_2.id,
      type: 'used-for-validation',
    },
    {
      id: uniqueId(),
      targetId: W12_3.id,
      type: 'used-for-validation',
    },
    {
      id: uniqueId(),
      targetId: model1.id,
      type: 'used',
    },
  ],
};

const S12_2: SimulationData = {
  id: uniqueId(),
  modelId: 12,
  type: 'SimulationData',
  name: 'S12_2',
  connections: [{ id: uniqueId(), targetId: MBA_2.id, type: 'generated-by' }],
};

const model2: Model = {
  id: uniqueId(),
  modelId: 12,
  type: 'Model',
  version: 2,
  connections: [{ id: uniqueId(), targetId: MBA_2.id, type: 'generated-by' }],
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

export const models = {
  modelInformation1,
  modelInformation12,
};









