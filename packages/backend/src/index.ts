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

    return await getItems(ProvenanceNodeSchema, { studyId });
  });

  router.get('/nodes/provenance-graph', async (req) => {
    return await getRecursive(ProvenanceNodeSchema, DependencyRelationshipSchema, req.query.id, { self: true });
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
    const text = req.query.text || '';
    const number = +text; // could be nan

    const r1 = await query(ProvenanceNodeSchema, ProvenanceNodeIndex, req.query.text || '');
    const nodes = r1.result === 'success' ? r1.items : [];
    
    const r2 = await query(InformationFieldSchema, InformationFieldIndex, req.query.text || '');
    if (r2.result === 'success') {
      const r21 = await getNodesRelationships(ProvenanceNodeSchema, InformationFieldSchema, InformationRelationshipSchema, {
        target: {
          id: r2.items.map(item => item.id)
        }
      })

      if (r21.result === 'success') {
        nodes.push(...r21.items.map(([node]) => node))
      }
    }

    const r3 = await query(SimulationStudySchema, SimulationStudyIndex, req.query.text || '');
    if (r3.result === 'success') {
      const r31 = await getItems(ProvenanceNodeSchema, { studyId: r3.items.map(item => item.studyId) });
      if (r31.result === 'success') {
        nodes.push(...r31.items);
      }
    }

    if (!isNaN(number)) {
      const r4 = await getItems(ProvenanceNodeSchema, { studyId: number });
      if (r4.result === 'success') {
        nodes.push(...r4.items);
      }
    }
    
    return {
      result: literal('success'),
      items: nodes,
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
