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
  BackendItem,
  indexes
} from 'common';

import * as dotenv from 'dotenv';
import neo4j from 'neo4j-driver';
import { Index } from 'common/dist/neon';
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

interface GeneralParameters {
  [k: string]: any
}

type QueryData<T extends GeneralParameters> = { [K in keyof T]?: Array<T[K]> | T[K] }

/**
 * Transform a key/value dictionary to a Cypher WHERE clause. An array is returned.
 * 
 * @param name The name of the node.
 * @param params The parameters.
 * @param prepend The value to prepend to the placeholder. Why would you want to do this? To avoid name clashing...
 * @example
 * toCondition('n', { a: 'b', c: ['d'] })
 * ['n.a = $a', 'n.c IN $c']
 * 
 * * toCondition('n', { a: 'b', c: ['d'] }, 'p')
 * ['n.a = $pa', 'n.c IN $pc']
 */
const toCondition = (name: string, params?: GeneralParameters, prepend: string = '') => {
  if (!params) {
    return [];
  }

  return keys(params).map(key => `${name}.${key} ${Array.isArray(params[key]) ? 'IN' : '='} $${prepend}${key}`)
}

const toWhere = (clauses: string[], operator: 'AND' | 'OR' = 'AND') => {
  if (clauses.length === 0) {
    return '';
  }

  return `WHERE ${clauses.join(` ${operator} `)}`;
}

