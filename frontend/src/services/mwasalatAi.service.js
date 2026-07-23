import { createMwasalatApi } from '../api/mwasalatApiClient.js';

const aiApi = createMwasalatApi('/api/mwasalat-ai');

const ask = async ({ question, history }) => {
  const res = await aiApi.post('/ask', { question, history });
  return res.data.data;
};

export const mwasalatAiService = { ask };
