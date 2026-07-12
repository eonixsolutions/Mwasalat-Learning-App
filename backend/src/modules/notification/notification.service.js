import User from '../user/user.model.js';
import { notificationRepository } from './notification.repository.js';
import { emitToUser } from '../../sockets/socket.js';
import { ROLES } from '../../constants/index.js';

const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN];

export const notifyUser = async (userId, { type, title, message, data = null, targetRole = null }) => {
  const notification = await notificationRepository.create({
    recipient: userId,
    type,
    title,
    message,
    data,
    targetRole,
  });
  emitToUser(userId.toString(), 'notification', notification);
};

export const notifyAdmins = async ({ type, title, message, data = null }) => {
  const admins = await User.find({ roles: { $elemMatch: { $in: ADMIN_ROLES } }, isActive: true })
    .select('_id roles')
    .lean();
  await Promise.all(
    admins.map(async (admin) => {
      const targetRole = ADMIN_ROLES.find((r) => admin.roles.includes(r)) ?? null;
      const notification = await notificationRepository.create({
        recipient: admin._id,
        type,
        title,
        message,
        data,
        targetRole,
      });
      emitToUser(admin._id.toString(), 'notification', notification);
    })
  );
};

export const getNotifications = async (userId, { page = 1, limit = 20, unread = false, role = null } = {}) => {
  const skip = (page - 1) * limit;
  const unreadOnly = unread === true || unread === 'true';
  const [notifications, total, unreadCount] = await Promise.all([
    notificationRepository.findByRecipient(userId, { skip, limit, unreadOnly, role }),
    notificationRepository.countByRecipient(userId, unreadOnly, role),
    notificationRepository.countUnread(userId, role),
  ]);
  return {
    notifications,
    unreadCount,
    pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / limit) },
  };
};

export const markAsRead = (id, userId) => notificationRepository.markOneRead(id, userId);

export const markAllAsRead = (userId, role = null) => notificationRepository.markAllRead(userId, role);

// Notify all users that have any of the given roles.
// Each notification is stamped with the first role in `roles` that the user holds,
// so the notification only appears when they are acting in that role.
export const notifyRole = async (roles, { type, title, message, data = null }) => {
  const targets = await User.find({ roles: { $elemMatch: { $in: roles } }, isActive: true })
    .select('_id roles')
    .lean();
  await Promise.allSettled(
    targets.map(async (u) => {
      const targetRole = roles.find((r) => u.roles.includes(r)) ?? null;
      const notification = await notificationRepository.create({
        recipient: u._id,
        type,
        title,
        message,
        data,
        targetRole,
      });
      emitToUser(u._id.toString(), 'notification', notification);
    })
  );
};
