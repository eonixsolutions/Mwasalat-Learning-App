import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { mwasalatAuthService } from './mwasalatAuth.service.js';

const REFRESH_COOKIE_NAME = mwasalatAuthService.REFRESH_COOKIE_NAME;
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// httpOnly so the refresh token is never readable from JS (XSS-proof); sameSite
// 'lax' + path scoped to this module's own routes is enough for CSRF safety on
// top of the X-Mwasalat-Client header check (see requireSpaHeader) since the
// frontend and API are always same-site even across dev ports.
const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/mwasalat-auth',
});

const setRefreshCookie = (res, refreshToken) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, { ...refreshCookieOptions(), maxAge: REFRESH_COOKIE_MAX_AGE_MS });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
};

// Splits a service result into the httpOnly cookie (refreshToken) and the
// JSON body (everything else) — the refresh token must never appear in a
// response a script can read.
const respondWithSession = (res, message, result, statusCode = 200) => {
  const { refreshToken, ...body } = result;
  if (refreshToken) setRefreshCookie(res, refreshToken);
  successResponse(res, message, body, statusCode);
};

const register = asyncHandler(async (req, res) => {
  const result = await mwasalatAuthService.register(req.body);
  respondWithSession(res, 'Registration successful', result, 201);
});

const getCaptcha = asyncHandler(async (req, res) => {
  const captcha = mwasalatAuthService.getCaptcha();
  successResponse(res, 'Captcha generated', captcha);
});

const login = asyncHandler(async (req, res) => {
  const result = await mwasalatAuthService.login(req.body, req.ip);
  respondWithSession(res, 'Login successful', result);
});

const googleLogin = asyncHandler(async (req, res) => {
  const result = await mwasalatAuthService.googleLogin(req.body, req.ip);
  respondWithSession(res, 'Login successful', result);
});

const getMe = asyncHandler(async (req, res) => {
  successResponse(res, 'User fetched', req.mwasalatUser);
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await mwasalatAuthService.updateProfile(req.mwasalatUser._id, req.body, req.file);
  successResponse(res, 'Profile updated', user);
});

const changePassword = asyncHandler(async (req, res) => {
  const { refreshToken } = await mwasalatAuthService.changePassword(req.mwasalatUser._id, req.body);
  setRefreshCookie(res, refreshToken);
  successResponse(res, 'Password changed successfully');
});

const verifyInvitation = asyncHandler(async (req, res) => {
  const invite = await mwasalatAuthService.verifyInvitation(req.params.token);
  successResponse(res, 'Invitation valid', invite);
});

const setPassword = asyncHandler(async (req, res) => {
  await mwasalatAuthService.setPassword(req.params.token, req.body.password);
  successResponse(res, 'Password set successfully');
});

const forgotPassword = asyncHandler(async (req, res) => {
  await mwasalatAuthService.forgotPassword(req.body);
  successResponse(res, 'If an account exists with that email, a reset link has been sent.');
});

const resetPassword = asyncHandler(async (req, res) => {
  await mwasalatAuthService.resetPassword(req.body);
  successResponse(res, 'Password reset successfully');
});

const verifyTwoFactorLogin = asyncHandler(async (req, res) => {
  const result = await mwasalatAuthService.verifyTwoFactorLogin(req.body, req.ip);
  respondWithSession(res, 'Login successful', result);
});

const resetExpiredPassword = asyncHandler(async (req, res) => {
  const result = await mwasalatAuthService.resetExpiredPassword(req.body);
  respondWithSession(res, 'Password updated', result);
});

const refresh = asyncHandler(async (req, res) => {
  const result = await mwasalatAuthService.refreshAccessToken(req.cookies?.[REFRESH_COOKIE_NAME]);
  respondWithSession(res, 'Session refreshed', result);
});

const logout = asyncHandler(async (req, res) => {
  clearRefreshCookie(res);
  successResponse(res, 'Logged out');
});

const setupTwoFactor = asyncHandler(async (req, res) => {
  const result = await mwasalatAuthService.setupTwoFactor(req.mwasalatUser._id);
  successResponse(res, 'Scan this QR code with your authenticator app', result);
});

const enableTwoFactor = asyncHandler(async (req, res) => {
  const result = await mwasalatAuthService.enableTwoFactor(req.mwasalatUser._id, req.body.token);
  successResponse(res, 'Two-factor authentication enabled', result);
});

const disableTwoFactor = asyncHandler(async (req, res) => {
  await mwasalatAuthService.disableTwoFactor(req.mwasalatUser._id, req.body.password);
  successResponse(res, 'Two-factor authentication disabled');
});

export const mwasalatAuthController = {
  register, login, googleLogin, getMe, updateProfile, changePassword, verifyInvitation, setPassword,
  forgotPassword, resetPassword, getCaptcha,
  verifyTwoFactorLogin, setupTwoFactor, enableTwoFactor, disableTwoFactor,
  resetExpiredPassword, refresh, logout,
};
