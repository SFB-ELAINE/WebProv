import axios from 'restyped-axios';
import { SimulationStudy, ProvenanceNode, ProvenanceAPI } from 'common';

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

export const deleteNode = async (id: string) => {
  return (await api.delete('/nodes', { params: { id } })).data;
};

export const deleteModel = async (id: number) => {
  return (await api.delete('/studies', { params: { id } })).data;
};

export const getStudies = async () => {
  return (await api.get('/studies')).data;
};

export const getNodes = async () => {
  return (await api.get('/nodes')).data;
};
