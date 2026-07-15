import { createMwasalatApi } from '../api/mwasalatApiClient.js';

const programsApi = createMwasalatApi('/api/mwasalat-programs');

const aiAutofill = async (title) => {
  const res = await programsApi.post('/ai-autofill', { title });
  return res.data.data;
};

const create = async (data) => {
  const res = await programsApi.post('/', data);
  return res.data.data;
};

const update = async (id, data) => {
  const res = await programsApi.patch(`/${id}`, data);
  return res.data.data;
};

const remove = async (id) => {
  const res = await programsApi.delete(`/${id}`);
  return res.data.data;
};

const listMine = async () => {
  const res = await programsApi.get('/mine');
  return res.data.data;
};

const listPublic = async () => {
  const res = await programsApi.get('/public');
  return res.data.data;
};

const enroll = async (id) => {
  const res = await programsApi.post(`/${id}/enroll`);
  return res.data.data;
};

const listMyEnrollments = async () => {
  const res = await programsApi.get('/enrolled');
  return res.data.data;
};

const getById = async (id) => {
  const res = await programsApi.get(`/${id}`);
  return res.data.data;
};

const getLearners = async (id) => {
  const res = await programsApi.get(`/${id}/learners`);
  return res.data.data;
};

const getFeedback = async (id) => {
  const res = await programsApi.get(`/${id}/feedback`);
  return res.data.data;
};

const getStats = async (id) => {
  const res = await programsApi.get(`/${id}/stats`);
  return res.data.data;
};

const checkIn = async (id) => {
  const res = await programsApi.post(`/${id}/check-in`);
  return res.data.data;
};

const getAttendance = async (id) => {
  const res = await programsApi.get(`/${id}/attendance`);
  return res.data.data;
};

const markAttendance = async (id, learnerId) => {
  const res = await programsApi.post(`/${id}/attendance/${learnerId}`);
  return res.data.data;
};

const submitFeedback = async (id, data) => {
  const res = await programsApi.post(`/${id}/feedback`, data);
  return res.data.data;
};

const getCompletionStatus = async (id) => {
  const res = await programsApi.get(`/${id}/completion`);
  return res.data.data;
};

const markContentOpened = async (id, contentType) => {
  const res = await programsApi.post(`/${id}/mark-opened`, { contentType });
  return res.data.data;
};

const getVideoUrl = async (id) => {
  const res = await programsApi.get(`/${id}/video-url`);
  return res.data.data;
};

const updateVideoProgress = async (id, positionSeconds, durationSeconds) => {
  const res = await programsApi.post(`/${id}/video-progress`, { positionSeconds, durationSeconds });
  return res.data.data;
};

const getMyCertificate = async (id) => {
  const res = await programsApi.get(`/${id}/certificate`);
  return res.data.data;
};

const getMyAchievements = async () => {
  const res = await programsApi.get('/achievements/me');
  return res.data.data;
};

const getLearnerAchievements = async (learnerId) => {
  const res = await programsApi.get(`/achievements/${learnerId}`);
  return res.data.data;
};

const getAdminOverview = async () => {
  const res = await programsApi.get('/admin/overview');
  return res.data.data;
};

const listAllCertificates = async () => {
  const res = await programsApi.get('/admin/certificates');
  return res.data.data;
};

const listAllForAdmin = async () => {
  const res = await programsApi.get('/admin/programs');
  return res.data.data;
};

const getInstructorDetail = async (instructorId) => {
  const res = await programsApi.get(`/admin/instructor/${instructorId}`);
  return res.data.data;
};

const listInstructorSummaries = async () => {
  const res = await programsApi.get('/admin/instructors/summary');
  return res.data.data;
};

const getMySummary = async () => {
  const res = await programsApi.get('/me/summary');
  return res.data.data;
};

export const mwasalatProgramService = {
  aiAutofill, create, update, remove, listMine, listPublic, enroll, listMyEnrollments,
  getById, getLearners, getFeedback, getStats, checkIn, markAttendance, getAttendance,
  submitFeedback, getCompletionStatus, markContentOpened, getMyCertificate,
  getVideoUrl, updateVideoProgress,
  getMyAchievements, getLearnerAchievements, getAdminOverview, listAllCertificates, listAllForAdmin,
  getInstructorDetail, listInstructorSummaries, getMySummary,
};
