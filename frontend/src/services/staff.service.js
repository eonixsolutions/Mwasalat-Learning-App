import api from '../api/axios.js';

const validateInvite = async (token) => {
  const res = await api.get(`/auth/invite/${token}`);
  return res.data.data;
};

const registerWithInvite = async (data) => {
  const res = await api.post('/auth/register/staff', data);
  return res.data.data;
};

const getAll = async (params = {}) => {
  const res = await api.get('/staff', { params });
  return res.data.data;
};

const getPending = async () => {
  const res = await api.get('/staff', { params: { isApproved: 'false', isRejected: 'false', limit: 1 } });
  return res.data.data;
};

const createInvite = async ({ role, email }) => {
  const res = await api.post('/staff/invites', { role, email });
  return res.data.data;
};

const getInvites = async (params = {}) => {
  const res = await api.get('/staff/invites', { params });
  return res.data.data;
};

const revokeInvite = async (id) => {
  const res = await api.patch(`/staff/invites/${id}/revoke`);
  return res.data.data;
};

const approveStaff = async (id) => {
  const res = await api.patch(`/staff/${id}/approve`);
  return res.data.data;
};

const rejectStaff = async (id) => {
  const res = await api.patch(`/staff/${id}/reject`);
  return res.data.data;
};

const assignStaff = async (id, { branches, batches }) => {
  const res = await api.patch(`/staff/${id}/assign`, { branches, batches });
  return res.data.data;
};

const manageRoles = async (id, { action, role }) => {
  const res = await api.patch(`/staff/${id}/roles`, { action, role });
  return res.data.data;
};

const getMyProfile = async () => {
  const res = await api.get('/staff/me');
  return res.data.data;
};

const updateMyProfile = async (data) => {
  const res = await api.patch('/staff/me', data);
  return res.data.data;
};

const getMyStudents = async (params = {}) => {
  const res = await api.get('/staff/me/students', { params });
  return res.data.data;
};

const getMyCourses = async () => {
  const res = await api.get('/staff/me/courses');
  return res.data.data;
};

const setMicrosoftEmail = async (id, microsoftEmail) => {
  const res = await api.patch(`/staff/${id}/microsoft-email`, { microsoftEmail });
  return res.data.data;
};

export const staffService = {
  getMyProfile,
  updateMyProfile,
  getMyStudents,
  getMyCourses,
  validateInvite,
  registerWithInvite,
  getAll,
  getPending,
  createInvite,
  getInvites,
  revokeInvite,
  approveStaff,
  rejectStaff,
  assignStaff,
  manageRoles,
  setMicrosoftEmail,
};
