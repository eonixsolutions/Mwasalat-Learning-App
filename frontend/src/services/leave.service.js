import api from '../api/axios.js';

const submitLeave = (data) => api.post('/leaves', data).then((r) => r.data.data);
const getMyLeaves = () => api.get('/leaves/my').then((r) => r.data.data);
const getPendingLeaves = () => api.get('/leaves/pending').then((r) => r.data.data);
const getStudentLeaves = (studentId) => api.get(`/leaves/student/${studentId}`).then((r) => r.data.data);
const reviewLeave = (id, status, reviewNote) =>
  api.patch(`/leaves/${id}/review`, { status, reviewNote }).then((r) => r.data.data);

export const leaveService = { submitLeave, getMyLeaves, getPendingLeaves, getStudentLeaves, reviewLeave };
