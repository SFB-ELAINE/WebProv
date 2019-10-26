import RestypedRouter from 'restyped-express-async';
import express from 'express';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import * as data2 from './data.2';
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
} from './cypher';
import { 
  ProvenanceAPI, 
  ProvenanceNodeSchema, 
  StudySchema, 
  DependencyRelationshipSchema, 
  InformationRelationshipSchema, 
  InformationFieldSchema,
  BackendError,
  BackendNotFound,
  BackendSuccess,
  RelationshipRuleSchema,
  NodeDefinitionSchema,
} from 'common';

export function literal<T extends string>(o: T): T {
  return o;
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

  console.log('Creating ' + data2.nodes.length + ' Nodes');
  for (const node of data2.nodes) {
    console.log('Creating node: ' + node.id);
    const result = await updateOrCreate(ProvenanceNodeSchema, node);
    if (result.result === 'error') {
      console.error(`ERROR: Error creating node: ${result.message}`);
    }
  }

  for (const study of data2.studies) {
    const result = await updateOrCreate(StudySchema, study);
    if (result.result === 'error') {
      console.error(`ERROR: Error creating study: ${result.message}`);
    }
  }

  for (const field of data2.informationNodes) {
    const result = await updateOrCreate(InformationFieldSchema, field);
    if (result.result === 'error') {
      console.error(`ERROR: Error creating field: ${result.message}`);
    }
  }

  for (const connection of data2.connections) {
    await updateOrCreateConnection(connection.schema, {
      source: connection.source.id,
      target: connection.target.id,
      properties: connection.properties,
    });
  }

  for (const rule of data.rules) {
    const result = await updateOrCreate(RelationshipRuleSchema, rule);
    if (result.result === 'error') {
      console.error(`ERROR: Error creating rule: ${result.message}`);
    }
  }

  for (const definition of data.definitions) {
    const result = await updateOrCreate(NodeDefinitionSchema, definition);
    if (result.result === 'error') {
      console.error(`ERROR: Error creating definition: ${result.message}`);
    }
  }
};

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

  router.get('/rules', async () => {
    return await getItems(RelationshipRuleSchema);
  })

  router.get('/definitions', async () => {
    return await getItems(NodeDefinitionSchema);
  })

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

  router.get('/studies', async () => {
    return await getItems(StudySchema);
  });

  router.delete('/nodes', async (req) => {
    return await deleteNode(req.query.id);
  });

  router.delete('/studies', async (req) => {
    return await deleteItem(StudySchema, req.query.id);
  });

  router.post('/nodes', async (req) => {
    return await updateOrCreate(ProvenanceNodeSchema, req.body);
  });

  router.get('/nodes/dependencies', async () => {
    return await getRelationships(DependencyRelationshipSchema);
  });

  router.post('/nodes/dependencies', async (req) => {
    return await updateOrCreateConnection(DependencyRelationshipSchema, req.body);
  });

  router.get('/nodes/information', async () => {
    return await getRelationships(InformationRelationshipSchema);
  });

  // TODO this should only create the relatinoship
  router.post('/nodes/information', async (req) => {
    const result1 = await updateOrCreate(InformationFieldSchema, req.body.information);
    if (result1.result !== 'success') {
      return result1;
    }

    return await updateOrCreateConnection(InformationRelationshipSchema, req.body.relationship);
  });

  router.post('/studies', async (req) => {
    return await updateOrCreate(StudySchema, req.body.item);
  });

  router.delete('/nodes/dependencies', async (req) => {
    return await deleteRelationship(DependencyRelationshipSchema, req.query.id);
  });

  // Heroku sets the port and we must use this port
  const PORT = Number.parseInt(process.env.PORT || '') || 3000;
  // For some reason, we need to specify '0.0.0.0' for the host for Heroku or else binding fails
  const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
  app.listen(PORT, HOST, () => {
    console.log(`Backend listening at http://${HOST}:${PORT}`);
  });
};

create();
