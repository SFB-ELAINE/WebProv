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
  initialize,
  getMax,
  query,
} from './cypher';
import { 
  ProvenanceAPI, 
  ProvenanceNodeSchema, 
  SimulationStudySchema, 
  DependencyRelationshipSchema, 
} from 'common';
import { ProvenanceNodeIndex } from 'common/dist/schemas';

export function literal<T extends string>(o: T): T {
  return o;
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

  for (const connection of data.connections) {
    await updateOrCreateConnection(connection.schema, {
      source: connection.source.id,
      target: connection.target.id,
      properties: connection.properties,
    });
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

  router.get('/nodes', async () => {
    return await getItems(ProvenanceNodeSchema);
  });

  router.get('/studies', async () => {
    return await getItems(SimulationStudySchema);
  });

  router.get('/studies/study-id/max', async () => {
    return await getMax(SimulationStudySchema, 'studyId');
  });

  router.delete('/nodes', async (req) => {
    return await deleteItem(ProvenanceNodeSchema, req.query.id);
  });

  router.delete('/studies', async (req) => {
    return await deleteItem(SimulationStudySchema, req.query.id);
  });

  router.post('/nodes', async (req) => {
    return await updateOrCreate(ProvenanceNodeSchema, req.body.item);
  });

  router.get('/nodes/dependencies', async () => {
    return await getRelationships(DependencyRelationshipSchema);
  });

  router.post('/nodes/dependencies', async (req) => {
    return await updateOrCreateConnection(DependencyRelationshipSchema, req.body);
  });

  router.post('/studies', async (req) => {
    return await updateOrCreate(SimulationStudySchema, req.body.item);
  });

  router.delete('/nodes/dependencies', async (req) => {
    return await deleteRelationship(DependencyRelationshipSchema, req.query.id);
  });

  router.get('/search' as any, async (req) => {
    return await query(ProvenanceNodeIndex, req.query.text || '');
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