export const updateOrCreate = async <S extends Schema>(
  schema: S, obj: TypeOf<S>
) => {
  return await withHandling(async (): Promise<BackendSuccess | BackendError> => {
    const type = getType(schema);

    const partial: Partial<typeof obj> = {};
    for (const key of keys(obj)) {
      if (obj[key] !== undefined) {
        partial[key] = obj[key];
      }
    }

    // Create an encoding of the object
    const session = driver.session();
    const result: StatementResult<[Neo4jNode<S>]> = await session.run(
      `
      MERGE (n:${schema.name} { id: $id })
      ON CREATE SET n = $partial
      ON MATCH  SET n = $partial
      return n
      `, 
      {
        id: obj.id,
        partial: type.encode(partial),
      }
    )

    session.close();

    if (result.records.length !== 1) {
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

export async function getItems<S extends Schema>(schema: S, params?: QueryData<TypeOf<S>>) {
  return withHandling(async (): Promise<BackendItems<TypeOf<S>>> => {
    const where = toWhere(toCondition('n', params));

    const session = driver.session();
    const result: StatementResult<[Neo4jNode<S>]> = await session.run(`
    MATCH (n:${schema.name})
    ${where}
    RETURN n
    `, params)

    

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

export function* zip<A, B, C>(as: A[], bs: B[], cs: C[]): IterableIterator<[A, B, C]> {
  const min = Math.min(as.length, bs.length, cs.length);
  for (let i = 0; i < min; i++) {
    yield [as[i], bs[i], cs[i]];
  }
}

interface NodesRelationshipsQueryOptions<A extends Schema, B extends Schema> {
  source?: QueryData<TypeOf<A>>;
  target?: QueryData<TypeOf<B>>;
}

/**
 * 
 * @param a The source schema (used to help TypeScript infer types).
 * @param b The target schema (used to help TypeScript infer types).
 * @param schema The relationship schema.
 * @param options The query options.
 */
export async function getNodesRelationships<A extends Schema, B extends Schema, R extends RelationshipSchema<A, B>>(
  a: A,
  b: B,
  schema: R,
  options?: NodesRelationshipsQueryOptions<A, B>,
) {
  return withHandling(async (): Promise<BackendItems<[TypeOf<A>, TypeOf<B>, TypeOf<R>]>> => {
    const prependNodeName = (key: 'source' | 'target') => {
      if (!options) {
        return {};
      }
      
      const params = options[key];
      if (!params) {
        return {};
      }

      const transformed: GeneralParameters = {};
      keys(params).forEach(k => {
        transformed[key === 'source' ? `a${k}` : `b${k}`] = params[k];
      })

      return transformed;
    }

    const transform = (key: 'source' | 'target') => {
      if (!options) {
        return [];
      }
    
      const params = options[key];
      const name = key === 'source' ? 'a' : 'b';
      return toCondition(name, params, name);
    }

    const where = toWhere([...transform('source'), ...transform('target')]);
    const parameters = {
      ...prependNodeName('source'),
      ...prependNodeName('target')
    }

    const session = driver.session();
    const result: StatementResult<[Neo4jNode<A>, Neo4jNode<B>, Neo4jRelationship<R>]> = await session.run(
      `
      MATCH (a:${schema.source.name})-[r:${schema.name}]->(b:${schema.target.name})
      ${where}
      RETURN a, b, r
      `,
      parameters
    )

    const sources = result.records.map(record => record.get(0).properties);
    const targets = result.records.map(record => record.get(1).properties);
    const relationships = result.records.map(record => record.get(2).properties);
    session.close();


    return {
      result: 'success',
      items: [...zip(sources, targets, relationships)]
    };
  });
}

export async function getRelationships<A extends Schema, B extends Schema, R extends RelationshipSchema<A, B>>(
  a: A,
  b: B,
  schema: R,
) {
  return withHandling(async (): Promise<BackendRelationships<TypeOf<R>> | BackendError> => {
    const result = await getNodesRelationships(a, b, schema);
    if (result.result !== 'success') {
      return result;
    }

    return {
      result: 'success',
      items: result.items.map(([source, target, relationship]) => {
        return {
          properties: relationship,
          source: source.id,
          target: target.id
        }
      }),
    }
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
    
    // TODO return failure information
    await session.run(`
    MATCH (:${schema.source.name})-[r:${schema.name}]-(:${schema.target.name}) 
    WHERE r.id = $id
    DELETE r
    `, { id });

    session.close();

    return {
      result: 'success',
    };
  });
};

export const getMax = async <S extends Schema, K extends keyof TypeOf<S>>(schema: S, key: K) => {
  return await withHandling(async (): Promise<BackendItem<number> | BackendError> => {
    const session = driver.session();
    const result: StatementResult<[number | null]> = await session.run(`
    MATCH (n:${schema.name}) RETURN MAX(n.${key})
    `)

    session.close();
    return {
      result: 'success',
      item: result.records[0].get(0) || 0,
    }
  });
}

export const updateOrCreateConnection = async <A extends Schema, B extends Schema, R extends RelationshipSchema<A, B>>(
  schema: R, information: RelationshipInformation<TypeOf<R>>,
) => {
  return await withHandling(async (): Promise<BackendSuccess | BackendError> => {
    const type = getType(schema);
    const session = driver.session();

    console.info(`Creating information relationship between ${information.source} and ${information.target}`);
    const result: StatementResult<[Neo4jRelationship<R>]> = await session.run(
      `
      MATCH (a:${schema.source.name} { id: $source }), (b:${schema.target.name} { id: $target })
      MERGE (a)-[r:${schema.name}]->(b)
      ON CREATE SET r = $props
      ON MATCH SET r = $props
      RETURN r
      `, 
      { 
        source: information.source, 
        target: information.target, 
        props: type.encode(information.properties) 
      }
    )

    session.close();
    
    if (result.records.length !== 1) {
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

  for (const index of indexes) {
    const keys = index.keys.map((key) => `'${key}'`).join(', ')
    console.log(`Creating index: ${index.name}`)
    try {
      await session.run(`CALL db.index.fulltext.createNodeIndex('${index.name}', ['${index.schema.name}'], [${keys}])`)
    } catch (e) {
      // Ignore error, thrown if index already exists
      // TODO lookup createOrUpdate??
    }
  }

  session.close();
}

export const query = async <S extends Schema, I extends Index<S>>(schema: S, index: I, searchText: string) => {
  return await withHandling(async (): Promise<BackendItems<TypeOf<S>>> => {
    if (searchText === '') {
      return {
        result: 'success',
        items: [],
      }
    }

    const session = driver.session();
    const result: StatementResult<[Neo4jNode<S>]> = await session.run(`CALL db.index.fulltext.queryNodes('${index.name}', '${searchText}')`);
    const results = result.records.map(record => record.get(0).properties);
    session.close();
    return {
      result: 'success',
      items: results,
    };
  })
}