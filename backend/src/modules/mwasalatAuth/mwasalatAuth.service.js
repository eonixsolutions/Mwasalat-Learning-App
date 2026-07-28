import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { generateSecret as generateTotpSecret, verify as verifyTotp, generateURI as totpUri } from 'otplib';
import MwasalatUser from '../mwasalatUser/mwasalatUser.model.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';
import { AppError } from '../../utils/AppError.js';
import { sendEmail } from '../../utils/mailer.js';
import { uploadBuffer } from '../../config/cloudinary.js';
import { assertStrongPassword } from '../../utils/passwordPolicy.js';
import { mwasalatResetPasswordTemplate } from '../mwasalatUser/mwasalatEmailTemplates.js';
import { mwasalatActivityLogService } from '../mwasalatActivityLog/mwasalatActivityLog.service.js';
import { mwasalatCaptcha } from '../../utils/mwasalatCaptcha.js';
import { mwasalatSettingsService } from '../mwasalatSettings/mwasalatSettings.service.js';
import { isIpAllowed } from '../../utils/ipMatch.js';
import { encryptField, decryptField } from '../../utils/encryption.js';

const TOKEN_TYPE = 'mwasalat_user';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// expectedRole is a single role for the instructor/learner login forms, or an
// array for the shared admin login form (accepts both super_admin and
// platform_admin) — this is what pins each login page to its own role(s).
const matchesExpectedRole = (role, expectedRole) => {
  if (!expectedRole) return true;
  return Array.isArray(expectedRole) ? expectedRole.includes(role) : role === expectedRole;
};

// external_learner is the only self-registered role — every other role
// (all staff, plus internal `learner` accounts, which are bulk-imported /
// invited by an admin exactly like staff — see bulkImport in
// mwasalatUser.service.js) signs in through the IP-restricted staff portal.
const isIpRestrictedRole = (role) => role !== MWASALAT_ROLES.EXTERNAL_LEARNER;
const isAdminRole = (role) => role === MWASALAT_ROLES.SUPER_ADMIN || role === MWASALAT_ROLES.PLATFORM_ADMIN;

// Blocks sign-in for everyone except admins while maintenance mode is on
// (Settings > Maintenance Mode) — admins still need to log in to turn it
// back off. Runs after credentials are verified, same placement as the IP
// restriction check below.
const enforceMaintenanceMode = async (user) => {
  if (isAdminRole(user.role)) return;

  const settings = await mwasalatSettingsService.getCachedSettings();
  if (settings.maintenanceMode) {
    throw new AppError('The platform is temporarily down for maintenance. Please try again shortly.', 503);
  }
};

// Gates sign-ins behind the admin-configured IP/CIDR allowlist (Settings >
// ipRestriction). Runs only after the password has been verified and the
// account's real role is known from the DB — never trust a client-supplied
// role hint for this, since expectedRole is just portal-pinning UX, not auth.
// Only external/contractor learners are exempt: they self-register and log
// in from anywhere. Internal learner accounts are admin-provisioned exactly
// like staff, so they're held to the same network restriction.
const enforceStaffIpRestriction = async (user, ip) => {
  if (!isIpRestrictedRole(user.role)) return;

  const settings = await mwasalatSettingsService.getCachedSettings();
  const { enabled, allowedIps } = settings.ipRestriction || {};
  if (!enabled || !allowedIps?.length) return;

  if (!isIpAllowed(ip, allowedIps)) {
    throw new AppError('This account must sign in from an approved network.', 403);
  }
};

const generateAccessToken = (userId, role) =>
  jwt.sign({ id: userId, role, type: TOKEN_TYPE }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });

