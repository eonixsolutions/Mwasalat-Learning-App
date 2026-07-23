import { createMwasalatApi } from '../api/mwasalatApiClient.js';

const discussionApi = createMwasalatApi('/api/mwasalat-discussions');

const listThreads = async (programId) => {
  const res = await discussionApi.get(`/programs/${programId}/threads`);
  return res.data.data;
};

const createThread = async (programId, { title, body }) => {
  const res = await discussionApi.post(`/programs/${programId}/threads`, { title, body });
  return res.data.data;
};

const getThread = async (threadId) => {
  const res = await discussionApi.get(`/threads/${threadId}`);
  return res.data.data;
};

const addReply = async (threadId, body) => {
  const res = await discussionApi.post(`/threads/${threadId}/replies`, { body });
  return res.data.data;
};

const deleteThread = async (threadId) => {
  const res = await discussionApi.delete(`/threads/${threadId}`);
  return res.data.data;
};

const deleteReply = async (replyId) => {
  const res = await discussionApi.delete(`/replies/${replyId}`);
  return res.data.data;
};

const togglePin = async (threadId) => {
  const res = await discussionApi.patch(`/threads/${threadId}/pin`);
  return res.data.data;
};

const toggleResolved = async (threadId) => {
  const res = await discussionApi.patch(`/threads/${threadId}/resolve`);
  return res.data.data;
};

export const mwasalatDiscussionService = {
  listThreads, createThread, getThread, addReply, deleteThread, deleteReply, togglePin, toggleResolved,
};
