import { createMwasalatApi } from '../api/mwasalatApiClient.js';

const categoriesApi = createMwasalatApi('/api/mwasalat-categories');

const list = async () => {
  const res = await categoriesApi.get('/');
  return res.data.data;
};

const listActive = async () => {
  const res = await categoriesApi.get('/active');
  return res.data.data;
};

const create = async (data) => {
  const res = await categoriesApi.post('/', data);
  return res.data.data;
};

const update = async (id, data) => {
  const res = await categoriesApi.patch(`/${id}`, data);
  return res.data.data;
};

const remove = async (id) => {
  const res = await categoriesApi.delete(`/${id}`);
  return res.data.data;
};

const suggest = async (name) => {
  const res = await categoriesApi.post('/ai-suggest', { name });
  return res.data.data;
};

export const mwasalatCategoryService = { list, listActive, create, update, remove, suggest };
