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
  createConnection,
  NodeModel,
  DependsRelationship,
  SimulationStudyModel,
} from './cypher';
import { ProvenanceAPI, ProvenanceNode } from 'common';

export function literal<T extends string>(o: T): T {
  return o;
}

export const resetDatabase = async () => {
  clearDatabase();

  // const connections: Array<[ProvenanceNode, ProvenanceNodeConnection]> = [];
  for (const node of data.nodes) {
    // if (node.connections) {
    //   node.connections.forEach(connection => {
    //     connections.push([node, connection])
    //   })
    // }

    // delete node.connections;

    const result = await updateOrCreate(NodeModel, node);
    if (result.result === 'error') {
      console.log(`ERROR: Error creating ${node.type}: ${result.message}`);
    }
  }

  // for (const [source, connectionInfo] of connections) {
  //   await createConnection(DependsRelationship, { type: connectionInfo.type, id: connectionInfo.id }, source.id, connectionInfo.targetId)
  // }

  for (const study of Object.values(data.studies)) {
    const result = await updateOrCreate(SimulationStudyModel, study);

    if (result.result === 'error') {
      console.log(`Error creating ${study.id}: ${result.message}`);
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
    return await getItems(NodeModel)
  });

  router.get('/studies', async () => {
    return await getItems(SimulationStudyModel);
  })

  router.delete('/nodes', async (req) => {
    return await deleteItem(NodeModel, req.query.id);
  })

  router.delete('/studies', async (req) => {
    return await deleteItem(SimulationStudyModel, req.query.id);
  })

  router.post('/nodes', async (req) => {
    // TODO This should use the types from the DB
    return await updateOrCreate(NodeModel, req.body.item, req.body.keys);
  })

  router.post('/studies', async (req) => {
    return await updateOrCreate(SimulationStudyModel, req.body.item, req.body.keys);
  })

  return app;
};

const server = create();

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}!`);
})