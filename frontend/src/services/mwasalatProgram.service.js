import { createMwasalatApi } from '../api/mwasalatApiClient.js';

const programsApi = createMwasalatApi('/api/mwasalat-programs');

const aiAutofill = async (title) => {
  const res = await programsApi.post('/ai-autofill', { title });
  return res.data.data;
};

const createLiveMeeting = async ({ title, liveScheduledAt }) => {
  const res = await programsApi.post('/live-meeting', { title, liveScheduledAt });
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

const cancelScheduledDeletion = async (id) => {
  const res = await programsApi.post(`/${id}/cancel-deletion`);
  return res.data.data;
};

const listMine = async () => {
  const res = await programsApi.get('/mine');
  return res.data.data;
};

const listPublic = async ({ limit } = {}) => {
  const res = await programsApi.get('/public', { params: limit ? { limit } : undefined });
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

const approveEnrollment = async (id, learnerId) => {
  const res = await programsApi.post(`/${id}/learners/${learnerId}/approve`);
  return res.data.data;
};

const rejectEnrollment = async (id, learnerId, reason) => {
  const res = await programsApi.post(`/${id}/learners/${learnerId}/reject`, { reason });
  return res.data.data;
};

const toggleStar = async (id) => {
  const res = await programsApi.patch(`/${id}/star`);
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

const completeClass = async (id, contentType) => {
  const res = await programsApi.post(`/${id}/complete-class`, { contentType });
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

// Bulk variant for the learner dashboard — one request for every enrolled
// program's completion status instead of one getCompletionStatus call per
// program in a sequential waterfall. Returns a map keyed by programId.
const getBulkCompletionStatus = async (programIds) => {
  if (!programIds?.length) return {};
  const res = await programsApi.get('/me/completion', { params: { programIds: programIds.join(',') } });
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

const verifyCertificate = async (certificateId) => {
  const res = await programsApi.get(`/certificates/verify/${certificateId}`);
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

const getMyRoster = async () => {
  const res = await programsApi.get('/me/roster');
  return res.data.data;
};

const getMyTodaySchedule = async () => {
  const res = await programsApi.get('/me/today-schedule');
  return res.data.data;
};

const getTopCoursesByCompletionRate = async () => {
  const res = await programsApi.get('/admin/top-courses');
  return res.data.data;
};

const getUpcomingClasses = async () => {
  const res = await programsApi.get('/admin/upcoming-classes');
  return res.data.data;
};

const getRecentActivityFeed = async (limit) => {
  const res = await programsApi.get('/admin/activity-feed', { params: { limit } });
  return res.data.data;
};

const sendEncouragement = async (id, learnerId, templateKey) => {
  const res = await programsApi.post(`/${id}/learners/${learnerId}/encourage`, { templateKey });
  return res.data.data;
};

// --- Modular ("super course") modules/lessons ---

const addModule = async (id, data) => {
  const res = await programsApi.post(`/${id}/modules`, data);
  return res.data.data;
};

const updateModule = async (id, moduleId, data) => {
  const res = await programsApi.patch(`/${id}/modules/${moduleId}`, data);
  return res.data.data;
};

const removeModule = async (id, moduleId) => {
  const res = await programsApi.delete(`/${id}/modules/${moduleId}`);
  return res.data.data;
};

const reorderModules = async (id, orderedModuleIds) => {
  const res = await programsApi.patch(`/${id}/modules/reorder`, { orderedModuleIds });
  return res.data.data;
};

// `file` is optional — only video/pdf/ppt/audio lessons carry one. Sent as
// multipart whenever a file is present so the backend's uploadLessonFile
// middleware can see it; plain JSON otherwise (matches the create()/pdfFile
// convention already used for courses themselves).
const addLesson = async (id, moduleId, data, file) => {
  let body = data;
  if (file) {
    body = new FormData();
    Object.entries(data).forEach(([key, value]) => { if (value !== undefined && value !== null) body.append(key, value); });
    body.append('file', file);
  }
  const res = await programsApi.post(`/${id}/modules/${moduleId}/lessons`, body);
  return res.data.data;
};

const updateLesson = async (id, moduleId, lessonId, data, file) => {
  let body = data;
  if (file) {
    body = new FormData();
    Object.entries(data).forEach(([key, value]) => { if (value !== undefined && value !== null) body.append(key, value); });
    body.append('file', file);
  }
  const res = await programsApi.patch(`/${id}/modules/${moduleId}/lessons/${lessonId}`, body);
  return res.data.data;
};

const removeLesson = async (id, moduleId, lessonId) => {
  const res = await programsApi.delete(`/${id}/modules/${moduleId}/lessons/${lessonId}`);
  return res.data.data;
};

const reorderLessons = async (id, moduleId, orderedLessonIds) => {
  const res = await programsApi.patch(`/${id}/modules/${moduleId}/lessons/reorder`, { orderedLessonIds });
  return res.data.data;
};

const getCourseForLearner = async (id) => {
  const res = await programsApi.get(`/${id}/learn`);
  return res.data.data;
};

const markLessonOpened = async (id, moduleId, lessonId) => {
  const res = await programsApi.post(`/${id}/modules/${moduleId}/lessons/${lessonId}/open`);
  return res.data.data;
};

const updateLessonMediaProgress = async (id, moduleId, lessonId, positionSeconds, durationSeconds) => {
  const res = await programsApi.post(`/${id}/modules/${moduleId}/lessons/${lessonId}/media-progress`, { positionSeconds, durationSeconds });
  return res.data.data;
};

const getLessonMediaUrl = async (id, moduleId, lessonId) => {
  const res = await programsApi.get(`/${id}/modules/${moduleId}/lessons/${lessonId}/media-url`);
  return res.data.data;
};

export const mwasalatProgramService = {
  aiAutofill, createLiveMeeting, create, update, remove, cancelScheduledDeletion, listMine, listPublic, enroll, listMyEnrollments, toggleStar,
  approveEnrollment, rejectEnrollment,
  getById, getLearners, getFeedback, getStats, checkIn, markAttendance, getAttendance, completeClass,
  submitFeedback, getCompletionStatus, getBulkCompletionStatus, markContentOpened, getMyCertificate, verifyCertificate,
  getVideoUrl, updateVideoProgress, sendEncouragement,
  getMyAchievements, getLearnerAchievements, getAdminOverview, listAllCertificates, listAllForAdmin,
  getInstructorDetail, listInstructorSummaries, getMySummary, getMyRoster, getMyTodaySchedule,
  getTopCoursesByCompletionRate, getUpcomingClasses, getRecentActivityFeed,
  addModule, updateModule, removeModule, reorderModules,
  addLesson, updateLesson, removeLesson, reorderLessons,
  getCourseForLearner, markLessonOpened, updateLessonMediaProgress, getLessonMediaUrl,
};