const REFRESH_TOKEN_TYPE = 'mwasalat_refresh';
// tokenVersion is embedded so changing your password (which bumps it — see the
// pre-save hook in mwasalatUser.model.js) invalidates every refresh token that
// was issued before the change, on every device.
const generateRefreshToken = (userId, tokenVersion) =>
  jwt.sign({ id: userId, tokenVersion: tokenVersion || 0, type: REFRESH_TOKEN_TYPE }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

// Issues both halves of a session for an already-validated user: a short-lived
// access token (sent in the response body, used as a Bearer header) and a
// refresh token (sent only via the httpOnly cookie the controller sets — see
// mwasalatAuth.controller.js). Callers must have `tokenVersion` selected/loaded
// on `user`, or the embedded value will be wrong and the refresh token unusable.
const issueSessionTokens = (user) => ({
  accessToken: generateAccessToken(user._id, user.role),
  refreshToken: generateRefreshToken(user._id, user.tokenVersion),
});

const TWO_FACTOR_CHALLENGE_TYPE = 'mwasalat_2fa_challenge';
const generateTwoFactorChallengeToken = (userId) =>
  jwt.sign({ id: userId, type: TWO_FACTOR_CHALLENGE_TYPE }, process.env.JWT_ACCESS_SECRET, { expiresIn: '5m' });

const PASSWORD_EXPIRED_CHALLENGE_TYPE = 'mwasalat_pwd_expired_challenge';
const generatePasswordExpiredChallengeToken = (userId) =>
  jwt.sign({ id: userId, type: PASSWORD_EXPIRED_CHALLENGE_TYPE }, process.env.JWT_ACCESS_SECRET, { expiresIn: '10m' });

// Account Lockout Policy — locks the account for settings.security.lockoutMinutes
// after settings.security.maxLoginAttempts consecutive bad passwords. Counters
// reset on the next successful login (see clearFailedLogins below).
const registerFailedLogin = async (user, settings) => {
  const maxAttempts = settings.security?.maxLoginAttempts || 5;
  const lockoutMinutes = settings.security?.lockoutMinutes || 15;
  user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
  if (user.failedLoginAttempts >= maxAttempts) {
    user.lockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
  }
  await user.save();
};

const clearFailedLogins = (user) => {
  if (user.failedLoginAttempts || user.lockedUntil) {
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
  }
};

const enforceAccountNotLocked = (user) => {
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.max(1, Math.ceil((user.lockedUntil - new Date()) / 60000));
    throw new AppError(`Too many failed sign-in attempts. Please try again in ${minutesLeft} minute(s).`, 423);
  }
};

// Password Expiry Policy — disabled platform-wide when passwordExpiryDays is 0
// (the default). Google-only accounts (no local password) are exempt.
const isPasswordExpired = (user, settings) => {
  const days = settings.security?.passwordExpiryDays;
  if (!days || user.authProvider !== 'local') return false;
  const changedAt = user.passwordChangedAt || user.createdAt;
  if (!changedAt) return false;
  return Date.now() - new Date(changedAt).getTime() > days * 24 * 60 * 60 * 1000;
};

const register = async ({ name, email, phone, password, consentAccepted, captchaToken, captchaAnswer }) => {
  const settings = await mwasalatSettingsService.getCachedSettings();
  if (settings.maintenanceMode) {
    throw new AppError('The platform is temporarily down for maintenance. Please try again shortly.', 503);
  }

  if (!mwasalatCaptcha.verifyCaptcha(captchaToken, captchaAnswer)) {
    throw new AppError('Incorrect answer to the verification question. Please try again.', 400);
  }
  if (!consentAccepted) throw new AppError('You must agree to the Terms of Service and Privacy Policy', 400);
  assertStrongPassword(password);

  const existing = await MwasalatUser.findOne({ email });
  if (existing) throw new AppError('A user with this email already exists', 409);

  // Public self-registration only ever mints external_learner accounts —
  // staff and internal learner accounts are admin-provisioned only (invite
  // or bulk import), never self-registered.
  const user = await MwasalatUser.create({
    name,
    email,
    phone,
    password,
    role: MWASALAT_ROLES.EXTERNAL_LEARNER,
    isActive: true,
    passwordSet: true,
    consentAcceptedAt: new Date(),
  });

  const { accessToken, refreshToken } = issueSessionTokens(user);
  return { accessToken, refreshToken, user: user.toJSON(), isNewUser: true };
};

