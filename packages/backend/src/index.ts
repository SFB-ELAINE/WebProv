import RestypedRouter from 'restyped-express-async';
import express from 'express';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import * as data from './data';
import { 
  getModels, 
  getProvenanceNodes, 
  deleteNode, 
  deleteModel, 
  updateOrCreateNode, 
  updateOrCreateModel, 
  clearDatabase,
  createConnection,
} from './neo4j';
import { ProvenanceAPI, ProvenanceNodeConnection, ProvenanceNode } from 'common';

export function literal<T extends string>(o: T): T {
  return o;
}

export const resetDatabase = async () => {
  clearDatabase();

  const connections: Array<[ProvenanceNode, ProvenanceNodeConnection]> = [];
  for (const node of data.nodes) {
    if (node.connections) {
      node.connections.forEach(connection => {
        connections.push([node, connection])
      })
    }

    delete node.connections;

    const result = await updateOrCreateNode(node);
    if (result.result === 'error') {
      console.log(`ERROR: Error creating ${node.type}: ${result.message}`);
    }
  }

  for (const [source, connectionInfo] of connections) {
    await createConnection('Node', connectionInfo.id, source.id, connectionInfo.targetId, connectionInfo.type)
  }

  for (const model of Object.values(data.studies)) {
    const result = await updateOrCreateModel(model);
    if (result.result === 'error') {
      console.log(`Error creating ${model.id}: ${result.message}`);
    }
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

  router.get('/nodes', async () => {
    return await getProvenanceNodes()
  });

  router.get('/studies', async () => {
    return await getModels();
  })

  router.delete('/nodes', async (req) => {
    return await deleteNode(req.query.id);
  })

  router.delete('/studies', async (req) => {
    return await deleteModel(req.query.id);
  })

  router.post('/nodes', async (req) => {
    return await updateOrCreateNode(req.body.item, req.body.keys);
  })

  router.post('/studies', async (req) => {
    return await updateOrCreateModel(req.body.item, req.body.keys);
  })

  return app;
};

const server = create();

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}!`);
})