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
} from './cypher';
import { 
  ProvenanceAPI, 
  ProvenanceNodeSchema, 
  SimulationStudyModel, 
  DependsRelationship, 
  InformationRelationship, 
  InformationSchema 
} from 'common';

export function literal<T extends string>(o: T): T {
  return o;
}

export const resetDatabase = async () => {
  clearDatabase();

  for (const node of data.nodes) {
    const result = await updateOrCreate(ProvenanceNodeSchema, node);
    if (result.result === 'error') {
      console.error(`ERROR: Error creating ${node.type}: ${result.message}`);
    }
  }

  for (const study of Object.values(data.studies)) {
    const result = await updateOrCreate(SimulationStudyModel, study);

    if (result.result === 'error') {
      console.error(`Error creating ${study.id}: ${result.message}`);
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

resetDatabase();

const create = () => {
  // SETUP FOR EXPRESS //
  const app = express();
  app.use(bodyParser.json());

  app.use(cors());

  const apiRouter = express.Router();
  app.use('/', apiRouter);
  const router = RestypedRouter<ProvenanceAPI>(apiRouter);

  // ROUTES //
  router.get('/health', async () => {
    return 'OK'
  });

  router.get('/information', async () => {
    return await getItems(InformationSchema);
  });

  router.get('/nodes', async () => {
    return await getItems(ProvenanceNodeSchema);
  });

  router.get('/studies', async () => {
    return await getItems(SimulationStudyModel);
  })

  router.delete('/nodes', async (req) => {
    return await deleteItem(ProvenanceNodeSchema, req.query.id);
  })

  router.delete('/studies', async (req) => {
    return await deleteItem(SimulationStudyModel, req.query.id);
  })

  router.post('/nodes', async (req) => {
    // TODO This should use the types from the DB
    return await updateOrCreate(ProvenanceNodeSchema, req.body.item, req.body.keys);
  })

  router.get('/nodes/dependencies', async () => {
    return await getRelationships(DependsRelationship);
  })

  router.post('/nodes/dependencies', async (req) => {
    return await updateOrCreateConnection(DependsRelationship, req.body);
  })

  router.get('/nodes/information', async () => {
    return await getRelationships(InformationRelationship);
  })

  router.post('/nodes/information', async (req) => {
    return await updateOrCreateConnection(InformationRelationship, req.body);
  })

  router.post('/studies', async (req) => {
    return await updateOrCreate(SimulationStudyModel, req.body.item, req.body.keys);
  })

  router.delete('/nodes/information', async (req) => {
    return await deleteRelationship(InformationRelationship, req.query.id);
  })

  router.delete('/nodes/dependencies', async (req) => {
    return await deleteRelationship(DependsRelationship, req.query.id);
  })

  return app;
};

const server = create();

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}!`);
})