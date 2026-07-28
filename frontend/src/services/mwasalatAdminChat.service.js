import { createMwasalatApi } from '../api/mwasalatApiClient.js';

const adminChatApi = createMwasalatApi('/api/mwasalat-admin-chat');

const listInbox = async () => {
  const res = await adminChatApi.get('/');
  return res.data.data;
};

const getThread = async (userId) => {
  const res = await adminChatApi.get(`/${userId}/messages`);
  return res.data.data;
};

const sendMessage = async (userId, text) => {
  const res = await adminChatApi.post(`/${userId}/messages`, { text });
  return res.data.data;
};

const markRead = async (userId) => {
  const res = await adminChatApi.patch(`/${userId}/read`);
  return res.data;
};

export const mwasalatAdminChatService = { listInbox, getThread, sendMessage, markRead };
