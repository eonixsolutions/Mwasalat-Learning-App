import { createMwasalatApi } from '../api/mwasalatApiClient.js';

const chatApi = createMwasalatApi('/api/mwasalat-chat');

const getOrCreateAsLearner = async (programId) => {
  const res = await chatApi.post(`/learner/${programId}`);
  return res.data.data;
};

const getOrCreateAsInstructor = async (programId, learnerId) => {
  const res = await chatApi.post(`/instructor/${programId}/${learnerId}`);
  return res.data.data;
};

const listMyConversations = async () => {
  const res = await chatApi.get('/');
  return res.data.data;
};

const getMessages = async (conversationId) => {
  const res = await chatApi.get(`/${conversationId}/messages`);
  return res.data.data;
};

const sendMessage = async (conversationId, text) => {
  const res = await chatApi.post(`/${conversationId}/messages`, { text });
  return res.data.data;
};

const markRead = async (conversationId) => {
  const res = await chatApi.patch(`/${conversationId}/read`);
  return res.data;
};

export const mwasalatChatService = {
  getOrCreateAsLearner, getOrCreateAsInstructor, listMyConversations, getMessages, sendMessage, markRead,
};
