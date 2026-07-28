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
  const { accessToken, user, isNewUser, requires2FA, challengeToken } = res.data.data;
  if (requires2FA) return { requires2FA: true, challengeToken };
  useMwasalatAuthStore.getState().setAuth(user, accessToken, isNewUser);
  return res.data;
};

const googleLogin = async ({ idToken, expectedRole, role } = {}) => {
  const res = await mwasalatApi.post('/oauth/google', { idToken, expectedRole, role });
  const { accessToken, user, isNewUser, requires2FA, challengeToken } = res.data.data;
  if (requires2FA) return { requires2FA: true, challengeToken };
  useMwasalatAuthStore.getState().setAuth(user, accessToken, isNewUser);
  return res.data;
};

const verifyTwoFactorLogin = async ({ challengeToken, token }) => {
  const res = await mwasalatApi.post('/2fa/verify', { challengeToken, token });
  const { accessToken, user, isNewUser } = res.data.data;
  useMwasalatAuthStore.getState().setAuth(user, accessToken, isNewUser);
  return res.data;
};

const resetExpiredPassword = async ({ challengeToken, newPassword }) => {
  const res = await mwasalatApi.post('/password-expired/reset', { challengeToken, newPassword });
  const { accessToken, user, isNewUser, requires2FA, challengeToken: nextChallengeToken } = res.data.data;
  if (requires2FA) return { requires2FA: true, challengeToken: nextChallengeToken };
  useMwasalatAuthStore.getState().setAuth(user, accessToken, isNewUser);
  return res.data;
};

const setupTwoFactor = async () => {
  const res = await mwasalatApi.post('/2fa/setup');
  return res.data.data;
};

const enableTwoFactor = async (token) => {
  const res = await mwasalatApi.post('/2fa/enable', { token });
  return res.data.data;
};

const disableTwoFactor = async (password) => {
  const res = await mwasalatApi.post('/2fa/disable', { password });
  return res.data;
};

const logout = () => {
  useMwasalatAuthStore.getState().logout();
  // Best-effort — clears the httpOnly refresh cookie server-side. The local
  // session is already cleared above regardless of whether this succeeds.
  mwasalatApi.post('/logout').catch(() => {});
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

const forgotPassword = async (data) => {
  const res = await mwasalatApi.post('/forgot-password', data);
  return res.data;
};

const resetPassword = async ({ email, otp, password }) => {
  const res = await mwasalatApi.post('/reset-password', { email, otp, password });
  return res.data;
};

const getCaptcha = async () => {
  const res = await mwasalatApi.get('/captcha');
  return res.data.data;
};

export const mwasalatAuthService = {
  register, login, googleLogin, logout, refreshMe, updateProfile, changePassword,
  verifyInvitation, setPassword, forgotPassword, resetPassword, getCaptcha,
  verifyTwoFactorLogin, setupTwoFactor, enableTwoFactor, disableTwoFactor,
  resetExpiredPassword,
};
