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

const sendFromInstructor = async (data) => {
  const res = await notificationsApi.post('/instructor', data);
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

const listReminders = async (type) => {
  const res = await notificationsApi.get('/admin/reminders', { params: type && type !== 'all' ? { type } : {} });
  return res.data.data;
};

const subscribePush = async (subscription) => {
  const res = await notificationsApi.post('/push/subscribe', { subscription });
  return res.data;
};

const unsubscribePush = async (endpoint) => {
  const res = await notificationsApi.post('/push/unsubscribe', { endpoint });
  return res.data;
};

export const mwasalatNotificationService = {
  list,
  send,
  sendFromInstructor,
  markRead,
  markAllRead,
  listSent,
  listReminders,
  subscribePush,
  unsubscribePush,
};