const login = async ({ email, password, expectedRole }, ip) => {
  const settings = await mwasalatSettingsService.getCachedSettings();
  const user = await MwasalatUser.findOne({ email }).select(
    '+password +failedLoginAttempts +lockedUntil +passwordChangedAt +tokenVersion'
  );
  if (!user) throw new AppError('Invalid email or password', 401);

  enforceAccountNotLocked(user);

  if (!user.passwordSet) throw new AppError('Please set your password using the invite link sent to your email.', 403);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await registerFailedLogin(user, settings);
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) throw new AppError('Your account has been deactivated. Contact support.', 403);

  if (!matchesExpectedRole(user.role, expectedRole)) {
    throw new AppError('This account does not have access to this login portal', 403);
  }

  await enforceStaffIpRestriction(user, ip);
  await enforceMaintenanceMode(user);

  clearFailedLogins(user);

  if (isPasswordExpired(user, settings)) {
    await user.save();
    return { requiresPasswordChange: true, challengeToken: generatePasswordExpiredChallengeToken(user._id) };
  }

  if (user.twoFactorEnabled) {
    await user.save();
    return { requires2FA: true, challengeToken: generateTwoFactorChallengeToken(user._id) };
  }

  const isNewUser = !user.lastLogin;
  user.lastLogin = new Date();
  await user.save();

  mwasalatActivityLogService.record({
    actorId: user._id, actorName: user.name, actorRole: user.role, action: 'login',
  });

  const { accessToken, refreshToken } = issueSessionTokens(user);
  return { accessToken, refreshToken, user: user.toJSON(), isNewUser };
};

// Completes a login that was paused because the account's password has aged
// past the admin-configured expiry policy — verifies the short-lived
// challenge issued by login(), forces a new password, then either falls
// through to the normal 2FA challenge or completes the session outright.
const resetExpiredPassword = async ({ challengeToken, newPassword }) => {
  let decoded;
  try {
    decoded = jwt.verify(challengeToken, process.env.JWT_ACCESS_SECRET);
  } catch {
    throw new AppError('Your sign-in session has expired. Please sign in again.', 401);
  }
  if (decoded.type !== PASSWORD_EXPIRED_CHALLENGE_TYPE) throw new AppError('Invalid verification session', 401);

  const user = await MwasalatUser.findById(decoded.id).select('+tokenVersion');
  if (!user) throw new AppError('User not found', 404);

  assertStrongPassword(newPassword);
  user.password = newPassword; // pre-save hook re-stamps passwordChangedAt + bumps tokenVersion
  await user.save();

  mwasalatActivityLogService.record({
    actorId: user._id, actorName: user.name, actorRole: user.role, action: 'password_expired_reset',
  });

  if (user.twoFactorEnabled) {
    return { requires2FA: true, challengeToken: generateTwoFactorChallengeToken(user._id) };
  }

  const isNewUser = !user.lastLogin;
  user.lastLogin = new Date();
  await user.save();

  mwasalatActivityLogService.record({
    actorId: user._id, actorName: user.name, actorRole: user.role, action: 'login',
  });

  const { accessToken, refreshToken } = issueSessionTokens(user);
  return { accessToken, refreshToken, user: user.toJSON(), isNewUser };
};

// Completes a login that was paused for a 2FA challenge: accepts either a
// current TOTP code or a one-time backup code (consumed on use).
const verifyTwoFactorLogin = async ({ challengeToken, token }, ip) => {
  let decoded;
  try {
    decoded = jwt.verify(challengeToken, process.env.JWT_ACCESS_SECRET);
  } catch {
    throw new AppError('Your sign-in session has expired. Please sign in again.', 401);
  }
  if (decoded.type !== TWO_FACTOR_CHALLENGE_TYPE) throw new AppError('Invalid verification session', 401);

  const user = await MwasalatUser.findById(decoded.id).select('+twoFactorSecret +twoFactorBackupCodes +tokenVersion');
  if (!user || !user.twoFactorEnabled) throw new AppError('Two-factor authentication is not enabled for this account', 400);

  const submitted = String(token || '').trim();
  let verified = false;

  if (/^\d{6}$/.test(submitted)) {
    const result = await verifyTotp({ secret: decryptField(user.twoFactorSecret), token: submitted });
    verified = result.valid;
  }

  if (!verified && submitted) {
    const normalized = submitted.toUpperCase().replace(/\s+/g, '');
    for (let i = 0; i < user.twoFactorBackupCodes.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      if (await bcrypt.compare(normalized, user.twoFactorBackupCodes[i])) {
        user.twoFactorBackupCodes.splice(i, 1);
        verified = true;
        break;
      }
    }
  }

  if (!verified) throw new AppError('Incorrect verification code. Please try again.', 400);

  await enforceStaffIpRestriction(user, ip);
  await enforceMaintenanceMode(user);

  const isNewUser = !user.lastLogin;
  user.lastLogin = new Date();
  await user.save();

  mwasalatActivityLogService.record({
    actorId: user._id, actorName: user.name, actorRole: user.role, action: 'login',
  });

  const { accessToken, refreshToken } = issueSessionTokens(user);
  return { accessToken, refreshToken, user: user.toJSON(), isNewUser };
};

