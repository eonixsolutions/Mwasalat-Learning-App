import api from '../api/axios.js';

const submitDay = async ({ week, day }) => {
  const res = await api.post('/week-reviews/submit-day', { week, day });
  return res.data.data;
};

const getMyReviews = async () => {
  const res = await api.get('/week-reviews/my');
  return res.data.data;
};

const listPending = async () => {
  const res = await api.get('/week-reviews/pending');
  return res.data.data;
};

const listAll = async () => {
  const res = await api.get('/week-reviews');
  return res.data.data;
};

const listByStudent = async (studentId) => {
  const res = await api.get('/week-reviews', { params: { student: studentId } });
  return res.data.data;
};

const pendingCount = async () => {
  const res = await api.get('/week-reviews/pending/count');
  return res.data.data;
};

const reviewDay = async (reviewId, dayId, { status, mentorNote }) => {
  const res = await api.patch(`/week-reviews/${reviewId}/days/${dayId}/review`, { status, mentorNote });
  return res.data.data;
};

export const weekReviewService = { submitDay, getMyReviews, listPending, listAll, listByStudent, pendingCount, reviewDay };
