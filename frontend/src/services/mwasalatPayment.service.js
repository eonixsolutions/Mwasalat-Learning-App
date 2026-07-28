import { createMwasalatApi } from '../api/mwasalatApiClient.js';

const paymentsApi = createMwasalatApi('/api/mwasalat-payments');

const createCheckoutSession = async (programId) => {
  const res = await paymentsApi.post(`/checkout/${programId}`);
  return res.data.data;
};

const confirmSession = async (sessionId) => {
  const res = await paymentsApi.post(`/confirm/${sessionId}`);
  return res.data.data;
};

const createReactivationCheckoutSession = async (enrollmentId) => {
  const res = await paymentsApi.post(`/reactivate/${enrollmentId}`);
  return res.data.data;
};

const listTransactions = async (params) => {
  const res = await paymentsApi.get('/admin/transactions', { params });
  return res.data.data;
};

const getRevenueSummary = async () => {
  const res = await paymentsApi.get('/admin/summary');
  return res.data.data;
};

const getSalesReport = async ({ from, to } = {}) => {
  const res = await paymentsApi.get('/admin/sales-report', { params: { from, to } });
  return res.data.data;
};

const listReportTransactions = async ({ from, to } = {}) => {
  const res = await paymentsApi.get('/admin/sales-report/transactions', { params: { from, to } });
  return res.data.data;
};

export const mwasalatPaymentService = {
  createCheckoutSession, createReactivationCheckoutSession, confirmSession, listTransactions,
  getRevenueSummary, getSalesReport, listReportTransactions,
};
