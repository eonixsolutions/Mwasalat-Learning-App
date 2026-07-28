import MwasalatNotification from './mwasalatNotification.model.js';
import MwasalatProgram from '../mwasalatProgram/mwasalatProgram.model.js';
import MwasalatEnrollment from '../mwasalatProgram/mwasalatEnrollment.model.js';
import { AppError } from '../../utils/AppError.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';
import { broadcastMwasalatNotification, emitToMwasalatUser } from '../../sockets/socket.js';
import { mwasalatActivityLogService } from '../mwasalatActivityLog/mwasalatActivityLog.service.js';
import {
  sendPushToUserIds,
  sendPushToRoles,
  upsertPushSubscription,
  removePushSubscription,
} from '../../integrations/webPush.js';

// Notifications created before `recipients` existed have no such field at all
// (schema additions don't backfill), so `$exists: false` keeps them visible
// to everyone alongside genuinely-empty-array broadcasts. Same reasoning for
// `roles`: absent/empty means "every role", not "no role".
const VISIBLE_TO = (userId, role) => ({
  $and: [
    {
      $or: [
        { recipients: { $exists: false } },
        { recipients: { $size: 0 } },
        { recipients: userId },
      ],
    },
    {
      $or: [
        { roles: { $exists: false } },
        { roles: { $size: 0 } },
        { roles: role },
      ],
    },
  ],
});

const create = async (adminId, { title, message, roles }, actor) => {
  if (!title?.trim() || !message?.trim()) {
    throw new AppError('Title and message are required', 400);
  }

  const targetRoles = [...new Set((roles ?? []).map(String))];
  if (targetRoles.some((r) => !Object.values(MWASALAT_ROLES).includes(r))) {
    throw new AppError('Invalid audience role', 400);
  }

  const notification = await MwasalatNotification.create({
    title: title.trim(),
    message: message.trim(),
    createdBy: adminId,
    roles: targetRoles,
  });

  broadcastMwasalatNotification({
    _id: notification._id,
    title: notification.title,
    message: notification.message,
    createdAt: notification.createdAt,
  }, targetRoles);

  sendPushToRoles(targetRoles, { title: notification.title, body: notification.message });

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'send_notification', targetType: 'MwasalatNotification', targetId: notification._id,
    metadata: { title: notification.title },
  });

  return notification;
};

const list = async (userId, role) => {
  const notifications = await MwasalatNotification.find(VISIBLE_TO(userId, role)).sort({ createdAt: -1 }).limit(50);
  return notifications.map((n) => ({
    _id: n._id,
    title: n.title,
    message: n.message,
    createdAt: n.createdAt,
    isRead: n.readBy.some((id) => id.toString() === userId.toString()),
    type: n.type,
    data: n.data,
  }));
};

const markRead = async (userId, notificationId) => {
  await MwasalatNotification.updateOne(
    { _id: notificationId },
    { $addToSet: { readBy: userId } }
  );
};

const markAllRead = async (userId, role) => {
  await MwasalatNotification.updateMany(
    { readBy: { $ne: userId }, ...VISIBLE_TO(userId, role) },
    { $addToSet: { readBy: userId } }
  );
};

// Targeted notification — e.g. the learners enrolled in a course that just
// got archived. Unlike `create()` (admin broadcast, visible to everyone),
// this only reaches the given user IDs, both in the notification list and
// in real time over their personal socket room.
const notifyUsers = async (actorId, userIds, { title, message, type, data, url }) => {
  const recipients = [...new Set((userIds ?? []).map(String))];
  if (!recipients.length) return null;

  const notification = await MwasalatNotification.create({
    title: title.trim(),
    message: message.trim(),
    createdBy: actorId,
    recipients,
    ...(type ? { type } : {}),
    ...(data ? { data } : {}),
  });

  const payload = {
    _id: notification._id,
    title: notification.title,
    message: notification.message,
    createdAt: notification.createdAt,
    type: notification.type,
    data: notification.data,
  };
  recipients.forEach((id) => emitToMwasalatUser(id, 'mwasalat:notification', payload));
  // `url` is what sw.js reads on notificationclick to deep-link the push
  // notification (see MwasalatNotificationBell's resolveNotificationLink for
  // the equivalent in-app resolution) — undefined for non-click-through
  // types (broadcasts, reminders), which sw.js falls back to '/' for.
  sendPushToUserIds(recipients, { title: notification.title, body: notification.message, url });

  return notification;
};