const BACKUP_CODE_COUNT = 8;
const generateBackupCodes = () => Array.from({ length: BACKUP_CODE_COUNT }, () => crypto.randomBytes(5).toString('hex').toUpperCase());

const setupTwoFactor = async (userId) => {
  const user = await MwasalatUser.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  if (user.twoFactorEnabled) throw new AppError('Two-factor authentication is already enabled', 400);

  const secret = generateTotpSecret();
  user.twoFactorSecret = encryptField(secret);
  await user.save();

  const otpauthUrl = totpUri({ issuer: 'Mwasalat Learning Platform', label: user.email, secret });
  return { secret, otpauthUrl };
};

const enableTwoFactor = async (userId, token) => {
  const user = await MwasalatUser.findById(userId).select('+twoFactorSecret');
  if (!user?.twoFactorSecret) throw new AppError('Start two-factor setup first', 400);
  if (user.twoFactorEnabled) throw new AppError('Two-factor authentication is already enabled', 400);

  const result = await verifyTotp({ secret: decryptField(user.twoFactorSecret), token: String(token || '').trim() });
  if (!result.valid) throw new AppError('Incorrect verification code. Please try again.', 400);

  const backupCodes = generateBackupCodes();
  user.twoFactorEnabled = true;
  user.twoFactorBackupCodes = await Promise.all(backupCodes.map((code) => bcrypt.hash(code, 10)));
  await user.save();

  mwasalatActivityLogService.record({
    actorId: user._id, actorName: user.name, actorRole: user.role, action: 'enable_2fa',
  });

  return { backupCodes };
};

const disableTwoFactor = async (userId, password) => {
  const user = await MwasalatUser.findById(userId).select('+password');
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Current password is incorrect', 401);

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.twoFactorBackupCodes = [];
  await user.save();

  mwasalatActivityLogService.record({
    actorId: user._id, actorName: user.name, actorRole: user.role, action: 'disable_2fa',
  });
};

