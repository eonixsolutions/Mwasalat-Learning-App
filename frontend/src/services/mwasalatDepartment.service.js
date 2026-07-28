import { createMwasalatApi } from '../api/mwasalatApiClient.js';

const departmentsApi = createMwasalatApi('/api/mwasalat-departments');

const list = async () => {
  const res = await departmentsApi.get('/');
  return res.data.data;
};

const listActive = async () => {
  const res = await departmentsApi.get('/active');
  return res.data.data;
};

const create = async (data) => {
  const res = await departmentsApi.post('/', data);
  return res.data.data;
};

const update = async (id, data) => {
  const res = await departmentsApi.patch(`/${id}`, data);
  return res.data.data;
};

const remove = async (id) => {
  const res = await departmentsApi.delete(`/${id}`);
  return res.data.data;
};

export const mwasalatDepartmentService = { list, listActive, create, update, remove };