// Instructor-composed notification — unlike create() (admin-only, visible to
// literally everyone), this reaches only the learners on one or more of the
// instructor's own courses, or every learner across every course they teach
// when no programIds are given. Delivered through the same targeted path as
// notifyUsers (personal socket room + recipients list), just with a
// caller-supplied title/message instead of a canned template.
const sendFromInstructor = async (instructor, { title, message, programIds }, actor) => {
  if (!title?.trim() || !message?.trim()) {
    throw new AppError('Title and message are required', 400);
  }

  let targetProgramIds;
  const requestedIds = [...new Set((programIds ?? []).map(String))];
  if (requestedIds.length) {
    const programs = await MwasalatProgram.find({ _id: { $in: requestedIds } });
    if (programs.length !== requestedIds.length) throw new AppError('One or more courses were not found', 404);
    const isOwner = (p) => instructor.role === MWASALAT_ROLES.SUPER_ADMIN || String(p.instructor) === String(instructor._id);
    if (!programs.every(isOwner)) {
      throw new AppError('You do not have permission to notify learners on one or more of these courses', 403);
    }
    targetProgramIds = programs.map((p) => p._id);
  } else {
    targetProgramIds = await MwasalatProgram.find({ instructor: instructor._id }).distinct('_id');
  }
  if (!targetProgramIds.length) throw new AppError('You have no courses to notify learners on', 400);

  const learnerIds = await MwasalatEnrollment.find({ program: { $in: targetProgramIds } }).distinct('learner');
  if (!learnerIds.length) throw new AppError('No learners are enrolled yet', 400);

  const notification = await notifyUsers(instructor._id, learnerIds, { title, message });

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'send_notification', targetType: 'MwasalatNotification', targetId: notification._id,
    metadata: { title, recipientCount: learnerIds.length },
  });

  return { notification, recipientCount: learnerIds.length };
};

// System-generated reminders (certificate expiry, inactivity nudges) — unlike
// listSent (filtered to createdBy === adminId), these are created with the
// course instructor as createdBy, so an admin history view has to filter by
// `type` instead of by author to surface them across every instructor.
const REMINDER_TYPES = ['certificate_expiry', 'inactivity_nudge'];

const listReminders = async ({ type } = {}) => {
  const filter = { type: type && REMINDER_TYPES.includes(type) ? type : { $in: REMINDER_TYPES } };
  const notifications = await MwasalatNotification.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('recipients', 'name email');

  return notifications.map((n) => ({
    _id: n._id,
    type: n.type,
    title: n.title,
    message: n.message,
    createdAt: n.createdAt,
    recipient: n.recipients?.[0] ? { name: n.recipients[0].name, email: n.recipients[0].email } : null,
  }));
};

// History of broadcasts the admin has sent — backs the admin Notifications history view.
const listSent = async (adminId) => {
  const notifications = await MwasalatNotification.find({ createdBy: adminId }).sort({ createdAt: -1 }).limit(100);
  return notifications.map((n) => ({
    _id: n._id,
    title: n.title,
    message: n.message,
    createdAt: n.createdAt,
    readCount: n.readBy.length,
    roles: n.roles ?? [],
  }));
};

// Registers this browser/device to receive push notifications for the
// current user. Keyed by endpoint (upsert), so re-subscribing after a token
// refresh or re-granting permission on the same device updates in place
// instead of accumulating duplicate rows.
const subscribePush = async (user, subscription, userAgent) => {
  if (!subscription?.endpoint) {
    throw new AppError('Invalid push subscription', 400);
  }
  await upsertPushSubscription(user._id, user.role, subscription, userAgent);
};

const unsubscribePush = async (endpoint) => {
  await removePushSubscription(endpoint);
};

export const mwasalatNotificationService = {
  create,
  list,
  markRead,
  markAllRead,
  listSent,
  listReminders,
  notifyUsers,
  sendFromInstructor,
  subscribePush,
  unsubscribePush,
};