const googleLogin = async ({ idToken, expectedRole }, ip) => {
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

  let user = await MwasalatUser.findOne({ email: payload.email }).select('+tokenVersion');
  let isNewUser = false;

  if (!user) {
    // Same rule as register(): Google sign-in can only ever auto-provision an
    // external_learner. Staff/internal-learner accounts are admin-provisioned
    // only, never self-registered — including via Google.
    user = await MwasalatUser.create({
      name: payload.name || payload.email.split('@')[0],
      email: payload.email,
      role: MWASALAT_ROLES.EXTERNAL_LEARNER,
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
  if (!matchesExpectedRole(user.role, expectedRole)) {
    throw new AppError('This account does not have access to this login portal', 403);
  }

  await enforceStaffIpRestriction(user, ip);
  await enforceMaintenanceMode(user);

  if (user.twoFactorEnabled) {
    return { requires2FA: true, challengeToken: generateTwoFactorChallengeToken(user._id) };
  }

  user.lastLogin = new Date();
  await user.save();

  mwasalatActivityLogService.record({
    actorId: user._id, actorName: user.name, actorRole: user.role, action: isNewUser ? 'register' : 'login',
  });

  const { accessToken, refreshToken } = issueSessionTokens(user);
  return { accessToken, refreshToken, user: user.toJSON(), isNewUser };
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
  const user = await MwasalatUser.findById(userId).select('+password +tokenVersion');
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect', 401);

  assertStrongPassword(newPassword);
  user.password = newPassword; // bumps tokenVersion — invalidates every other device's refresh token
  await user.save();

  // Re-issue this session's own refresh token against the new tokenVersion so the
  // user making the change isn't logged out of their own current session too.
  return issueSessionTokens(user);
};

const getByInvitationToken = async (token) => {
  const user = await MwasalatUser.findOne({
    invitationToken: token,
    invitationExpiry: { $gt: new Date() },
  }).select('+invitationToken +invitationExpiry +tokenVersion');
  if (!user) throw new AppError('Invitation link is invalid or has expired', 400);
  return user;
};

const verifyInvitation = async (token) => {
  const user = await getByInvitationToken(token);
  return { name: user.name, email: user.email, role: user.role };
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

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const forgotPassword = async ({ email, captchaToken, captchaAnswer }) => {
  if (!mwasalatCaptcha.verifyCaptcha(captchaToken, captchaAnswer)) {
    throw new AppError('Incorrect answer to the verification question. Please try again.', 400);
  }

  const user = await MwasalatUser.findOne({ email });
  if (!user) return; // don't reveal whether the email exists

  const otp = String(crypto.randomInt(100000, 1000000));
  user.passwordResetOtp = await bcrypt.hash(otp, 10);
  user.passwordResetOtpExpiry = new Date(Date.now() + OTP_TTL_MS);
  user.passwordResetOtpAttempts = 0;
  await user.save();

  await sendEmail({
    to: email,
    subject: 'Reset your Mwasalat Learning Platform password',
    html: mwasalatResetPasswordTemplate({ otp }),
  });
};

const resetPassword = async ({ email, otp, password }) => {
  const user = await MwasalatUser.findOne({ email }).select(
    '+passwordResetOtp +passwordResetOtpExpiry +passwordResetOtpAttempts +tokenVersion'
  );
  if (!user || !user.passwordResetOtp || !user.passwordResetOtpExpiry) {
    throw new AppError('Invalid or expired verification code. Please request a new one.', 400);
  }
  if (user.passwordResetOtpExpiry < new Date()) {
    throw new AppError('Verification code has expired. Please request a new one.', 400);
  }
  if (user.passwordResetOtpAttempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError('Too many incorrect attempts. Please request a new verification code.', 429);
  }

  const isMatch = await bcrypt.compare(String(otp || ''), user.passwordResetOtp);
  if (!isMatch) {
    user.passwordResetOtpAttempts += 1;
    await user.save();
    throw new AppError('Incorrect verification code. Please try again.', 400);
  }

  assertStrongPassword(password);
  user.password = password;
  user.passwordSet = true;
  user.passwordResetOtp = undefined;
  user.passwordResetOtpExpiry = undefined;
  user.passwordResetOtpAttempts = 0;
  await user.save();
};

const getCaptcha = () => mwasalatCaptcha.generateCaptcha();

// Exchanges a still-valid refresh token (read from the httpOnly cookie by the
// controller) for a new access token, rotating the refresh token too. Rejects
// if the account was deactivated or the token's tokenVersion has been
// superseded by a password change since it was issued.
const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) throw new AppError('Not authenticated', 401);

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Your session has expired. Please sign in again.', 401);
  }
  if (decoded.type !== REFRESH_TOKEN_TYPE) throw new AppError('Invalid refresh token', 401);

  const user = await MwasalatUser.findById(decoded.id).select('+tokenVersion');
  if (!user || !user.isActive) throw new AppError('Your session has expired. Please sign in again.', 401);
  if ((user.tokenVersion || 0) !== decoded.tokenVersion) {
    throw new AppError('Your session has expired. Please sign in again.', 401);
  }

  const { accessToken, refreshToken: nextRefreshToken } = issueSessionTokens(user);
  return { accessToken, refreshToken: nextRefreshToken, user: user.toJSON() };
};

export const mwasalatAuthService = {
  register, login, googleLogin, getMe, updateProfile, changePassword, verifyInvitation, setPassword,
  forgotPassword, resetPassword, getCaptcha,
  verifyTwoFactorLogin, setupTwoFactor, enableTwoFactor, disableTwoFactor,
  resetExpiredPassword, refreshAccessToken,
  REFRESH_TOKEN_TYPE, REFRESH_COOKIE_NAME: 'mwasalat_refresh_token',
  TOKEN_TYPE,
};
