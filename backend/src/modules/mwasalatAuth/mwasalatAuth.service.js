import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import MwasalatUser from '../mwasalatUser/mwasalatUser.model.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';
import { AppError } from '../../utils/AppError.js';
import { sendEmail } from '../../utils/mailer.js';
import { uploadBuffer } from '../../config/cloudinary.js';
import { assertStrongPassword } from '../../utils/passwordPolicy.js';
import { mwasalatResetPasswordTemplate } from '../mwasalatUser/mwasalatEmailTemplates.js';
import { mwasalatActivityLogService } from '../mwasalatActivityLog/mwasalatActivityLog.service.js';

const TOKEN_TYPE = 'mwasalat_user';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateAccessToken = (userId, role) =>
  jwt.sign({ id: userId, role, type: TOKEN_TYPE }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.MWASALAT_JWT_EXPIRES_IN || '12h',
  });

const register = async ({ name, email, password, consentAccepted }) => {
  if (!consentAccepted) throw new AppError('You must agree to the Terms of Service and Privacy Policy', 400);
  assertStrongPassword(password);

  const existing = await MwasalatUser.findOne({ email });
  if (existing) throw new AppError('A user with this email already exists', 409);

  const user = await MwasalatUser.create({
    name,
    email,
    password,
    role: MWASALAT_ROLES.LEARNER,
    isActive: true,
    passwordSet: true,
    consentAcceptedAt: new Date(),
  });

  const accessToken = generateAccessToken(user._id, user.role);
  return { accessToken, user: user.toJSON(), isNewUser: true };
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

  const isNewUser = !user.lastLogin;
  user.lastLogin = new Date();
  await user.save();

  mwasalatActivityLogService.record({
    actorId: user._id, actorName: user.name, actorRole: user.role, action: 'login',
  });

  const accessToken = generateAccessToken(user._id, user.role);
  return { accessToken, user: user.toJSON(), isNewUser };
};

const googleLogin = async ({ idToken, expectedRole }) => {
  if (!idToken) throw new AppError('Google ID token is required', 400);

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new AppError('Invalid or expired Google sign-in token', 401);
  }

  if (!payload?.email_verified) throw new AppError('Google account email is not verified', 401);

  let user = await MwasalatUser.findOne({ email: payload.email });
  let isNewUser = false;

  if (!user) {
    user = await MwasalatUser.create({
      name: payload.name || payload.email.split('@')[0],
      email: payload.email,
      role: MWASALAT_ROLES.LEARNER,
      isActive: true,
      passwordSet: false,
      authProvider: 'google',
      googleId: payload.sub,
      consentAcceptedAt: new Date(),
    });
    isNewUser = true;
  } else if (!user.googleId) {
    user.googleId = payload.sub;
    if (user.authProvider === 'local' && !user.passwordSet) user.authProvider = 'google';
  }

  if (!user.isActive) throw new AppError('Your account has been deactivated. Contact support.', 403);
  if (expectedRole && user.role !== expectedRole) {
    throw new AppError('This account does not have access to this login portal', 403);
  }

  user.lastLogin = new Date();
  await user.save();

  mwasalatActivityLogService.record({
    actorId: user._id, actorName: user.name, actorRole: user.role, action: isNewUser ? 'register' : 'login',
  });

  const accessToken = generateAccessToken(user._id, user.role);
  return { accessToken, user: user.toJSON(), isNewUser };
};

const getMe = async (userId) => {
  const user = await MwasalatUser.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user.toJSON();
};

const updateProfile = async (userId, { name, phone }, avatarFile) => {
  if (!name?.trim()) throw new AppError('Name is required', 400);

  const user = await MwasalatUser.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();

  if (avatarFile) {
    const uploaded = await uploadBuffer(avatarFile.buffer, {
      public_id: `mwasalat/avatars/${userId}`,
      resource_type: 'image',
      overwrite: true,
      invalidate: true,
    });
    user.avatarUrl = uploaded.secure_url;
  }

  await user.save();
  return user.toJSON();
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await MwasalatUser.findById(userId).select('+password');
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect', 401);

  assertStrongPassword(newPassword);
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
  assertStrongPassword(password);
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

  assertStrongPassword(password);
  user.password = password;
  user.passwordSet = true;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  await user.save();
};

export const mwasalatAuthService = {
  register, login, googleLogin, getMe, updateProfile, changePassword, verifyInvitation, setPassword,
  forgotPassword, resetPassword, TOKEN_TYPE,
};
