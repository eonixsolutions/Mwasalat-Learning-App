import api from '../api/axios.js';

const getAll = async (onlyActive = false) => {
  const res = await api.get('/branches', { params: onlyActive ? { active: 'true' } : {} });
  return res.data.data;
};

const getPublic = async () => {
  const res = await api.get('/branches/public');
  return res.data.data;
};

const create = async (data) => {
  const res = await api.post('/branches', data);
  return res.data.data;
};

const update = async (id, data) => {
  const res = await api.patch(`/branches/${id}`, data);
  return res.data.data;
};

const toggleActive = async (id) => {
  const res = await api.patch(`/branches/${id}/toggle`);
  return res.data.data;
};

export const branchService = { getAll, getPublic, create, update, toggleActive };
