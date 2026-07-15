import axios from 'axios';
import toast from 'react-hot-toast';
import { useMwasalatAuthStore } from '../store/mwasalatAuthStore.js';

export const createMwasalatApi = (baseURL) => {
  const api = axios.create({ baseURL });

  api.interceptors.request.use((config) => {
    const token = useMwasalatAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  api.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error.response?.status === 401 && useMwasalatAuthStore.getState().isAuthenticated) {
        useMwasalatAuthStore.getState().logout();
        toast.error('Your session has expired. Please sign in again.');
        window.location.href = '/mwasalat';
      }
      return Promise.reject(error);
    }
  );

  return api;
};
