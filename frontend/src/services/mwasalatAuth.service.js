import mwasalatApi from '../api/mwasalatAxios.js';
import { useMwasalatAuthStore } from '../store/mwasalatAuthStore.js';

const register = async (data) => {
  const res = await mwasalatApi.post('/register', data);
  const { accessToken, user } = res.data.data;
  useMwasalatAuthStore.getState().setAuth(user, accessToken);
  return res.data;
};

const login = async (credentials) => {
  const res = await mwasalatApi.post('/login', credentials);
  const { accessToken, user } = res.data.data;
  useMwasalatAuthStore.getState().setAuth(user, accessToken);
  return res.data;
};

const logout = () => {
  useMwasalatAuthStore.getState().logout();
};

const refreshMe = async () => {
  const res = await mwasalatApi.get('/me');
  useMwasalatAuthStore.getState().updateUser(res.data.data);
  return res.data.data;
};

const updateProfile = async (data) => {
  const res = await mwasalatApi.patch('/me', data);
  useMwasalatAuthStore.getState().updateUser(res.data.data);
  return res.data.data;
};

const changePassword = async (data) => {
  const res = await mwasalatApi.post('/change-password', data);
  return res.data;
};

const verifyInvitation = async (token) => {
  const res = await mwasalatApi.get(`/invite/${token}`);
  return res.data.data;
};

const setPassword = async (token, password) => {
  const res = await mwasalatApi.post(`/invite/${token}/set-password`, { password });
  return res.data;
};

const forgotPassword = async (email) => {
  const res = await mwasalatApi.post('/forgot-password', { email });
  return res.data;
};

const resetPassword = async (token, password) => {
  const res = await mwasalatApi.post(`/reset-password/${token}`, { password });
  return res.data;
};

export const mwasalatAuthService = {
  register, login, logout, refreshMe, updateProfile, changePassword,
  verifyInvitation, setPassword, forgotPassword, resetPassword,
};
