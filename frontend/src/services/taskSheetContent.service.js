import api from '../api/axios.js';

const getPublishedWeek = (courseId, week) =>
  api.get(`/task-sheet-content/course/${courseId}/week/${week}`).then(r => r.data.data);

// Student: only published weeks
const listPublishedByCourse = (courseId) =>
  api.get(`/task-sheet-content/course/${courseId}`).then(r => r.data.data);

// Admin: all weeks (including drafts)
const listByCourse = (courseId) =>
  api.get(`/task-sheet-content/admin/course/${courseId}`).then(r => r.data.data);

const getAdminWeek = (courseId, week) =>
  api.get(`/task-sheet-content/admin/course/${courseId}/week/${week}`).then(r => r.data.data);

const upsertWeek = (courseId, week, body) =>
  api.put(`/task-sheet-content/admin/course/${courseId}/week/${week}`, body).then(r => r.data.data);

const togglePublish = (id, isPublished) =>
  api.patch(`/task-sheet-content/admin/${id}/publish`, { isPublished }).then(r => r.data.data);

const removeWeek = (id) =>
  api.delete(`/task-sheet-content/admin/${id}`).then(r => r.data);

export const taskSheetContentService = {
  getPublishedWeek,
  listPublishedByCourse,
  listByCourse,
  getAdminWeek,
  upsertWeek,
  togglePublish,
  removeWeek,
};
