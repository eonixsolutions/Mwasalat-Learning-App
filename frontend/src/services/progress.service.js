import api from '../api/axios.js';

const getPendingApprovals = async () => {
  const res = await api.get('/progress/pending-approvals');
  return res.data.data;
};

const approveTask = async (progressId) => {
  const res = await api.patch(`/progress/${progressId}/approve`);
  return res.data.data;
};

export const progressService = { getPendingApprovals, approveTask };
