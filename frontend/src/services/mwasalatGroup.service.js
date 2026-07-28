import { createMwasalatApi } from '../api/mwasalatApiClient.js';

const groupsApi = createMwasalatApi('/api/mwasalat-groups');

const list = async () => {
  const res = await groupsApi.get('/');
  return res.data.data;
};

const listActive = async () => {
  const res = await groupsApi.get('/active');
  return res.data.data;
};

const create = async (data) => {
  const res = await groupsApi.post('/', data);
  return res.data.data;
};

const update = async (id, data) => {
  const res = await groupsApi.patch(`/${id}`, data);
  return res.data.data;
};

const remove = async (id) => {
  const res = await groupsApi.delete(`/${id}`);
  return res.data.data;
};

export const mwasalatGroupService = { list, listActive, create, update, remove };
