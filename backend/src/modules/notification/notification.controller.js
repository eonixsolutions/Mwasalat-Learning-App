import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import * as notificationService from './notification.service.js';

const list = asyncHandler(async (req, res) => {
  const { page, limit, unread, role } = req.query;
  const activeRole = role ?? req.user.role;
  const result = await notificationService.getNotifications(req.user._id, {
    page:  +page  || 1,
    limit: +limit || 20,
    unread,
    role: activeRole,
  });
  successResponse(res, 'Notifications fetched', result);
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user._id);
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
  successResponse(res, 'Marked as read', notification);
});

const markAllRead = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const activeRole = role ?? req.user.role;
  await notificationService.markAllAsRead(req.user._id, activeRole);
  successResponse(res, 'All notifications marked as read');
});

export const notificationController = { list, markRead, markAllRead };
