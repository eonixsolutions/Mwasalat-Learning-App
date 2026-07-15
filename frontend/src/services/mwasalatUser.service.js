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

const setActive = async (id, isActive, reason) => {
  const res = await mwasalatUsersApi.patch(`/${id}/active`, { isActive, reason });
  return res.data.data;
};

export const mwasalatUserService = { listByRole, inviteInstructor, setActive };
