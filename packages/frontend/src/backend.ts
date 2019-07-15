import axios from 'restyped-axios';
import { SimulationStudy, ProvenanceNode, ProvenanceAPI, RelationshipBasics } from 'common';
import { Depends, HasInformation } from 'common/dist/schemas';

// TODO(jacob) baseUrl
const api = axios.create<ProvenanceAPI>({
  baseURL: 'http://localhost:3000/',
});

export const updateOrCreateNode = async (
  node: ProvenanceNode, keys?: Array<keyof ProvenanceNode>,
) => {
  return (await api.post('/nodes', { item: node, keys })).data;
};

export const updateOrCreateModel = async (
  model: SimulationStudy, keys?: Array<keyof SimulationStudy>,
) => {
  return (await api.post('/studies', { item: model, keys })).data;
};

export const createDependency = async (
  information: RelationshipBasics<Depends>,
) => {
  return (await api.post('/nodes/dependencies', information)).data;
};

export const addInformationEntry = async (
  information: RelationshipBasics<HasInformation>,
) => {
  return (await api.post('/nodes/information', information)).data;
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

export const deleteInformationField = async (id: string) => {
  return (await api.delete('/nodes/information', { params: { id } })).data;
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
