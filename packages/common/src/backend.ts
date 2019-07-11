import { ProvenanceNode, SimulationStudy } from './schemas';

export interface BackendSuccess {
  result: 'success';
}

export interface BackendError {
  result: 'error';
  message: string;
}

export interface BackendItems<T> {
  result: 'success';
  items: T[];
}

export interface BackendNotFound {
  result: 'not-found';
}

export interface ProvenanceAPI {
  '/health': {
    //
  };

  '/nodes': {
    GET: {
      response: BackendError | BackendItems<ProvenanceNode>,
    }

    POST: {
      body: {
        item: ProvenanceNode;
        keys?: Array<keyof ProvenanceAPI['/nodes']['POST']['body']['item']>;
      }
      response: BackendSuccess | BackendError;
    }

    DELETE: {
      query: { id: string }
      response: BackendSuccess | BackendNotFound | BackendError;
    },
  };

  '/studies': {
    GET: {
      response: BackendError | BackendItems<SimulationStudy>,
    }

    POST: {
      body: {
        item: SimulationStudy;
        keys?: Array<keyof ProvenanceAPI['/studies']['POST']['body']['item']>;
      }
      response: BackendSuccess | BackendError;
    }

    DELETE: {
      query: { id: string }
      response: BackendSuccess | BackendNotFound | BackendError;
    },
  };
}
