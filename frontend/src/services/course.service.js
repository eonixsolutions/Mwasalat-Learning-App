import api from '../api/axios.js';

const getActive = async () => {
  const res = await api.get('/courses/active');
  return res.data.data;
};

const getMyEnrollment = async () => {
  const res = await api.get('/courses/enrollment');
  return res.data.data;
};

const logActivity = async () => {
  const res = await api.post('/courses/log-activity');
  return res.data.data;
};

const getAll = async () => {
  const res = await api.get('/courses');
  return res.data.data;
};

const create = async (data) => {
  const res = await api.post('/courses', data);
  return res.data.data;
};

const update = async ({ id, ...data }) => {
  const res = await api.patch(`/courses/${id}`, data);
  return res.data.data;
};

const remove = async (id) => {
  const res = await api.delete(`/courses/${id}`);
  return res.data;
};

export const courseService = { getActive, getMyEnrollment, logActivity, getAll, create, update, remove };
