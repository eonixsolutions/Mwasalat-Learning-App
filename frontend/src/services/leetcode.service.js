import api from '../api/axios.js';

// Problems (admin + all authenticated)
const getProblems = () => api.get('/leetcode/problems').then((r) => r.data.data);
const createProblem = (data) => api.post('/leetcode/problems', data).then((r) => r.data.data);
const updateProblem = (id, data) => api.patch(`/leetcode/problems/${id}`, data).then((r) => r.data.data);
const deleteProblem = (id) => api.delete(`/leetcode/problems/${id}`).then((r) => r.data.data);

// Student
const getMyProgress = () => api.get('/leetcode/me').then((r) => r.data.data);
const submitSolution = (problemId) =>
  api.post('/leetcode/submit', { problemId }).then((r) => r.data.data);
const setLeetcodeUsername = (leetcodeUsername) =>
  api.patch('/leetcode/username', { leetcodeUsername }).then((r) => r.data.data);

// Staff: per-student and per-batch views
const getStudentProgress = (studentId) =>
  api.get(`/leetcode/students/${studentId}`).then((r) => r.data.data);
const getBatchProgress = (batchId) =>
  api.get(`/leetcode/batch/${batchId}`).then((r) => r.data.data);
const toggleHold = (studentId) =>
  api.patch(`/leetcode/students/${studentId}/hold`).then((r) => r.data.data);
const switchStudentList = (studentId) =>
  api.patch(`/leetcode/students/${studentId}/switch-list`).then((r) => r.data.data);

export const leetcodeService = {
  getProblems,
  createProblem,
  updateProblem,
  deleteProblem,
  getMyProgress,
  submitSolution,
  setLeetcodeUsername,
  getStudentProgress,
  getBatchProgress,
  toggleHold,
  switchStudentList,
};
