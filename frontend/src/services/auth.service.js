import api from '../api/axios.js';
import { useAuthStore } from '../store/authStore.js';
import { queryClient } from '../lib/queryClient.js';

const register = async (data) => {
  const fd = new FormData();
  Object.entries(data).forEach(([key, val]) => {
    if (val !== undefined && val !== null) fd.append(key, val);
  });
  const res = await api.post('/auth/register', fd);
  return res.data;
};

const login = async (credentials) => {
  const res = await api.post('/auth/login', credentials);
  const data = res.data.data;
  if (data.requiresRolePicker) {
    return data;
  }
  const { accessToken, user } = data;
  useAuthStore.getState().setAuth(user, accessToken);
  return res.data;
};

const switchRole = async (role) => {
  const res = await api.post('/auth/switch-role', { role });
  const { accessToken, user } = res.data.data;
  useAuthStore.getState().setAuth(user, accessToken);
  return res.data.data;
};

const logout = async () => {
  await api.post('/auth/logout');
  useAuthStore.getState().logout();
  queryClient.clear();
};

const getMe = async () => {
  const res = await api.get('/auth/me');
  useAuthStore.getState().updateUser(res.data.data);
  return res.data.data;
};

const forgotPassword = async (email) => {
  const res = await api.post('/auth/forgot-password', { email });
  return res.data;
};

const resetPassword = async (token, password) => {
  const res = await api.post(`/auth/reset-password/${token}`, { password });
  return res.data;
};

const changePassword = async (data) => {
  const res = await api.post('/auth/change-password', data);
  return res.data;
};

export const authService = { register, login, switchRole, logout, getMe, forgotPassword, resetPassword, changePassword };
