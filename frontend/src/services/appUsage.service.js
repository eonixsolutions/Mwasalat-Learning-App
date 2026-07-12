import api from '../api/axios.js';

const getMyUsageToday = () =>
  api.get('/app-usage/today').then(r => r.data.data);

const getUsageByDate = (date) =>
  api.get('/app-usage/by-date', { params: { date } }).then(r => r.data.data);

const getMyUsageRange = (startDate, endDate) =>
  api.get('/app-usage/me/range', { params: { startDate, endDate } }).then(r => r.data.data);

export const appUsageService = { getMyUsageToday, getUsageByDate, getMyUsageRange };
