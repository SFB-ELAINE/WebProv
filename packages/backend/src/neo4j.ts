import * as dotenv from 'dotenv';
import neo4j from 'neo4j-driver';
import { ProvenanceNode, SimulationStudy } from 'common';

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

export interface BackendItems<T> {
  result: 'success';
  items: T[];
}

export interface BackendNotFound {
  result: 'not-found';
}

type Label = 'Node' | 'SimulationStudy';

type GenericArgument = {
  label: 'SimulationStudy',
  data: SimulationStudy,
  keys?: Array<keyof SimulationStudy>,
} | {
  label: 'Node',
  data: ProvenanceNode,
  keys?: Array<keyof ProvenanceNode>,
};

// https://neo4j.com/docs/cypher-manual/current/syntax/parameters/

const updateOrCreate = async (id: string, arg: GenericArgument) => {
  return await withHandling(async (): Promise<BackendSuccess> => {
    const nodeName = arg.label;

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
      MERGE (n:${arg.label} { id: $id })
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
  model: SimulationStudy, keys?: Array<keyof SimulationStudy>,
) => {
  return await updateOrCreate('' + model.id, { label: 'SimulationStudy', data: model, keys });
};

export const updateOrCreateNode = async (node: ProvenanceNode, keys?: Array<keyof ProvenanceNode>) => {
  return await updateOrCreate(node.id, { label: 'Node', data: node, keys });
};


async function getItems<T>(label: Label) {
  return withHandling(async (): Promise<BackendItems<T>> => {
    const session = driver.session();
    const result = await session.run(`
    MATCH (n:${label})
    RETURN n
    `)

    const items = result.records.map(record => record.get(0));

    session.close();

    return {
      result: 'success',
      items,
    };
  });
}

export const getProvenanceNodes = async () => {
  return await getItems<ProvenanceNode>('Node');
};

export const getModels = async () => {
  return await getItems<SimulationStudy>('SimulationStudy');
};

export const resetDatabase = async () => {
  const session = driver.session();
  await session.run(`
  MATCH (n)
  DETACH DELETE n
  `)
  session.close();
};

const deleteItem = async (label: Label, id: string) => {
  return await withHandling(async (): Promise<BackendSuccess | BackendNotFound> => {
    const session = driver.session();
    
    // tslint:disable-next-line: no-console
    console.info(`Deleting ${id}`);
    const result = await session.run(`
    MATCH (n:${label} { id: $id })
    DELETE n
    `, { id })
    console.log(result.records);
    console.log(result.summary);

    session.close();

    return {
      result: 'success',
    };
  });
};

export const deleteNode = async (id: string) => {
  return await deleteItem('Node', id);
};

export const deleteModel = async (id: number) => {
  return await deleteItem('SimulationStudy', '' + id);
};