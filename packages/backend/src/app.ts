import RestypedRouter from 'restyped-express-async';
import { BackupAPI } from 'specification';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

export function literal<T extends string>(o: T): T {
  return o;
}

export default () => {
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