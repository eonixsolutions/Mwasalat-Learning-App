import api from '../api/axios.js';

const submitProof = (formData) =>
  api.post('/payments/registration/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data.data);

const getMyPayments  = ()     => api.get('/payments/my').then(r => r.data.data);
const getPending     = ()     => api.get('/payments/pending').then(r => r.data.data);
const getAll         = ()     => api.get('/payments').then(r => r.data.data);
const approve        = (id, batchId = null) => api.patch(`/payments/${id}/approve`, { batchId }).then(r => r.data.data);
const reject         = (id, reviewNote) => api.patch(`/payments/${id}/reject`, { reviewNote }).then(r => r.data.data);

export const paymentService = { submitProof, getMyPayments, getPending, getAll, approve, reject };
