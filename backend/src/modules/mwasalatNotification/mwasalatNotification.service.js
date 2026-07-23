import MwasalatNotification from './mwasalatNotification.model.js';
import MwasalatProgram from '../mwasalatProgram/mwasalatProgram.model.js';
import MwasalatEnrollment from '../mwasalatProgram/mwasalatEnrollment.model.js';
import { AppError } from '../../utils/AppError.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';
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

// Instructor-composed notification — unlike create() (admin-only, visible to
// literally everyone), this reaches only the learners on one of the
// instructor's own courses, or every learner across every course they teach
// when no programId is given. Delivered through the same targeted path as
// notifyUsers (personal socket room + recipients list), just with a
// caller-supplied title/message instead of a canned template.
const sendFromInstructor = async (instructor, { title, message, programId }, actor) => {
  if (!title?.trim() || !message?.trim()) {
    throw new AppError('Title and message are required', 400);
  }

  let programIds;
  if (programId) {
    const program = await MwasalatProgram.findById(programId);
    if (!program) throw new AppError('Program not found', 404);
    if (instructor.role !== MWASALAT_ROLES.SUPER_ADMIN && String(program.instructor) !== String(instructor._id)) {
      throw new AppError('You do not have permission to notify learners on this course', 403);
    }
    programIds = [program._id];
  } else {
    programIds = await MwasalatProgram.find({ instructor: instructor._id }).distinct('_id');
  }
  if (!programIds.length) throw new AppError('You have no courses to notify learners on', 400);

  const learnerIds = await MwasalatEnrollment.find({ program: { $in: programIds } }).distinct('learner');
  if (!learnerIds.length) throw new AppError('No learners are enrolled yet', 400);

  const notification = await notifyUsers(instructor._id, learnerIds, { title, message });

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'send_notification', targetType: 'MwasalatNotification', targetId: notification._id,
    metadata: { title, recipientCount: learnerIds.length },
  });

  return { notification, recipientCount: learnerIds.length };
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

export const mwasalatNotificationService = { create, list, markRead, markAllRead, listSent, notifyUsers, sendFromInstructor };
