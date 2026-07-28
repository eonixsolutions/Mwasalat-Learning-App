import { createMwasalatApi } from '../api/mwasalatApiClient.js';

const mwasalatUsersApi = createMwasalatApi('/api/mwasalat-users');

const listByRole = async (role) => {
  const res = await mwasalatUsersApi.get('/', { params: { role } });
  return res.data.data;
};

const inviteInstructor = async (data) => {
  const res = await mwasalatUsersApi.post('/invite-instructor', data);
  return res.data.data;
};

const invitePlatformAdmin = async (data) => {
  const res = await mwasalatUsersApi.post('/invite-platform-admin', data);
  return res.data.data;
};

const updatePlatformAdmin = async (id, data) => {
  const res = await mwasalatUsersApi.patch(`/platform-admin/${id}`, data);
  return res.data.data;
};

const inviteStaff = async (data) => {
  const res = await mwasalatUsersApi.post('/invite-staff', data);
  return res.data.data;
};

const setActive = async (id, isActive, reason) => {
  const res = await mwasalatUsersApi.patch(`/${id}/active`, { isActive, reason });
  return res.data.data;
};

const assignDepartment = async (id, departmentId) => {
  const res = await mwasalatUsersApi.patch(`/${id}/department`, { departmentId });
  return res.data.data;
};

const assignSupervisor = async (id, supervisorId) => {
  const res = await mwasalatUsersApi.patch(`/${id}/supervisor`, { supervisorId });
  return res.data.data;
};

const bulkImport = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await mwasalatUsersApi.post('/bulk-import', formData);
  return res.data.data;
};

const getItSupportOverview = async () => {
  const res = await mwasalatUsersApi.get('/it-support/overview');
  return res.data.data;
};

const getMyTeamOverview = async () => {
  const res = await mwasalatUsersApi.get('/my-team/overview');
  return res.data.data;
};

const escalateOverdueToAdmin = async (learnerId, programId) => {
  const res = await mwasalatUsersApi.post('/my-team/escalate', { learnerId, programId });
  return res.data.data;
};

export const mwasalatUserService = {
  listByRole, inviteInstructor, invitePlatformAdmin, updatePlatformAdmin, inviteStaff, setActive, bulkImport,
  assignDepartment, assignSupervisor, getItSupportOverview, getMyTeamOverview, escalateOverdueToAdmin,
};
