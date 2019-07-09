import * as dotenv from 'dotenv';
import neo4j from 'neo4j-driver';
import { ProvenanceNode, ModelInformation, provenanceNodeTypes } from 'common';

dotenv.config();

const uri = process.env.DB_URI;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;

if (!uri) {
  throw Error('DB_URI is required.');
}

if (!user) {
  throw Error('DB_USER is required.');
}

if (!password) {
  throw Error('DB_PASSWORD is required.');
}

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const session = driver.session();

const personName = 'Alice';
const resultPromise = session.run(
  'CREATE (a:Person {name: $name}) RETURN a',
  {name: personName},
);

resultPromise.then((result) => {
  session.close();

  const singleRecord = result.records[0];
  const node = singleRecord.get(0);

  console.log(node.properties.name);

  // on application exit
  driver.close();
});

export interface BackendSuccess {
  result: 'success';
}

export interface BackendError {
  result: 'error';
  message: string;
}

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

type NodesModels = 'nodes' | 'models';

type GenericArgument = {
  ref: 'models',
  data: ModelInformation,
  keys?: Array<keyof ModelInformation>,
} | {
  ref: 'nodes',
  data: ProvenanceNode,
  keys?: Array<keyof ProvenanceNode>,
};

// https://neo4j.com/docs/cypher-manual/current/syntax/parameters/

const updateOrCreate = async (id: string, arg: GenericArgument) => {
  return await withHandling(async (): Promise<BackendSuccess> => {
    const nodeName = arg.ref === 'models' ? 'SimulationStudy' : arg.data.type;

    const object = arg.data;
    const partial: Partial<typeof arg.data> = {};
    const toRemove: string[] = []
    for (const key of arg.keys) {
      if (object[key] === undefined) {
        toRemove.push(key);
      } else {
        partial[key] = object[key]
      }
    }

    const session = driver.session();
    
    console.info(`Updating or creating ${id} using: ${arg.keys}`);
    session.run(
      `
      MERGE (n:${nodeName} { id: $id })
      ON CREATE SET n = $object
      ON MATCH  SET n += $partial
      `, 
      {
        id,
        object,
        partial,
      }
    )
    
    if (toRemove.length !== 0) {
      console.log(`Deleting ${toRemove} from object.`)
      session.run(
        `
        MATCH (n:${nodeName} { id: $id })
        UNWIND $keys AS key
        REMOVE n[key]
        `, 
        {
          id,
          keys: toRemove,
        }
      )
    }

    session.close();

    return {
      result: 'success',
    };
  });
};

export const updateOrCreateModel = async (
  model: ModelInformation, keys?: Array<keyof ModelInformation>,
) => {
  return await updateOrCreate('' + model.id, { ref: 'models', data: model, keys });
};

export const updateOrCreateNode = async (node: ProvenanceNode, keys?: Array<keyof ProvenanceNode>) => {
  return await updateOrCreate(node.id, { ref: 'nodes', data: node, keys });
};


async function getItems<T>(ref: NodesModels) {
  return withHandling(async (): Promise<BackendItems<T>> => {
    const nodeName = ref === 'models' ? 'SimulationStudy' : provenanceNodeTypes;
    const session = driver.session();
    

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