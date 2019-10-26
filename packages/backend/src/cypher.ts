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
  RelationshipInformation,
  schemas,
  relationships,
} from 'common';

import * as dotenv from 'dotenv';
import neo4j from 'neo4j-driver';
dotenv.config();

// All of these are prepended with GRAPHENEDB because we are currently deploying using the Graphene Neo4j add-on for Heroku
// If we ever change our deployment method, these will need to change as well.
const uri = process.env.GRAPHENEDB_BOLT_URL;
const user = process.env.GRAPHENEDB_BOLT_USER;
const password = process.env.GRAPHENEDB_BOLT_PASSWORD;

if (!uri) {
  throw Error('GRAPHENEDB_BOLT_URL is required.');
}

if (!user) {
  throw Error('GRAPHENEDB_BOLT_USER is required.');
}

if (!password) {
  throw Error('GRAPHENEDB_BOLT_PASSWORD is required.');
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
  schema: S, objects: TypeOf<S> | Array<TypeOf<S>>
) => {
  return await withHandling(async (): Promise<BackendSuccess | BackendError> => {
    if (!Array.isArray(objects)) {
      objects = [objects];
    }

    const partials = objects.map((obj, i) => {
      const partial: Partial<TypeOf<S>> = {};
      for (const key of keys(obj)) {
        if (obj[key] !== undefined) {
          partial[key] = obj[key];
        }
      }
      return partial;
    });

    // Create an encoding of the object
    const session = driver.session();
    const result: StatementResult<Neo4jNode<S>[]> = await session.run(
      `
      UNWIND $partials AS partial
      MERGE (n:${schema.name} { id: partial.id })
      ON CREATE SET n = partial
      ON MATCH  SET n = partial
      return n
      `, 
      {
        partials,
      }
    )

    session.close();

    if (result.records.length !== partials.length) {
      return {
        result: 'error',
        message: 'Node was not created/updated successfully.'
      }
    }

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

export async function getItemsByConnection<A extends Schema, B extends Schema, R extends RelationshipSchema<A, B>>(
  schema: R, source: string,
) {
  return withHandling(async (): Promise<BackendItems<TypeOf<B>>> => {
    const session = driver.session();
    const result: StatementResult<[Neo4jNode<A>, Neo4jNode<B>, Neo4jNode<R>]> = await session.run(`
    MATCH (a:${schema.source.name} { id: $source })-[r:${schema.name}]->(b:${schema.target.name})
    RETURN a, b, r
    `, { source });

    const items = result.records.map(record => record.get(1).properties);
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

/**
 * Deletes all relationships from a source node (identified by the given id) of the given type. This also deletes the 
 * connected nodes as well.
 * 
 * @param schema The relationship schema.
 * @param id The ID of the source node.
 */
export const deleteRelationshipByType = async <A extends Schema, B extends Schema, S extends RelationshipSchema<A, B>>(
  schema: S, id: string
) => {
  return await withHandling(async (): Promise<BackendItems<TypeOf<S>> | BackendNotFound> => {
    const session = driver.session();
    
    // tslint:disable-next-line: no-console
    console.info(`Deleting ${id}`);
    const result: StatementResult<[Neo4jNode<A>, Neo4jNode<B>, Neo4jNode<S>]> = await session.run(`
    MATCH (a:${schema.source.name} { id: $id })-[r:${schema.name}]-(b:${schema.target.name})
    DETACH DELETE b
    RETURN a, b, r
    `, { id })

    session.close();

    return {
      result: 'success',
      items: result.records.map(record => record.get(2).properties),
    };
  });
};

export const deleteItem = async <S extends Schema>(schema: S, id: string) => {
  return await withHandling(async (): Promise<BackendSuccess | BackendNotFound> => {
    const session = driver.session();
    
    // tslint:disable-next-line: no-console
    console.info(`Deleting ${id}`);
    const result: StatementResult<[Neo4jNode<S>]> = await session.run(`
    MATCH (n:${schema.name} { id: $id })
    DETACH DELETE n
    RETURN n
    `, { id })

    session.close();

    if (result.records.length !== 1) {
      return {
        result: 'not-found',
      }
    }

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
    
    const result = await session.run(`
    MATCH (:${schema.source.name})-[r:${schema.name}]-(:${schema.target.name}) 
    WHERE r.id = $id
    DELETE r
    RETURN r
    `, { id });

    session.close();

    // For some reason, when we delete 1 item, we get two back?
    if (result.records.length !== 2) {
      return {
        result: 'not-found',
      }
    }

    return {
      result: 'success',
    };
  });
};

export const updateOrCreateConnection = async <A extends Schema, B extends Schema, R extends RelationshipSchema<A, B>>(
  schema: R, relationships: RelationshipInformation<TypeOf<R>> | Array<RelationshipInformation<TypeOf<R>>>,
) => {
  return await withHandling(async (): Promise<BackendSuccess | BackendError> => {
    const session = driver.session();

    if (!Array.isArray(relationships)) {
      relationships = [relationships];
    }

    const result: StatementResult<Neo4jRelationship<R>[]> = await session.run(
      `
      UNWIND $relationships AS relationship
      MATCH (a:${schema.source.name} { id: relationship.source }), (b:${schema.target.name} { id: relationship.target })
      MERGE (a)-[r:${schema.name}]->(b)
      ON CREATE SET r = relationship.properties
      ON MATCH SET r = relationship.properties
      RETURN r
      `, 
      { 
        relationships,
      }
    )

    session.close();
    
    if (result.records.length !== relationships.length) {
      return {
        result: 'error',
        message: 'Connection not created/updated successfully.'
      }
    }

    return {
      result: 'success',
    };
  });
}

/**
 * Initializes the constraints!
 */
export const initialize = async () => {
  const session = driver.session();

  for (const schema of [...schemas, ...relationships]) {
    const fields = {
      ...schema.required,
      ...(schema.optional || {}),
    }
    
    for (const fieldName of keys(fields)) {
      const fieldInformation = fields[fieldName];
      if (fieldInformation.unique || fieldInformation.primary) {
        await session.run(`CREATE CONSTRAINT ON (n:${schema.name}) ASSERT n.${fieldName} IS UNIQUE`);
      }
    };
  };

  session.close();
}
