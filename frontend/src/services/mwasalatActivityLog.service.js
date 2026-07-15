import { createMwasalatApi } from '../api/mwasalatApiClient.js';

const activityApi = createMwasalatApi('/api/mwasalat-activity');

const list = async (params) => {
  const res = await activityApi.get('/', { params });
  return res.data.data;
};

export const mwasalatActivityLogService = { list };
