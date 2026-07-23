import { createMwasalatApi } from '../api/mwasalatApiClient.js';

const quizApi = createMwasalatApi('/api/mwasalat-quiz');

const upsertQuiz = async (programId, data) => {
  const res = await quizApi.put(`/${programId}`, data);
  return res.data.data;
};

const getQuizForInstructor = async (programId) => {
  const res = await quizApi.get(`/${programId}/instructor-view`);
  return res.data.data;
};

const getQuizForLearner = async (programId) => {
  const res = await quizApi.get(`/${programId}`);
  return res.data.data;
};

const submitAttempt = async (programId, answers) => {
  const res = await quizApi.post(`/${programId}/submit`, { answers });
  return res.data.data;
};

const getMyBestAttempt = async (programId) => {
  const res = await quizApi.get(`/${programId}/my-best`);
  return res.data.data;
};

const getAdminResults = async () => {
  const res = await quizApi.get('/admin/results');
  return res.data.data;
};

const generateQuestions = async (programId, numQuestions) => {
  const res = await quizApi.post(`/${programId}/generate`, { numQuestions });
  return res.data.data;
};

export const mwasalatQuizService = {
  upsertQuiz, getQuizForInstructor, getQuizForLearner, submitAttempt, getMyBestAttempt, getAdminResults, generateQuestions,
};
