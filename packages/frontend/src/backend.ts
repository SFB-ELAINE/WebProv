import axios from 'restyped-axios';
import {
  SimulationStudy,
  ProvenanceNode,
  ProvenanceAPI,
  RelationshipInformation,
  InformationField,
  InformationRelationship,
  DependencyRelationship,
} from 'common';
import { getLogger } from '@/utils';

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
  node: ProvenanceNode,
) => {
  return (await api.post('/nodes', { item: node })).data;
};

export const updateOrCreateInformationNode = async (node: InformationField) => {
  return (await api.post('/information', node)).data;
};

export const getMaxStudyId = async () => {
  return (await api.get('/studies/study-id/max')).data;
};

export const updateOrCreateStudy = async (
  study: SimulationStudy,
) => {
  return (await api.post('/studies', { item: study })).data;
};

export const updateOrCreateDependency = async (
  information: RelationshipInformation<DependencyRelationship>,
) => {
  return (await api.post('/nodes/dependencies', information)).data;
};

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

export const getNodes = async () => {
  return (await api.get('/nodes')).data;
};

export const getNodesInStudy = async (studyId: number) => {
  return (await api.get('/nodes/study', { params: { studyId: studyId.toString() } })).data;
};

export const getProvenanceGraph = async (id: string) => {
  return (await api.get('/nodes/provenance-graph', { params: { id } })).data;
};

export const search = async (text: string) => {
  return (await api.get('/search', { params: { text } })).data;
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
