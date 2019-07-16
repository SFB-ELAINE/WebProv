import { ProvenanceNode, SimulationStudy, Depends, HasInformation, Information } from './schemas';
import { RelationshipBasics } from './neon';

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

export interface BackendRelationships<T> {
  result: 'success';
  items: Array<{ properties: T, source: string, target: string }>;
}

export interface BackendNotFound {
  result: 'not-found';
}

export interface ProvenanceAPI {
  '/health': {
    //
  };

  '/information': {
    GET: {
      response: BackendError | BackendItems<Information>,
    }

    POST: {
      body: Information;
      response: BackendSuccess | BackendError;
    }
  }

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

  '/nodes/dependencies': {
    GET: {
      response: BackendRelationships<Depends> | BackendError;
    },

    POST: {
      body: RelationshipBasics<Depends>
      response: BackendSuccess | BackendError;
    }

    DELETE: {
      query: { id: string }
      response: BackendSuccess | BackendNotFound | BackendError;
    }
  }

  '/nodes/information': {
    GET: {
      response: BackendRelationships<HasInformation> | BackendError;
    },
    
    POST: {
      body: RelationshipBasics<HasInformation>;
      response: BackendSuccess | BackendError;
    }

    DELETE: {
      query: { id: string }
      response: BackendSuccess | BackendNotFound | BackendError;
    }
  }
}
