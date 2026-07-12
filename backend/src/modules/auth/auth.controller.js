import { authService } from './auth.service.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { ROLES } from '../../constants/index.js';

const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const register = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Payment receipt screenshot is required', data: null, error: {} });
  }
  const result = await authService.register(req.body, req.file);
  successResponse(res, 'Registration successful. Please verify your email.', result, 201);
});

const registerWithInvite = asyncHandler(async (req, res) => {
  const result = await authService.registerWithInvite(req.body);
  successResponse(res, 'Registration successful. Please verify your email to activate your account.', result, 201);
});

const validateInvite = asyncHandler(async (req, res) => {
  const { staffService } = await import('../staff/staff.service.js');
  const invite = await staffService.validateInvite(req.params.token);
  successResponse(res, 'Invite is valid', { role: invite.role, email: invite.email, designation: invite.designation });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, req.ip);
  if (result.requiresRolePicker) {
    return successResponse(res, 'Multiple roles found. Please select a role to continue.', result);
  }
  const { refreshToken, ...data } = result;
  res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
  successResponse(res, 'Login successful', data);
});

const switchRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  await authService.logout(req.user._id, req.cookies?.refreshToken);
  const result = await authService.switchRole(req.user._id, role);
  const { refreshToken, ...data } = result;
  res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
  successResponse(res, 'Role switched successfully', data);
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id, req.cookies?.refreshToken);
  res.clearCookie('refreshToken');
  successResponse(res, 'Logged out successfully');
});

const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshAccessToken(req.cookies?.refreshToken);
  successResponse(res, 'Token refreshed', result);
});

const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.params.token);
  successResponse(res, 'Email verified successfully', result);
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  successResponse(res, 'If that email exists, a reset link has been sent');
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);
  successResponse(res, 'Password reset successfully');
});

const getMe = asyncHandler(async (req, res) => {
  let extra = {};
  if (req.user.role === ROLES.STUDENT) {
    const { authRepository } = await import('./auth.repository.js');
    const studentProfile = await authRepository.findStudentByUserId(req.user._id);
    if (studentProfile) {
      await studentProfile.populate('course', 'name reviewType screenings');
      extra = {
        courseName:       studentProfile.course?.name        ?? null,
        courseReviewType: studentProfile.course?.reviewType  ?? null,
        courseScreenings: studentProfile.course?.screenings  ?? [],
      };
    }
  }
  successResponse(res, 'User fetched', { ...req.user, ...extra });
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user._id, req.body);
  successResponse(res, 'Password changed successfully');
});

export const authController = {
  register,
  registerWithInvite,
  validateInvite,
  login,
  logout,
  refreshToken,
  switchRole,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
};
