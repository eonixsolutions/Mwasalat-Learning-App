import api from '../api/axios.js';

const getConfig = async () => {
  const res = await api.get('/config');
  return res.data.data;
};

export const configService = { getConfig };
