import RestypedRouter from 'restyped-express-async';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';

interface BackupAPI {
  '/health': {
    //
  }

  '/models': {
    GET: {
      response: {
        type: 'success';
        models: any[];
      }
    }
  }
}

export function literal<T extends string>(o: T): T {
  return o;
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
  // You must specify the return type or else TS will complain
  router.get('/health', async () => {
    return 'OK'
  });

  router.get('/models', async () => {
    return {
      type: literal('success'),
      models: [],
    }
  });



  return app;
};

const server = create();

server.listen(3000, () => console.log(`Backend listening on port ${3000}!`))