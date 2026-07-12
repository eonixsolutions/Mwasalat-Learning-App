import api from '../api/axios.js';

// ── Fee structures (admin) ────────────────────────────────────────────────────
const getAllStructures = async () => {
  const res = await api.get('/fees/structures');
  return res.data.data;
};

const getStructureByCourse = async (courseId) => {
  const res = await api.get(`/fees/structures/${courseId}`);
  return res.data.data;
};

const upsertStructure = async (courseId, data) => {
  const res = await api.put(`/fees/structures/${courseId}`, data);
  return res.data.data;
};

// ── Student: fee account ──────────────────────────────────────────────────────
const getMyFeeAccount = async () => {
  const res = await api.get('/fees/my-account');
  return res.data.data;
};

const submitInstallmentPayment = async (installmentNumber, data) => {
  const res = await api.post(`/fees/my-account/pay/${installmentNumber}`, data);
  return res.data.data;
};

// ── Staff: fee overview ───────────────────────────────────────────────────────
const getAllFeeAccounts = async (params = {}) => {
  const res = await api.get('/fees/accounts', { params });
  return res.data.data;
};

const getFeeAccountByStudent = async (studentId) => {
  const res = await api.get(`/fees/accounts/${studentId}`);
  return res.data.data;
};

const getPendingInstallmentPayments = async () => {
  const res = await api.get('/fees/payments/pending');
  return res.data.data;
};

const approveInstallmentPayment = async (paymentId) => {
  const res = await api.patch(`/fees/payments/${paymentId}/approve`);
  return res.data.data;
};

const rejectInstallmentPayment = async (paymentId, reviewNote) => {
  const res = await api.patch(`/fees/payments/${paymentId}/reject`, { reviewNote });
  return res.data.data;
};

export const feesService = {
  getAllStructures,
  getStructureByCourse,
  upsertStructure,
  getMyFeeAccount,
  submitInstallmentPayment,
  getAllFeeAccounts,
  getFeeAccountByStudent,
  getPendingInstallmentPayments,
  approveInstallmentPayment,
  rejectInstallmentPayment,
};
