import MwasalatNotification from './mwasalatNotification.model.js';
import { AppError } from '../../utils/AppError.js';
import { broadcastMwasalatNotification, emitToMwasalatUser } from '../../sockets/socket.js';
import { mwasalatActivityLogService } from '../mwasalatActivityLog/mwasalatActivityLog.service.js';

// Notifications created before `recipients` existed have no such field at all
// (schema additions don't backfill), so `$exists: false` keeps them visible
// to everyone alongside genuinely-empty-array broadcasts.
const VISIBLE_TO = (userId) => ({
  $or: [
    { recipients: { $exists: false } },
    { recipients: { $size: 0 } },
    { recipients: userId },
  ],
});

const create = async (adminId, { title, message }, actor) => {
  if (!title?.trim() || !message?.trim()) {
    throw new AppError('Title and message are required', 400);
  }

  const notification = await MwasalatNotification.create({
    title: title.trim(),
    message: message.trim(),
    createdBy: adminId,
  });

  broadcastMwasalatNotification({
    _id: notification._id,
    title: notification.title,
    message: notification.message,
    createdAt: notification.createdAt,
  });

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'send_notification', targetType: 'MwasalatNotification', targetId: notification._id,
    metadata: { title: notification.title },
  });

  return notification;
};

const list = async (userId) => {
  const notifications = await MwasalatNotification.find(VISIBLE_TO(userId)).sort({ createdAt: -1 }).limit(50);
  return notifications.map((n) => ({
    _id: n._id,
    title: n.title,
    message: n.message,
    createdAt: n.createdAt,
    isRead: n.readBy.some((id) => id.toString() === userId.toString()),
  }));
};

const markRead = async (userId, notificationId) => {
  await MwasalatNotification.updateOne(
    { _id: notificationId },
    { $addToSet: { readBy: userId } }
  );
};

const markAllRead = async (userId) => {
  await MwasalatNotification.updateMany(
    { readBy: { $ne: userId }, ...VISIBLE_TO(userId) },
    { $addToSet: { readBy: userId } }
  );
};

// Targeted notification — e.g. the learners enrolled in a course that just
// got archived. Unlike `create()` (admin broadcast, visible to everyone),
// this only reaches the given user IDs, both in the notification list and
// in real time over their personal socket room.
const notifyUsers = async (actorId, userIds, { title, message }) => {
  const recipients = [...new Set((userIds ?? []).map(String))];
  if (!recipients.length) return null;

  const notification = await MwasalatNotification.create({
    title: title.trim(),
    message: message.trim(),
    createdBy: actorId,
    recipients,
  });

  const payload = {
    _id: notification._id,
    title: notification.title,
    message: notification.message,
    createdAt: notification.createdAt,
  };
  recipients.forEach((id) => emitToMwasalatUser(id, 'mwasalat:notification', payload));

  return notification;
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
  }));
};

export const mwasalatNotificationService = { create, list, markRead, markAllRead, listSent, notifyUsers };
