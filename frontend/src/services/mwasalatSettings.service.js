import { createMwasalatApi } from '../api/mwasalatApiClient.js';

const settingsApi = createMwasalatApi('/api/mwasalat-settings');

const getSettings = async () => {
  const res = await settingsApi.get('/');
  return res.data.data;
};

const updateSettings = async (data) => {
  const res = await settingsApi.put('/', data);
  return res.data.data;
};

export const mwasalatSettingsService = { getSettings, updateSettings };
