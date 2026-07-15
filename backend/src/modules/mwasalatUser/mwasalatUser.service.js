import crypto from 'crypto';
import MwasalatUser from './mwasalatUser.model.js';
import { AppError } from '../../utils/AppError.js';
import { MWASALAT_ROLES } from './mwasalatUser.constants.js';
import { sendEmail } from '../../utils/mailer.js';
import { instructorInviteTemplate, accountBlockedTemplate } from './mwasalatEmailTemplates.js';
import logger from '../../utils/logger.js';
import { mwasalatActivityLogService } from '../mwasalatActivityLog/mwasalatActivityLog.service.js';

const listByRole = async (role) => {
  const filter = role ? { role } : {};
  return MwasalatUser.find(filter).sort({ createdAt: -1 });
};

const inviteInstructor = async ({ name, email }, actor) => {
  const existing = await MwasalatUser.findOne({ email });
  if (existing) throw new AppError('A user with this email already exists', 409);

  const invitationToken = crypto.randomBytes(32).toString('hex');
  const placeholderPassword = crypto.randomBytes(16).toString('hex');

  const user = await MwasalatUser.create({
    name,
    email,
    password: placeholderPassword,
    role: MWASALAT_ROLES.INSTRUCTOR,
    isActive: true,
    passwordSet: false,
    invitationToken,
    invitationExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const setPasswordUrl = `${process.env.CLIENT_URL}/mwasalat/instructor/set-password/${invitationToken}`;
  await sendEmail({
    to: email,
    subject: 'You\'re invited to Mwasalat Learning Platform',
    html: instructorInviteTemplate({ name, setPasswordUrl }),
  });

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'invite_instructor', targetType: 'MwasalatUser', targetId: user._id, metadata: { email },
  });

  return user;
};

const setActive = async (id, isActive, reason, actor) => {
  if (!isActive && !reason?.trim()) {
    throw new AppError('A reason is required to block a user', 400);
  }

  const user = await MwasalatUser.findByIdAndUpdate(id, { isActive }, { new: true });
  if (!user) throw new AppError('User not found', 404);

  if (!isActive) {
    sendEmail({
      to: user.email,
      subject: 'Your Mwasalat Learning Platform account has been blocked',
      html: accountBlockedTemplate({ name: user.name, reason: reason.trim() }),
    }).catch((err) => logger.error(`[mwasalat-user] Block notification email failed for ${user.email}: ${err.message}`));
  }

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: isActive ? 'unblock_user' : 'block_user', targetType: 'MwasalatUser', targetId: user._id,
    metadata: { targetName: user.name, reason: isActive ? undefined : reason?.trim() },
  });

  return user;
};

export const mwasalatUserService = { listByRole, inviteInstructor, setActive };
