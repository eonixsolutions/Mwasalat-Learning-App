import api from '../api/axios.js';

const getAll = async (params = {}) => {
  const res = await api.get('/batches', { params });
  return res.data.data;
};

const create = async (data) => {
  const res = await api.post('/batches', data);
  return res.data.data;
};

const update = async (id, data) => {
  const res = await api.patch(`/batches/${id}`, data);
  return res.data.data;
};

const toggleActive = async (id) => {
  const res = await api.patch(`/batches/${id}/toggle`);
  return res.data.data;
};

export const batchService = { getAll, create, update, toggleActive };
