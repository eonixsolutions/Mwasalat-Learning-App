import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { mwasalatNotificationService } from './mwasalatNotification.service.js';

const create = asyncHandler(async (req, res) => {
  const notification = await mwasalatNotificationService.create(req.mwasalatUser._id, req.body, req.mwasalatUser);
  successResponse(res, 'Notification sent', notification, 201);
});

const list = asyncHandler(async (req, res) => {
  const notifications = await mwasalatNotificationService.list(req.mwasalatUser._id, req.mwasalatUser.role);
  successResponse(res, 'Notifications fetched', notifications);
});

const markRead = asyncHandler(async (req, res) => {
  await mwasalatNotificationService.markRead(req.mwasalatUser._id, req.params.id);
  successResponse(res, 'Marked as read');
});

const markAllRead = asyncHandler(async (req, res) => {
  await mwasalatNotificationService.markAllRead(req.mwasalatUser._id, req.mwasalatUser.role);
  successResponse(res, 'All marked as read');
});

const listSent = asyncHandler(async (req, res) => {
  const notifications = await mwasalatNotificationService.listSent(req.mwasalatUser._id);
  successResponse(res, 'Sent notifications fetched', notifications);
});

const listReminders = asyncHandler(async (req, res) => {
  const notifications = await mwasalatNotificationService.listReminders({ type: req.query.type });
  successResponse(res, 'Reminders fetched', notifications);
});

const sendFromInstructor = asyncHandler(async (req, res) => {
  const result = await mwasalatNotificationService.sendFromInstructor(req.mwasalatUser, req.body, req.mwasalatUser);
  successResponse(res, 'Notification sent', result, 201);
});

const subscribePush = asyncHandler(async (req, res) => {
  await mwasalatNotificationService.subscribePush(req.mwasalatUser, req.body.subscription, req.headers['user-agent']);
  successResponse(res, 'Push subscription saved');
});

const unsubscribePush = asyncHandler(async (req, res) => {
  await mwasalatNotificationService.unsubscribePush(req.body.endpoint);
  successResponse(res, 'Push subscription removed');
});

export const mwasalatNotificationController = {
  create,
  list,
  markRead,
  markAllRead,
  listSent,
  listReminders,
  sendFromInstructor,
  subscribePush,
  unsubscribePush,
};
