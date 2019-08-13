import RestypedRouter from 'restyped-express-async';
import express from 'express';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import * as data from './data';
import { 
  getItems, 
  deleteItem, 
  updateOrCreate, 
  clearDatabase,
  updateOrCreateConnection,
  getRelationships,
  deleteRelationship,
  deleteRelationshipByType,
  initialize,
  getMax,
  query,
  getNodesRelationships,
  getRecursive,
} from './cypher';
import { 
  ProvenanceAPI, 
  ProvenanceNodeSchema, 
  SimulationStudySchema, 
  DependencyRelationshipSchema, 
  InformationRelationshipSchema, 
  InformationFieldSchema,
  BackendError,
  BackendNotFound,
  BackendSuccess,
  ProvenanceNodeIndex,
  InformationFieldIndex,
  SimulationStudyIndex,
  Schema,
  RelationshipSchema,
  RelationshipInformation,
  TypeOf,
} from 'common';

export function literal<T extends string>(o: T): T {
  return o;
}

const getItemsByConnection = <A extends Schema, B extends Schema, R extends RelationshipSchema<A, B>>(
  tuples: Array<[TypeOf<A>, TypeOf<B>, TypeOf<R>]>,
): Array<RelationshipInformation<TypeOf<R>>> => {
  return tuples.map(([source, target, relationship]) => ({ 
    source: source.id, 
    target: target.id,
    properties: relationship,
  }));
}

const deleteNode = async (id: string): Promise<BackendSuccess | BackendError | BackendNotFound> => {
  // Ok, first delete all of the information nodes attached to the given provenance node
  const result1 = await deleteRelationshipByType(InformationRelationshipSchema, id);
  if (result1.result !== 'success') {
    return result1;
  }

  // Now, delete the provenance node.
  const result2 =  await deleteItem(ProvenanceNodeSchema, id);
  if (result2.result !== 'success') {
    return result2;
  }


  return {
    result: 'success',
  };
}

export const resetDatabase = async () => {
  clearDatabase();

  console.log('Creating ' + data.nodes.length + ' Nodes');
  for (const node of data.nodes) {
    const result = await updateOrCreate(ProvenanceNodeSchema, node);
    if (result.result === 'error') {
      console.error(`ERROR: Error creating ${node.type}: ${result.message}`);
    }
  }

  for (const study of data.studies) {
    const result = await updateOrCreate(SimulationStudySchema, study);
    if (result.result === 'error') {
      console.error(`ERROR: Error creating stufy: ${result.message}`);
    }
  }

  for (const node of data.informationNodes) {
    const result = await updateOrCreate(InformationFieldSchema, node);
    if (result.result === 'error') {
      console.error(`ERROR: Error creating information: ${result.message}`);
    }
  }

  for (const connection of data.connections) {
    await updateOrCreateConnection(connection.schema, {
      source: connection.source.id,
      target: connection.target.id,
      properties: connection.properties,
    });
  }
};

const unique = <T extends { id: string }>(items: T[]) => {
  const ids = new Set<string>();
  return items.filter(item => {
    const keep = !ids.has(item.id);
    ids.add(item.id);
    return keep;
  })
}

