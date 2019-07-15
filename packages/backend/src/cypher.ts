import * as t from 'io-ts';
import { 
  BackendError, 
  BackendSuccess, 
  BackendItems, 
  BackendNotFound, 
  TypeOf, 
  Schema,
  RelationshipSchema,
  Relationship
} from 'common';

const tuple = <T extends any[]>(...args: T): T => args;

const keys = <T extends object>(arg: T) => Object.keys(arg) as Array<keyof T & string>;

const toObject = <T>(arg: Array<[string, T]>) => {
  const obj: { [k: string]: T } = {};
  arg.forEach(([key, value]) => {
    obj[key] = value;
  });

  return obj;
};

import * as dotenv from 'dotenv';
import neo4j from 'neo4j-driver';
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

const getType = <S extends Schema>(schema: S) => {
  const required = schema.required;
  const optional = schema.optional || {};
  const r = toObject(keys(required).map((key) => tuple(key, required[key].type)))
  const o = toObject(keys(optional).map((key) => tuple(key, required[key].type)))
  return t.exact(t.intersection([
    t.type(r),
    t.partial(o),
  ]));
}

export const updateOrCreate = async <S extends Schema>(
  schema: S, obj: TypeOf<S>, objKeys?: Array<keyof typeof obj>
) => {
  return await withHandling(async (): Promise<BackendSuccess> => {
    const type = getType(schema);

    const partial: Partial<typeof obj> = {};
    const toRemove: Array<keyof typeof obj> = []
    for (const key of objKeys || keys(obj)) {
      if (obj[key] === undefined) {
        toRemove.push(key);
        delete obj[key];
      } else {
        partial[key] = obj[key];
      }
    }

    // Create an exact encoding of the object
    const object = type.encode(obj);

    const session = driver.session();
    await session.run(
      `
      MERGE (n:${schema.name} { id: $id })
      ON CREATE SET n = $object
      ON MATCH  SET n += $partial
      `, 
      {
        id: obj.id,
        object,
        partial,
      }
    )

    if (toRemove.length !== 0) {
      console.log(`Deleting ${toRemove} from object.`)
      await session.run(
        `
        MATCH (n:${schema.name} { id: $id })
        UNWIND $keys AS key
        REMOVE n[key]
        `, 
        {
          id: obj.id,
          keys: toRemove,
        }
      )
    }

    session.close();

    return {
      result: 'success',
    };
  })
}


export async function getItems<T>(schema: Schema) {
  return withHandling(async (): Promise<BackendItems<T>> => {
    const session = driver.session();
    const result = await session.run(`
    MATCH (n:${schema.name})
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

export const clearDatabase = async () => {
  const session = driver.session();
  await session.run(`
  MATCH (n)
  DETACH DELETE n
  `)
  session.close();
};

export const deleteItem = async (schema: Schema, id: string) => {
  return await withHandling(async (): Promise<BackendSuccess | BackendNotFound> => {
    const session = driver.session();
    
    // tslint:disable-next-line: no-console
    console.info(`Deleting ${id}`);
    const result = await session.run(`
    MATCH (n:${schema.name} { id: $id })
    DELETE n
    `, { id })
    // console.log(result.records);
    // console.log(result.summary);

    session.close();

    return {
      result: 'success',
    };
  });
};

export const createConnection = async <A extends Schema, B extends Schema, R extends RelationshipSchema<A, B>>(
  relationship: Relationship<A, B, R>,
) => {
  return await withHandling(async (): Promise<BackendSuccess | BackendNotFound> => {
    const type = getType(relationship.schema);

    // remove all extra key/value pairs
    const object = type.encode(relationship.properties);

    const session = driver.session();
    
    await session.run(
      `
      MATCH (a:${relationship.schema.source.name} { id: $source }), (b:${relationship.schema.target.name} { id: $target })
      CREATE (a)-[r:${relationship.schema.name} $props]->(b)
      RETURN r
      `, 
      { 
        source: relationship.source.id, 
        target: relationship.source.id, 
        props: object 
      })
    // console.log(result.records.map(r => r.get(0)));

    session.close();

    return {
      result: 'success',
    };
  });
}
