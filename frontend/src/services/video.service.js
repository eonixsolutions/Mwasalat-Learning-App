import api from '../api/axios.js';

const getMyVideos = () =>
  api.get('/videos/my').then(r => r.data.data);

const listAll = (params = {}) =>
  api.get('/videos', { params }).then(r => r.data.data);

const create = (data) =>
  api.post('/videos', data).then(r => r.data.data);

const update = (id, data) =>
  api.patch(`/videos/${id}`, data).then(r => r.data.data);

const remove = (id) =>
  api.delete(`/videos/${id}`).then(r => r.data.data);

export const videoService = { getMyVideos, listAll, create, update, remove };
