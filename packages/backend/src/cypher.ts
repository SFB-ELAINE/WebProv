import { 
  BackendError, 
  BackendSuccess, 
  BackendItems, 
  BackendNotFound, 
  TypeOf, 
  Schema,
  RelationshipSchema,
  BackendRelationships,
  getType,
  keys,
  RelationshipBasics
} from 'common';

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


export async function getItems<S extends Schema>(schema: S) {
  return withHandling(async (): Promise<BackendItems<TypeOf<S>>> => {
    const session = driver.session();
    const result: StatementResult<[Neo4jNode<S>]> = await session.run(`
    MATCH (n:${schema.name})
    RETURN n
    `)

    const items = result.records.map(record => record.get(0).properties);
    session.close();

    return {
      result: 'success',
      items,
    };
  });
}

interface Neo4jNode<S extends Schema> extends neo4j.Node {
  properties: TypeOf<S>;
}

interface Neo4jRelationship<R extends Schema> extends neo4j.Relationship {
  properties: TypeOf<R>;
}

interface Record<T extends any[]> extends neo4j.Record {
  get<I extends number>(key: I): T[I];
}

interface StatementResult<T extends any[]> extends neo4j.StatementResult {
  records: Record<T>[];
}

export async function getRelationships<A extends Schema, B extends Schema, R extends RelationshipSchema<A, B>>(
  schema: R,
) {
  return withHandling(async (): Promise<BackendRelationships<TypeOf<R>>> => {
    const session = driver.session();
    const result: StatementResult<[Neo4jNode<A>, Neo4jNode<B>, Neo4jRelationship<R>]> = await session.run(
      `
      MATCH (a:${schema.source.name})-[r:${schema.name}]->(b:${schema.target.name})
      RETURN a, b, r
      `, 
    )

    const sourceIds = result.records.map(record => record.get(0).properties.id);
    const targetIds = result.records.map(record => record.get(1).properties.id);
    const relationships = result.records.map(record => record.get(2).properties);
    session.close();


    return {
      result: 'success',
      items: relationships.map((relationship, i) => {
        return {
          properties: relationship,
          source: sourceIds[i],
          target: targetIds[i],
        }
      }),
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

export const deleteRelationship = async <A extends Schema, B extends Schema>(
  schema: RelationshipSchema<A, B>, id: string
) => {
  return await withHandling(async (): Promise<BackendSuccess | BackendNotFound> => {
    const session = driver.session();
    
    // TODO return failure information
    await session.run(`
    MATCH (:${schema.source.name})-[r:${schema.name}]-(:${schema.target.name}) 
    WHERE id(r) = ${id} 
    DELETE r
    `, { id });

    session.close();

    return {
      result: 'success',
    };
  });
};

export const updateOrCreateConnection = async <A extends Schema, B extends Schema, R extends RelationshipSchema<A, B>>(
  schema: R, information: RelationshipBasics<TypeOf<R>>,
) => {
  return await withHandling(async (): Promise<BackendSuccess | BackendError> => {
    const type = getType(schema);
    const session = driver.session();
    await session.run(
      `
      MATCH (a:${schema.source.name} { id: $source }), (b:${schema.target.name} { id: $target })
      MERGE (a)-[r:${schema.name}]->(b)
      ON CREATE SET r = $props
      ON MATCH SET r = $props
      `, 
      { 
        source: information.source, 
        target: information.target, 
        props: type.encode(information.properties) 
      }
    )

    session.close();

    return {
      result: 'success',
    };
  });
}
