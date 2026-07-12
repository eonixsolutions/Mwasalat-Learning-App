import api from '../api/axios.js';

const getAll = async (params = {}) => {
  const res = await api.get('/notifications', { params });
  return res.data.data;
};

const markRead = async (id) => {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data.data;
};

const markAllRead = async (params = {}) => {
  const res = await api.patch('/notifications/read-all', null, { params });
  return res.data.data;
};

export const notificationService = { getAll, markRead, markAllRead };
