import api from '../api/axios.js';

// Student
const getMyReviews = () =>
  api.get('/reviews/me').then((r) => r.data.data);

const getEnrollmentReviews = (studentId) =>
  api.get(`/reviews/enrollment/${studentId}`).then((r) => r.data.data);

const getAvailableSlots = (reviewId) =>
  api.get(`/reviews/${reviewId}/available-slots`).then((r) => r.data.data);

const bookSlot = (reviewId, slotId) =>
  api.patch(`/reviews/${reviewId}/book`, { slotId }).then((r) => r.data.data);

// Staff
const getPendingReviews = () =>
  api.get('/reviews/pending').then((r) => r.data.data);

const getSlots = (reviewId) =>
  api.get('/reviews/slots', { params: { reviewId } }).then((r) => r.data.data);

const addSlot = (data) =>
  api.post('/reviews/slots', data).then((r) => r.data.data);

const updateSlot = (slotId, data) =>
  api.patch(`/reviews/slots/${slotId}`, data).then((r) => r.data.data);

const deleteSlot = (slotId) =>
  api.delete(`/reviews/slots/${slotId}`).then((r) => r.data.data);

const resolveHolidayConflict = (slotId, action) =>
  api.patch(`/reviews/slots/${slotId}/resolve-conflict`, { action }).then((r) => r.data.data);

const completeReview = (reviewId, data) =>
  api.patch(`/reviews/${reviewId}/complete`, data).then((r) => r.data.data);

export const reviewService = {
  getMyReviews,
  getEnrollmentReviews,
  getAvailableSlots,
  bookSlot,
  getPendingReviews,
  getSlots,
  addSlot,
  updateSlot,
  deleteSlot,
  resolveHolidayConflict,
  completeReview,
};
