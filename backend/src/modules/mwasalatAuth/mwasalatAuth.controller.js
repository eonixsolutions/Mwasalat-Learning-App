import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { mwasalatAuthService } from './mwasalatAuth.service.js';

const register = asyncHandler(async (req, res) => {
  const result = await mwasalatAuthService.register(req.body);
  successResponse(res, 'Registration successful', result, 201);
});

const login = asyncHandler(async (req, res) => {
  const result = await mwasalatAuthService.login(req.body);
  successResponse(res, 'Login successful', result);
});

const getMe = asyncHandler(async (req, res) => {
  successResponse(res, 'User fetched', req.mwasalatUser);
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await mwasalatAuthService.updateProfile(req.mwasalatUser._id, req.body);
  successResponse(res, 'Profile updated', user);
});

const changePassword = asyncHandler(async (req, res) => {
  await mwasalatAuthService.changePassword(req.mwasalatUser._id, req.body);
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
  await mwasalatAuthService.forgotPassword(req.body.email);
  successResponse(res, 'If an account exists with that email, a reset link has been sent.');
});

const resetPassword = asyncHandler(async (req, res) => {
  await mwasalatAuthService.resetPassword(req.params.token, req.body.password);
  successResponse(res, 'Password reset successfully');
});

export const mwasalatAuthController = {
  register, login, getMe, updateProfile, changePassword, verifyInvitation, setPassword,
  forgotPassword, resetPassword,
};
