import RestypedRouter from 'restyped-express-async';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as data from './data';
import { 
  getModels, 
  getProvenanceNodes, 
  deleteNode, 
  deleteModel, 
  updateOrCreateNode, 
  updateOrCreateModel 
} from './neo4j';
import { BackupAPI } from 'common';

export function literal<T extends string>(o: T): T {
  return o;
}

export const resetDatabase = async () => {
  for (const node of data.nodes) {
    await updateOrCreateNode(node);
  }

  for (const model of Object.values(data.studies)) {
    await updateOrCreateModel(model);
  }
}

const create = () => {
  // SETUP FOR EXPRESS //
  const app = express();
  app.use(bodyParser.json());

  app.use(cors());

  const apiRouter = express.Router();
  app.use('/', apiRouter);
  const router = RestypedRouter<BackupAPI>(apiRouter);

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

server.listen(3000, () => console.log(`Backend listening on port ${3000}!`))