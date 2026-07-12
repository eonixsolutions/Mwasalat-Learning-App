import api from '../api/axios.js';

const submit = async (data) => {
  const res = await api.post('/contact', data);
  return res.data;
};

const getAll = async (status) => {
  const res = await api.get('/contact', { params: status ? { status } : {} });
  return res.data.data;
};

const getById = async (id) => {
  const res = await api.get(`/contact/${id}`);
  return res.data.data;
};

const close = async (id) => {
  const res = await api.patch(`/contact/${id}/close`);
  return res.data.data;
};

export const contactService = { submit, getAll, getById, close };
