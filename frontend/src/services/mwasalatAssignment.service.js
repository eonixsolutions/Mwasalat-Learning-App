import { createMwasalatApi } from '../api/mwasalatApiClient.js';

const assignmentsApi = createMwasalatApi('/api/mwasalat-assignments');

// moduleId/lessonId are optional — pass both for a modular course's
// assignment lesson; omit for a legacy course-level assignment (unchanged
// routes/behavior).
const scopedPath = (programId, moduleId, lessonId, suffix = '') => (
  moduleId ? `/${programId}/module/${moduleId}/lesson/${lessonId}${suffix}` : `/${programId}${suffix}`
);

const upsertAssignment = async (programId, data, moduleId, lessonId) => {
  const res = await assignmentsApi.put(scopedPath(programId, moduleId, lessonId), data);
  return res.data.data;
};

const getForInstructor = async (programId, moduleId, lessonId) => {
  const res = await assignmentsApi.get(scopedPath(programId, moduleId, lessonId, '/instructor-view'));
  return res.data.data;
};

const getForLearner = async (programId, moduleId, lessonId) => {
  const res = await assignmentsApi.get(scopedPath(programId, moduleId, lessonId));
  return res.data.data;
};

const listSubmissions = async (programId, moduleId, lessonId) => {
  const res = await assignmentsApi.get(scopedPath(programId, moduleId, lessonId, '/submissions'));
  return res.data.data;
};

const gradeSubmission = async (submissionId, data) => {
  const res = await assignmentsApi.patch(`/submissions/${submissionId}/grade`, data);
  return res.data.data;
};

const submitAssignment = async (programId, file, moduleId, lessonId) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await assignmentsApi.post(scopedPath(programId, moduleId, lessonId, '/submit'), formData);
  return res.data.data;
};

const getMySubmissions = async (programId, moduleId, lessonId) => {
  const res = await assignmentsApi.get(scopedPath(programId, moduleId, lessonId, '/my-submissions'));
  return res.data.data;
};

export const mwasalatAssignmentService = {
  upsertAssignment, getForInstructor, getForLearner,
  listSubmissions, gradeSubmission, submitAssignment, getMySubmissions,
};
