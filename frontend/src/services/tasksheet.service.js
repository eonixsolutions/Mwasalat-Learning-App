import api from '../api/axios.js';

const setMicrosoftEmail = async (studentId, microsoftEmail) => {
  const res = await api.patch(`/students/${studentId}/microsoft-email`, { microsoftEmail });
  return res.data.data;
};

const provisionTaskSheet = async (studentId) => {
  const res = await api.post(`/students/${studentId}/provision-task-sheet`);
  return res.data.data;
};

export const tasksheetService = { setMicrosoftEmail, provisionTaskSheet };
