import * as testData from '@/testData';
import firebase from 'firebase/app';
import { ProvenanceNode, ModelInformation, Model } from '@/specification';

export interface SerializedProject {
  name: string;
}

export interface Error {
  result: 'error';
  message: string;
}

export interface Success {
  result: 'success';
}

export interface Items<T> {
  result: 'success';
  items: T[];
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

const withHandling = async <T>(f: () => Promise<T>): Promise<T | Error> => {
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
  return withHandling(async (): Promise<Items<T>> => { // Promise<ProvenanceNodes>
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

type GenericArgument = { ref: 'models', data: ModelInformation } | { ref: 'nodes', data: ProvenanceNode };

const updateOrCreate = async (id: string, arg: GenericArgument) => {
  return await withHandling(async (): Promise<Success> => {
    const ref = getRef(arg.ref).child(id);
    const snapshot = await ref.once('value');

    if (!snapshot.exists()) {
      ref.set(arg.data);
    } else {
      ref.update(arg.data);
    }

    return {
      result: 'success',
    };
  });
};

export const updateOrCreateModel = async (id: string, model: ModelInformation) => {
  return await updateOrCreate(id, { ref: 'models', data: model });
};

export const updateOrCreateNode = async (id: string, node: ProvenanceNode) => {
  return await updateOrCreate(id, { ref: 'nodes', data: node });
};


export const resetDatabase = async () => {
  await getRef('models').set(null);
  await getRef('nodes').set(null);

  for (const node of testData.nodes) {
    console.log('Creating ' + node.id);
    await updateOrCreateNode(node.id, node);
  }

  for (const model of Object.values(testData.models)) {
    await updateOrCreateModel(model.id, model);
  }
};