const create = async () => {
  // SETUP FOR EXPRESS //
  const app = express();
  app.use(bodyParser.json());

  app.use(cors());

  const apiRouter = express.Router();
  app.use('/', apiRouter);
  const router = RestypedRouter<ProvenanceAPI>(apiRouter);

  await initialize();
  await resetDatabase();

  // ROUTES //
  router.get('/health', async () => {
    return 'OK';
  });

  router.get('/information', async () => {
    return await getItems(InformationFieldSchema);
  });

  router.post('/information', async (req) => {
    return await updateOrCreate(InformationFieldSchema, req.body);
  });

  router.delete('/information', async (req) => {
    return await deleteItem(InformationFieldSchema, req.query.id);
  });

  router.get('/nodes', async () => {
    return await getItems(ProvenanceNodeSchema);
  });

  router.get('/nodes/study', async (req) => {
    const studyId = +req.query.studyId;
    if (isNaN(studyId)) {
      return {
        result: literal('error'),
        message: 'Given `studyId` must be a number, not ' + req.query.studyId,
      }
    }

    const result = await getNodesRelationships(
      ProvenanceNodeSchema,
      ProvenanceNodeSchema,
      DependencyRelationshipSchema, 
      { source: { studyId } },
    );

    if (result.result === 'error') {
      return result;
    }

    const nodes = unique(result.items.map(([node]) => node));
    const relationships = result.items.map(([source, target, relationship]) => ({
      source: source.id,
      target: target.id,
      properties: relationship,
    }));

    return {
      result: literal('success'),
      item: {
        nodes,
        relationships,
      }
    }
  });

  router.get('/nodes/provenance-graph', async (req) => {
    const result = await getRecursive(
      ProvenanceNodeSchema, DependencyRelationshipSchema, req.query.id, { self: true }
    );

    if (result.result === 'error') {
      return result;
    }
    
    const nodes = result.items.map(([node]) => node);
    const relationships = result.items.map(([source, target, relationship]) => ({
      source: source.id,
      target: target.id,
      properties: relationship,
    }));

    return {
      result: literal('success'),
      item: {
        nodes,
        relationships,
      }
    }
  });

  router.get('/studies', async () => {
    return await getItems(SimulationStudySchema);
  });

  router.get('/studies/study-id/max', async () => {
    return await getMax(SimulationStudySchema, 'studyId');
  });

  router.delete('/nodes', async (req) => {
    return await deleteNode(req.query.id);
  });

  router.delete('/studies', async (req) => {
    return await deleteItem(SimulationStudySchema, req.query.id);
  });

  router.post('/nodes', async (req) => {
    return await updateOrCreate(ProvenanceNodeSchema, req.body.item);
  });

  router.get('/nodes/dependencies', async () => {
    return await getRelationships(ProvenanceNodeSchema, ProvenanceNodeSchema, DependencyRelationshipSchema);
  });

  router.post('/nodes/dependencies', async (req) => {
    return await updateOrCreateConnection(DependencyRelationshipSchema, req.body);
  });

  router.get('/nodes/information', async () => {
    return await getRelationships(ProvenanceNodeSchema, InformationFieldSchema, InformationRelationshipSchema);
  });

  router.post('/nodes/information', async (req) => {
    const result1 = await updateOrCreate(InformationFieldSchema, req.body.information);
    if (result1.result !== 'success') {
      return result1;
    }

    return await updateOrCreateConnection(InformationRelationshipSchema, req.body.relationship);
  });

  router.post('/studies', async (req) => {
    return await updateOrCreate(SimulationStudySchema, req.body.item);
  });

  router.delete('/nodes/dependencies', async (req) => {
    return await deleteRelationship(DependencyRelationshipSchema, req.query.id);
  });

  router.get('/search', async (req) => {
    // This search must search on three indexes because there are three different types of nodes in the Neo4j database
    // The fuzzy search capabilities is not supported in typical cypher queries
    // See https://graphaware.com/neo4j/2019/01/11/neo4j-full-text-search-deep-dive.html for more information about fuzzy search in Neo4j

    // FIXME One potential improvement is ranking the nodes
    // When you perform a fuzzy search, by default, the come out in order of best -> worst match
    // However, we perform multiple fuzzy searches and just concatenate to join the searches

    const text = req.query.text || '';

    // Adding the `~` turns each word into a FuzzyQuery (see the link above)
    const searchText = text.split(/ +/).map(part => `${part}~`).join(' ');
    console.info(`\nSearching using "${searchText}"`);

    // Search against the nodes using the provenance node index
    const r1 = await query(ProvenanceNodeSchema, ProvenanceNodeIndex, searchText);
    const nodes = r1.result === 'success' ? r1.items : [];
    console.info(`Provenance node search returned ${nodes.length} nodes`);
    
    // Search against all of the information fields using the information field index
    const r2 = await query(InformationFieldSchema, InformationFieldIndex, searchText);
    if (r2.result === 'success') {
      // Using the returned information fields, find the corresponding provenance nodes
      const r21 = await getNodesRelationships(ProvenanceNodeSchema, InformationFieldSchema, InformationRelationshipSchema, {
        target: {
          id: r2.items.map(item => item.id)
        }
      })

      if (r21.result === 'success') {
        console.info(`Information field search returned ${r21.items.length} nodes`);
        nodes.push(...r21.items.map(([node]) => node))
      }
    }

    // Now, query on the studies using the study index
    const r3 = await query(SimulationStudySchema, SimulationStudyIndex, searchText);
    if (r3.result === 'success') {
      // Then, find all of the provenance nodes that have the studyIds
      const r31 = await getItems(ProvenanceNodeSchema, { studyId: r3.items.map(item => item.studyId) });
      if (r31.result === 'success') {
        console.info(`Study search returned ${r31.items.length} nodes`);
        nodes.push(...r31.items);
      }
    }

    // Because the fuzzy search only indexes text, if the user searches for `12` for example, nothing will come up even if there is a study that has a studyId === 12
    // So, if the user did enter a number, we search the nodes that have a studyId that match the entered number
    const studyId = +text; // could be nan
    if (!isNaN(studyId)) {
      const r4 = await getItems(ProvenanceNodeSchema, { studyId });
      if (r4.result === 'success') {
        nodes.push(...r4.items);
      }
    }
    
    return {
      result: literal('success'),
      items: unique(nodes),
    };
  })

  // Heroku sets the port and we must use this port
  const PORT = Number.parseInt(process.env.PORT || '') || 3000;
  // For some reason, we need to specify '0.0.0.0' for the host for Heroku or else binding fails
  const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
  app.listen(PORT, HOST, () => {
    console.log(`Backend listening at http://${HOST}:${PORT}`);
  });
};

create();
