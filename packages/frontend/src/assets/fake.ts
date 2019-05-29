export type NodeType =
  'model' |
  'wet-lab data' |
  'simulation data' |
  'model-building-activity' |
  'model exploration activity';

export interface Node {
  type: NodeType;
  id: string;
  text: string;
}

interface Link {
  source: string;
  target: string;
}

const nodes: Node[] = [
  {
    type: 'wet-lab data',
    id: 'W12_1',
    text: 'W12_1',
  },
  {
    type: 'wet-lab data',
    id: 'Wx_1',
    text: 'Wx_1',
  },
  {
    type: 'wet-lab data',
    id: 'Wx_2',
    text: 'Wx_2',
  },
  {
    type: 'wet-lab data',
    id: 'W12_2',
    text: 'W12_2',
  },
  {
    type: 'wet-lab data',
    id: 'W12_3',
    text: 'W12_3',
  },
  {
    type: 'wet-lab data',
    id: 'Wx_3',
    text: 'Wx_3',
  },
  {
    type: 'model-building-activity',
    id: 'MBA_1',
    text: 'MBA_1',
  },
  {
    type: 'model-building-activity',
    id: 'MBA_2',
    text: 'MBA_2',
  },
  {
    type: 'simulation data',
    id: 'S12_1',
    text: 'S12_1',
  },
  {
    type: 'simulation data',
    id: 'S12_2',
    text: 'S12_2',
  },
  {
    type: 'model',
    id: 'M12',
    text: 'M12 (Haack et al., PLoS comp. bio. 2015)',
  },
  {
    type: 'model',
    id: 'M12\'',
    text: 'M12\' (Haack et al., PLoS comp. bio. 2015)',
  },
];

const links: Link[] = [
  {
    source: 'MBA_1',
    target: 'M12',
  },
  {
    source: 'MBA_1',
    target: 'Wx_2',
  },
  {
    source: 'MBA_1',
    target: 'Wx_1',
  },
  {
    source: 'S12_1',
    target: 'MBA_1',
  },
  {
    source: 'M12',
    target: 'MBA_1',
  },
  {
    source: 'MBA_2',
    target: 'M12',
  },
  {
    source: 'MBA_2',
    target: 'W12_2',
  },
  {
    source: 'MBA_2',
    target: 'W12_3',
  },
  {
    source: 'MBA_2',
    target: 'Wx_3',
  },
  {
    source: 'M12\'',
    target: 'MBA_2',
  },
  {
    source: 'S12_2',
    target: 'MBA_2',
  },
  {
    source: 'MBA_1',
    target: 'W12_1',
  },
];


export default {
  nodes,
  links,
};
