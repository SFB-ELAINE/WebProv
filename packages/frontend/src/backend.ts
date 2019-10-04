import axios from '@/axios';
import {
  Study,
  ProvenanceNode,
  ProvenanceAPI,
  RelationshipInformation,
  InformationField,
  InformationRelationship,
  DependencyRelationship,
  BackendError,
  BackendSuccess,
  uniqueId,
} from 'common';
import { getLogger, ExportInterface } from '@/utils';

const logger = getLogger();

// See https://cli.vuejs.org/guide/mode-and-env.html#using-env-variables-in-client-side-code for naming information
const baseURL = process.env.VUE_APP_BACKEND_URL || 'http://localhost:3000/';
logger.info(`VUE_APP_BACKEND_URL set to ${process.env.VUE_APP_BACKEND_URL}. Using ${baseURL} as the base URL.`);

const api = axios.create<ProvenanceAPI>({
  baseURL,
});

api.interceptors.request.use((request) => {
  logger.debug(`REQUEST to ${request.url}`, request);
  return request;
});

export const updateOrCreateNode = async (
  node: ProvenanceNode | ProvenanceNode[],
) => {
  return (await api.post('/nodes', node)).data;
};

export const updateOrCreateInformationNode = async (node: InformationField | InformationField[]) => {
  return (await api.post('/information', node)).data;
};

export const updateOrCreateStudy = async (
  study: Study,
) => {
  return (await api.post('/studies', { item: study })).data;
};

export const updateOrCreateDependency = async (
  information: RelationshipInformation<DependencyRelationship>,
) => {
  return (await api.post('/nodes/dependencies', information)).data;
};

// TODO refactor this into two functions. This will make it easier
export const addInformationEntry = async (
  relationship: RelationshipInformation<InformationRelationship>,
  information: InformationField,
) => {
  return (await api.post('/nodes/information', { relationship, information  })).data;
};

export const deleteNode = async (id: string) => {
  return (await api.delete('/nodes', { params: { id } })).data;
};

export const deleteStudy = async (id: string) => {
  return (await api.delete('/studies', { params: { id } })).data;
};

export const deleteDependency = async (id: string) => {
  return (await api.delete('/nodes/dependencies', { params: { id } })).data;
};

export const deleteInformationNode = async (id: string) => {
  return (await api.delete('/information', { params: { id } })).data;
};

export const getStudies = async () => {
  return (await api.get('/studies')).data;
};

export const getRules = async () => {
  return (await api.get('/rules')).data;
};

export const getDefinitions = async () => {
  return (await api.get('/definitions')).data;
};

export const getNodes = async () => {
  return (await api.get('/nodes')).data;
};

export const getInformationNodes = async () => {
  return (await api.get('/information')).data;
};

export const getNodeDependencies = async () => {
  return (await api.get('/nodes/dependencies')).data;
};

export const getNodeInformation = async () => {
  return (await api.get('/nodes/information')).data;
};

export const upload = async (data: ExportInterface): Promise<BackendError | BackendSuccess> => {
  const allNodes: ProvenanceNode[] = [];
  const informationRelationships: Array<RelationshipInformation<InformationRelationship>> = [];
  const allInformationFields: InformationField[] = [];

  data.forEach((row) => {
    const node = {
      ...row.node,
      id: row.node.id || uniqueId(),
    };

    allNodes.push(node);

    const informationFields = row.informationFields.map((informationField) => ({
      key: informationField.key,
      value: informationField.value,
      id: informationField.id || uniqueId(),
    }));

    allInformationFields.push(...informationFields);

    informationRelationships.push(...informationFields.map((informationField) => ({
      source: row.node.id,
      target: informationField.id,
      properties: informationField,
    })));
  });

  {
    const result = await updateOrCreateNode(nodes);
    if (result.result === 'error') {
      return {
        result: 'error',
        message: 'Unable to create nodes. Please try again.\n\n' + result.message,
      };
    }
  }

  {
    const result = await updateOrCreateInformationNode();
  }

  return {
    result: 'success',
  };
};
