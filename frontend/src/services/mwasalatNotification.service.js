import { createMwasalatApi } from '../api/mwasalatApiClient.js';

const notificationsApi = createMwasalatApi('/api/mwasalat-notifications');

const list = async () => {
  const res = await notificationsApi.get('/');
  return res.data.data;
};

const send = async (data) => {
  const res = await notificationsApi.post('/', data);
  return res.data.data;
};

const markRead = async (id) => {
  const res = await notificationsApi.patch(`/${id}/read`);
  return res.data;
};

const markAllRead = async () => {
  const res = await notificationsApi.patch('/read-all');
  return res.data;
};

const listSent = async () => {
  const res = await notificationsApi.get('/admin/sent');
  return res.data.data;
};

export const mwasalatNotificationService = { list, send, markRead, markAllRead, listSent };
