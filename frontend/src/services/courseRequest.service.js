import api from '../api/axios.js';

const submit = async (data) => {
  const res = await api.post('/course-requests', data);
  return res.data.data;
};

const getMy = async () => {
  const res = await api.get('/course-requests/my');
  return res.data.data;
};

const getAll = async (status) => {
  const res = await api.get('/course-requests', { params: status ? { status } : {} });
  return res.data.data;
};

const review = async ({ id, action, adminNote }) => {
  const res = await api.patch(`/course-requests/${id}/review`, { action, adminNote });
  return res.data.data;
};

export const courseRequestService = { submit, getMy, getAll, review };
