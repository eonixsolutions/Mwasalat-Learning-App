import { createMwasalatApi } from '../api/mwasalatApiClient.js';

const quizApi = createMwasalatApi('/api/mwasalat-quiz');

// moduleId is optional — pass it for a modular course's per-module quiz;
// omit it (or pass null/undefined) for a legacy course-level quiz, which hits
// the exact same routes/behavior as before this option existed.
const scopedPath = (programId, moduleId, suffix = '') => (moduleId ? `/${programId}/module/${moduleId}${suffix}` : `/${programId}${suffix}`);

const upsertQuiz = async (programId, data, moduleId) => {
  const res = await quizApi.put(scopedPath(programId, moduleId), data);
  return res.data.data;
};

const getQuizForInstructor = async (programId, moduleId) => {
  const res = await quizApi.get(scopedPath(programId, moduleId, '/instructor-view'));
  return res.data.data;
};

const getQuizForLearner = async (programId, moduleId) => {
  const res = await quizApi.get(scopedPath(programId, moduleId));
  return res.data.data;
};

const submitAttempt = async (programId, answers, moduleId) => {
  const res = await quizApi.post(scopedPath(programId, moduleId, '/submit'), { answers });
  return res.data.data;
};

const getMyBestAttempt = async (programId, moduleId) => {
  const res = await quizApi.get(scopedPath(programId, moduleId, '/my-best'));
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
