import api from '../api/axios.js';

const register = async (data) => {
  const res = await api.post('/auth/register/coordinator', data);
  return res.data.data;
};

const getAll = async (params = {}) => {
  const res = await api.get('/coordinators', { params });
  return res.data.data;
};

const approve = async (id) => {
  const res = await api.patch(`/coordinators/${id}/approve`);
  return res.data.data;
};

const reject = async ({ id, reason }) => {
  const res = await api.patch(`/coordinators/${id}/reject`, { reason });
  return res.data.data;
};

export const coordinatorService = { register, getAll, approve, reject };
