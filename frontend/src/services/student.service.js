import api from '../api/axios.js';

const getAll = async (params = {}) => {
  const res = await api.get('/students', { params });
  return res.data.data;
};

const getById = async (id) => {
  const res = await api.get(`/students/${id}`);
  return res.data.data;
};

const approve = async (id) => {
  const res = await api.patch(`/students/${id}/approve`);
  return res.data.data;
};

const updateStatus = async ({ id, status }) => {
  const res = await api.patch(`/students/${id}/status`, { status });
  return res.data.data;
};

const update = async ({ id, ...data }) => {
  const res = await api.patch(`/students/${id}`, data);
  return res.data.data;
};

const assignBatch = async (id, batchId) => {
  const res = await api.patch(`/students/${id}/batch`, { batchId });
  return res.data.data;
};

const getMyProfile = async () => {
  const res = await api.get('/students/me');
  return res.data.data;
};

const updateMyProfile = async (data) => {
  const res = await api.patch('/students/me', data);
  return res.data.data;
};

const resetTaskSheet = async (id) => {
  const res = await api.post(`/students/${id}/reset-task-sheet`);
  return res.data.data;
};

const reshareTaskSheet = async (id) => {
  const res = await api.post(`/students/${id}/reshare-task-sheet`);
  return res.data;
};

const getAcademicSummary = async (id) => {
  const res = await api.get(`/students/${id}/academic-summary`);
  return res.data.data;
};

const getMyEnrollments = async () => {
  const res = await api.get('/students/me/enrollments');
  return res.data.data;
};

const requestReEnrollment = async (data) => {
  const form = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') form.append(k, v);
  });
  const res = await api.post('/students/me/re-enroll', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
};

export const studentService = { getMyProfile, updateMyProfile, getAll, getById, approve, updateStatus, update, assignBatch, resetTaskSheet, reshareTaskSheet, getAcademicSummary, getMyEnrollments, requestReEnrollment };
