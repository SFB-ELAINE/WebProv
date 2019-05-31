export interface Node {
  id: string;
}

export interface ModelBuildingActivity extends Node {
  type: 'model-building-activity';
}

export interface ModelExplorationActivity extends Node {
  type: 'model exploration activity';
}

export interface Model extends Node {
  type: 'model';
  number: number;
}

export interface WetLabData extends Node {
  type: 'wet-lab data';
  // model: number;
  number: number;
}

export interface SimulationData extends Node {
  type: 'simulation data';
  // model: number;
  number: number;
}

export type NodeType =
  'model' |
  'wet-lab data' |
  'simulation data' |
  'model-building-activity' |
  'model exploration activity';

// export interface Node {
//   type: NodeType;
//   id: string;
//   text: string;
// }

interface Link {
  source: string;
  target: string;
}

export interface Model {
  name: string;
}

export interface Models {
  type: 'success';
  models: Model[];
}

export interface BackupAPI {
  '/health': {
    GET: {
      //
    },
  };

  '/models': {
    GET: {
      response: Models | Error,
    },
  };

}
