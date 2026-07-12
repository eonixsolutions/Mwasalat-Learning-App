import Notification from './notification.model.js';

// Build the role filter: show notifications for this role OR general (targetRole = null)
const roleFilter = (role) =>
  role ? { $or: [{ targetRole: role }, { targetRole: null }] } : {};

const create = (data) => Notification.create(data);

const findByRecipient = (recipientId, { skip = 0, limit = 20, unreadOnly = false, role = null } = {}) =>
  Notification.find({
    recipient: recipientId,
    ...(unreadOnly ? { isRead: false } : {}),
    ...roleFilter(role),
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

const countByRecipient = (recipientId, unreadOnly = false, role = null) =>
  Notification.countDocuments({
    recipient: recipientId,
    ...(unreadOnly ? { isRead: false } : {}),
    ...roleFilter(role),
  });

const countUnread = (recipientId, role = null) =>
  Notification.countDocuments({
    recipient: recipientId,
    isRead: false,
    ...roleFilter(role),
  });

const markOneRead = (id, recipientId) =>
  Notification.findOneAndUpdate(
    { _id: id, recipient: recipientId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

const markAllRead = (recipientId, role = null) =>
  Notification.updateMany(
    { recipient: recipientId, isRead: false, ...roleFilter(role) },
    { isRead: true, readAt: new Date() }
  );

export const notificationRepository = {
  create,
  findByRecipient,
  countByRecipient,
  countUnread,
  markOneRead,
  markAllRead,
};
