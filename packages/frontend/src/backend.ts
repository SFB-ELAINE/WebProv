import axios from 'restyped-axios';
import { SimulationStudy, ProvenanceNode, ProvenanceAPI, RelationshipBasics } from 'common';
import { Depends, HasInformation, Information } from 'common/dist/schemas';
import { getLogger } from '@/utils';

const logger = getLogger();

// TODO(jacob) baseUrl
const api = axios.create<ProvenanceAPI>({
  baseURL: 'http://localhost:3000/',
});

api.interceptors.request.use((request) => {
  logger.info(`REQUEST -> ${request.url}`, request);
  return request;
});

export const updateOrCreateNode = async (
  node: ProvenanceNode,
) => {
  return (await api.post('/nodes', { item: node })).data;
};

export const updateOrCreateInformationNode = async (node: Information) => {
  return (await api.post('/information', node)).data;
};

export const updateOrCreateModel = async (
  model: SimulationStudy,
) => {
  return (await api.post('/studies', { item: model })).data;
};

export const updateOrCreateDependency = async (
  information: RelationshipBasics<Depends>,
) => {
  return (await api.post('/nodes/dependencies', information)).data;
};

export const addInformationEntry = async (
  relationship: RelationshipBasics<HasInformation>,
  information: Information,
) => {
  return (await api.post('/nodes/information', { relationship, information  })).data;
};

export const deleteNode = async (id: string) => {
  return (await api.delete('/nodes', { params: { id } })).data;
};

export const deleteModel = async (id: string) => {
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
