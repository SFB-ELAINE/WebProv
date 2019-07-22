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
    })
  }
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
    return 'OK'
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

  router.get('/studies', async () => {
    return await getItems(SimulationStudySchema);
  })

  router.get('/studies/study-id/max', async () => {
    return await getMax(SimulationStudySchema, 'studyId');
  })

  router.delete('/nodes', async (req) => {
    return await deleteNode(req.query.id);
  })

  router.delete('/studies', async (req) => {
    return await deleteItem(SimulationStudySchema, req.query.id);
  })

  router.post('/nodes', async (req) => {
    return await updateOrCreate(ProvenanceNodeSchema, req.body.item);
  })

  router.get('/nodes/dependencies', async () => {
    return await getRelationships(DependencyRelationshipSchema);
  })

  router.post('/nodes/dependencies', async (req) => {
    return await updateOrCreateConnection(DependencyRelationshipSchema, req.body);
  })

  router.get('/nodes/information', async () => {
    return await getRelationships(InformationRelationshipSchema);
  })

  router.post('/nodes/information', async (req) => {
    const result1 = await updateOrCreate(InformationFieldSchema, req.body.information);
    if (result1.result !== 'success') {
      return result1;
    }

    return await updateOrCreateConnection(InformationRelationshipSchema, req.body.relationship);
  })

  router.post('/studies', async (req) => {
    return await updateOrCreate(SimulationStudySchema, req.body.item);
  })

  router.delete('/nodes/dependencies', async (req) => {
    return await deleteRelationship(DependencyRelationshipSchema, req.query.id);
  })

  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}!`);
  })
};

create();