import * as testData from '@/testData';
import firebase from 'firebase/app';
import { ProvenanceNode, ModelInformation } from '@/specification';

export interface SerializedProject {
  name: string;
}

export interface BackendError {
  result: 'error';
  message: string;
}

export interface BackendSuccess {
  result: 'success';
}

export interface BackendItems<T> {
  result: 'success';
  items: T[];
}

export interface BackendNotFound {
  result: 'not-found';
}

export interface Schema<T> {
  [id: string]: T;
}

type NodesModels = 'nodes' | 'models';

let db: null | firebase.database.Database = null;

const getRef = (ref: NodesModels) => {
  if (!db) {
    db = firebase.database();
  }

  return db.ref(ref);
};

const withHandling = async <T>(f: () => Promise<T>): Promise<T | BackendError> => {
  try {
    return await f();
  } catch (e) {
    return {
      result: 'error',
      message: e.message,
    };
  }
};

async function getItems<T>(ref: NodesModels) {
  return withHandling(async (): Promise<BackendItems<T>> => { // Promise<ProvenanceNodes>
    const snapshot = await getRef(ref).once('value');

    if (!snapshot.exists()) {
      return {
        result: 'success',
        items: [],
      };
    }

    const projects: Schema<T> = snapshot.val();

    return {
      result: 'success',
      items: Object.values(projects),
    };
  });
}

export const getProvenanceNodes = async () => {
  return await getItems<ProvenanceNode>('nodes');
};

export const getModels = async () => {
  return await getItems<ModelInformation>('models');
};

type GenericArgument = {
  ref: 'models',
  data: ModelInformation,
  keys?: Array<keyof ModelInformation>,
} | {
  ref: 'nodes',
  data: ProvenanceNode,
  keys?: Array<keyof ProvenanceNode>,
};

// TODO keys
const updateOrCreate = async (id: string, arg: GenericArgument) => {
  return await withHandling(async (): Promise<BackendSuccess> => {
    const ref = getRef(arg.ref).child(id);
    const snapshot = await ref.once('value');

    if (!snapshot.exists()) {
      // tslint:disable-next-line: no-console
      console.info(`Creating ${id}`);
      ref.set(arg.data);
    } else {
      // tslint:disable-next-line: no-console
      console.info(`Updating ${id} using: ${arg.keys}`);
      ref.update(arg.data);
    }

    return {
      result: 'success',
    };
  });
};

export const updateOrCreateModel = async (
  id: string, model: ModelInformation, keys?: Array<keyof ModelInformation>,
) => {
  return await updateOrCreate(id, { ref: 'models', data: model, keys });
};

export const updateOrCreateNode = async (node: ProvenanceNode, keys?: Array<keyof ProvenanceNode>) => {
  return await updateOrCreate(node.id, { ref: 'nodes', data: node, keys });
};


export const resetDatabase = async () => {
  await getRef('models').set(null);
  await getRef('nodes').set(null);

  for (const node of testData.nodes) {
    await updateOrCreateNode(node);
  }

  for (const model of Object.values(testData.models)) {
    await updateOrCreateModel(model.id, model);
  }
};

const deleteItem = async (key: NodesModels, id: string) => {
  return await withHandling(async (): Promise<BackendSuccess | BackendNotFound> => {
    const ref = getRef(key).child(id);
    const snapshot = await ref.once('value');

    if (!snapshot.exists()) {
      return {
        result: 'not-found',
      };
    }

    // tslint:disable-next-line: no-console
    console.info(`Deleting ${id}`);
    ref.remove();
    return {
      result: 'success',
    };
  });
};

export const deleteNode = async (id: string) => {
  return await deleteItem('nodes', id);
};

export const deleteModel = async (id: string) => {
  return await deleteItem('models', id);
};
