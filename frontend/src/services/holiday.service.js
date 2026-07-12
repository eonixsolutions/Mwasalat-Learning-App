import api from '../api/axios.js';

const getHolidays = () => api.get('/holidays').then((r) => r.data.data);
const createHoliday = (data) => api.post('/holidays', data).then((r) => r.data.data);
const deleteHoliday = (id) => api.delete(`/holidays/${id}`).then((r) => r.data.data);

export const holidayService = { getHolidays, createHoliday, deleteHoliday };
