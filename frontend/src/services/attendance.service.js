import api from '../api/axios.js';

const getMyAttendance = async ({ startDate, endDate } = {}) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const res = await api.get('/attendance/me', { params });
  return res.data.data;
};

const getStudentAttendance = async (studentId, { startDate, endDate } = {}) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const res = await api.get(`/attendance/student/${studentId}`, { params });
  return res.data.data;
};

const getAttendanceByDate = async (date) => {
  const res = await api.get(`/attendance/date/${date}`);
  return res.data.data;
};

const markAttendance = async ({ studentId, date, status, note }) => {
  const res = await api.post('/attendance/mark', { studentId, date, status, note });
  return res.data.data;
};

const deleteOverride = async ({ studentId, date }) => {
  const res = await api.delete('/attendance/override', { params: { studentId, date } });
  return res.data;
};

export const attendanceService = {
  getMyAttendance,
  getStudentAttendance,
  getAttendanceByDate,
  markAttendance,
  deleteOverride,
};
