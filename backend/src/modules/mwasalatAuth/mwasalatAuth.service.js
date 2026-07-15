import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import MwasalatUser from '../mwasalatUser/mwasalatUser.model.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';
import { AppError } from '../../utils/AppError.js';
import { sendEmail } from '../../utils/mailer.js';
import { mwasalatResetPasswordTemplate } from '../mwasalatUser/mwasalatEmailTemplates.js';
import { mwasalatActivityLogService } from '../mwasalatActivityLog/mwasalatActivityLog.service.js';

const TOKEN_TYPE = 'mwasalat_user';

const generateAccessToken = (userId, role) =>
  jwt.sign({ id: userId, role, type: TOKEN_TYPE }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.MWASALAT_JWT_EXPIRES_IN || '12h',
  });

const register = async ({ name, email, password }) => {
  const existing = await MwasalatUser.findOne({ email });
  if (existing) throw new AppError('A user with this email already exists', 409);

  const user = await MwasalatUser.create({
    name,
    email,
    password,
    role: MWASALAT_ROLES.LEARNER,
    isActive: true,
    passwordSet: true,
  });

  const accessToken = generateAccessToken(user._id, user.role);
  return { accessToken, user: user.toJSON() };
};

const login = async ({ email, password, expectedRole }) => {
  const user = await MwasalatUser.findOne({ email }).select('+password');
  if (!user) throw new AppError('Invalid email or password', 401);

  if (!user.passwordSet) throw new AppError('Please set your password using the invite link sent to your email.', 403);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  if (!user.isActive) throw new AppError('Your account has been deactivated. Contact support.', 403);

  if (expectedRole && user.role !== expectedRole) {
    throw new AppError('This account does not have access to this login portal', 403);
  }

  user.lastLogin = new Date();
  await user.save();

  mwasalatActivityLogService.record({
    actorId: user._id, actorName: user.name, actorRole: user.role, action: 'login',
  });

  const accessToken = generateAccessToken(user._id, user.role);
  return { accessToken, user: user.toJSON() };
};

const getMe = async (userId) => {
  const user = await MwasalatUser.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user.toJSON();
};

const updateProfile = async (userId, { name }) => {
  if (!name?.trim()) throw new AppError('Name is required', 400);

  const user = await MwasalatUser.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  user.name = name.trim();
  await user.save();
  return user.toJSON();
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await MwasalatUser.findById(userId).select('+password');
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect', 401);

  user.password = newPassword;
  await user.save();
};

const getByInvitationToken = async (token) => {
  const user = await MwasalatUser.findOne({
    invitationToken: token,
    invitationExpiry: { $gt: new Date() },
  }).select('+invitationToken +invitationExpiry');
  if (!user) throw new AppError('Invitation link is invalid or has expired', 400);
  return user;
};

const verifyInvitation = async (token) => {
  const user = await getByInvitationToken(token);
  return { name: user.name, email: user.email };
};

const setPassword = async (token, password) => {
  const user = await getByInvitationToken(token);
  user.password = password;
  user.passwordSet = true;
  user.invitationToken = undefined;
  user.invitationExpiry = undefined;
  await user.save();
  return user;
};

const forgotPassword = async (email) => {
  const user = await MwasalatUser.findOne({ email });
  if (!user) return; // don't reveal whether the email exists

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = resetToken;
  user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/mwasalat/reset-password/${resetToken}`;
  await sendEmail({
    to: email,
    subject: 'Reset your Mwasalat Learning Platform password',
    html: mwasalatResetPasswordTemplate({ resetUrl }),
  });
};

const resetPassword = async (token, password) => {
  const user = await MwasalatUser.findOne({
    passwordResetToken: token,
    passwordResetExpiry: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpiry');
  if (!user) throw new AppError('Reset link is invalid or has expired', 400);

  user.password = password;
  user.passwordSet = true;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  await user.save();
};

export const mwasalatAuthService = {
  register, login, getMe, updateProfile, changePassword, verifyInvitation, setPassword,
  forgotPassword, resetPassword, TOKEN_TYPE,
};
