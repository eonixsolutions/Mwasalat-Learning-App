import mwasalatApi from '../api/mwasalatAxios.js';
import { useMwasalatAuthStore } from '../store/mwasalatAuthStore.js';

const register = async (data) => {
  const res = await mwasalatApi.post('/register', data);
  const { accessToken, user, isNewUser } = res.data.data;
  useMwasalatAuthStore.getState().setAuth(user, accessToken, isNewUser);
  return res.data;
};

const login = async (credentials) => {
  const res = await mwasalatApi.post('/login', credentials);
  const { accessToken, user, isNewUser } = res.data.data;
  useMwasalatAuthStore.getState().setAuth(user, accessToken, isNewUser);
  return res.data;
};

const googleLogin = async ({ idToken, expectedRole } = {}) => {
  const res = await mwasalatApi.post('/oauth/google', { idToken, expectedRole });
  const { accessToken, user, isNewUser } = res.data.data;
  useMwasalatAuthStore.getState().setAuth(user, accessToken, isNewUser);
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

const updateProfile = async ({ name, phone, avatarFile } = {}) => {
  let payload;
  if (avatarFile) {
    payload = new FormData();
    payload.append('name', name ?? '');
    payload.append('phone', phone ?? '');
    payload.append('avatar', avatarFile);
  } else {
    payload = { name, phone };
  }
  const res = await mwasalatApi.patch('/me', payload);
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
  register, login, googleLogin, logout, refreshMe, updateProfile, changePassword,
  verifyInvitation, setPassword, forgotPassword, resetPassword,
};
