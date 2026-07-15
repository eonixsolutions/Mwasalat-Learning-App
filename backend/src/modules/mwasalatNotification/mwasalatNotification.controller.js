import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { mwasalatNotificationService } from './mwasalatNotification.service.js';

const create = asyncHandler(async (req, res) => {
  const notification = await mwasalatNotificationService.create(req.mwasalatUser._id, req.body, req.mwasalatUser);
  successResponse(res, 'Notification sent', notification, 201);
});

const list = asyncHandler(async (req, res) => {
  const notifications = await mwasalatNotificationService.list(req.mwasalatUser._id);
  successResponse(res, 'Notifications fetched', notifications);
});

const markRead = asyncHandler(async (req, res) => {
  await mwasalatNotificationService.markRead(req.mwasalatUser._id, req.params.id);
  successResponse(res, 'Marked as read');
});

const markAllRead = asyncHandler(async (req, res) => {
  await mwasalatNotificationService.markAllRead(req.mwasalatUser._id);
  successResponse(res, 'All marked as read');
});

const listSent = asyncHandler(async (req, res) => {
  const notifications = await mwasalatNotificationService.listSent(req.mwasalatUser._id);
  successResponse(res, 'Sent notifications fetched', notifications);
});

export const mwasalatNotificationController = { create, list, markRead, markAllRead, listSent };
