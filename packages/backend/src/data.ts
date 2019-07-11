import {
  SimulationStudy,
  ProvenanceNode,
  uniqueId,
} from 'common';
import { Information } from 'common/dist/schemas';

// M1
const WX_7: ProvenanceNode = {
  id: uniqueId(),
  studyId: 1,
  label: 'Wx_7',
  type: 'WetLabData',
  classification: 'entity',
};

const WX_7_INFORMATION: Information = [['Cell line', 'Xenopus egg extract']];

const W1_1: ProvenanceNode = {
  id: uniqueId(),
  studyId: 1,
  label: 'W1_1',
  type: 'WetLabData',
  classification: 'entity',
  information: [['Cell line', 'Xenopus egg extract']],
};

const W1_2: ProvenanceNode = {
  id: uniqueId(),
  studyId: 1,
  label: 'W1_2',
  type: 'WetLabData',
  classification: 'entity',
  information: [['Cell line', 'Xenopus egg extract']],
};

const MBA_3: ProvenanceNode = {
  id: uniqueId(),
  studyId: 1,
  type: 'ModelBuildingActivity',
  classification: 'activity',
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

const S1_1: ProvenanceNode = {
  id: uniqueId(),
  studyId: 1,
  type: 'SimulationData',
  classification: 'entity',
  label: 'S1_1',
  connections: [
    {
      id: uniqueId(),
      targetId: MBA_3.id,
      type: 'generated-by',
    },
  ],
};

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
  connections: [{ id: uniqueId(), targetId: MBA_3.id, type: 'generated-by' }],
};

const MEA: ProvenanceNode = {
  id: uniqueId(),
  studyId: 1,
  type: 'ModelExplorationActivity',
  classification: 'activity',
  connections: [{ id: uniqueId(), targetId: model3.id, type: 'used' }],
};

const S1_2: ProvenanceNode = {
  id: uniqueId(),
  studyId: 1,
  type: 'SimulationData',
  classification: 'entity',
  label: 'S1_2',
  connections: [{ id: uniqueId(), targetId: MEA.id, type: 'generated-by' }],
};

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
  information: [['Cell line', 'hNPCs']],
};

const WX_1: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  label: 'Wx_1',
  type: 'WetLabData',
  classification: 'entity',
  information: [['Cell line', 'HEK293T']],
};

const WX_2: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  label: 'Wx_2',
  type: 'WetLabData',
  classification: 'entity',
  information: [['Cell line', 'Diverse cell lines (L, HIH3T3, N1E-115, nHPC, BHK, PTK2)']],
};

// TODO Leaving out simulationsUsedForCalibration from M1
const MBA_1: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  type: 'ModelBuildingActivity',
  classification: 'activity',
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

const S12_1: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  type: 'SimulationData',
  classification: 'entity',
  label: 'S12_1',
  connections: [{ id: uniqueId(), targetId: MBA_1.id, type: 'generated-by' }],
};

const model1: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  type: 'Model',
  classification: 'entity',
  connections: [{ id: uniqueId(), targetId: MBA_1.id, type: 'generated-by' }],
};

const W12_2: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  label: 'W12_2',
  type: 'WetLabData',
  classification: 'entity',
  information: [['Cell line', 'hNPCs']],
};

const W12_3: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  label: 'W12_3',
  type: 'WetLabData',
  classification: 'entity',
  information: [['Cell line', 'Diverse cell lines (L, HIH3T3, N1E-115, nHPC, BHK, PTK2)']],
};

const WX_3: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  label: 'Wx_3',
  type: 'WetLabData',
  classification: 'entity',
  information: [['Cell line', 'hNPCs']],
};

const MBA_2: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  type: 'ModelBuildingActivity',
  classification: 'activity',
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

const S12_2: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  type: 'SimulationData',
  classification: 'entity',
  label: 'S12_2',
  connections: [{ id: uniqueId(), targetId: MBA_2.id, type: 'generated-by' }],
};

const model2: ProvenanceNode = {
  id: uniqueId(),
  studyId: 12,
  type: 'Model',
  classification: 'entity',
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

export const studies = {
  study1,
  study12,
};









