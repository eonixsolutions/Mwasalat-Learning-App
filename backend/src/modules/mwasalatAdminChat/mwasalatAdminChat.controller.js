import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { mwasalatAdminChatService } from './mwasalatAdminChat.service.js';

const listInbox = asyncHandler(async (req, res) => {
  const inbox = await mwasalatAdminChatService.listInbox(req.mwasalatUser);
  successResponse(res, 'Inbox fetched', inbox);
});

const getThread = asyncHandler(async (req, res) => {
  const result = await mwasalatAdminChatService.getThread(req.mwasalatUser, req.params.userId);
  successResponse(res, 'Thread fetched', result);
});

const sendMessage = asyncHandler(async (req, res) => {
  const message = await mwasalatAdminChatService.sendMessage(req.mwasalatUser, req.params.userId, req.body.text);
  successResponse(res, 'Message sent', message, 201);
});

const markRead = asyncHandler(async (req, res) => {
  await mwasalatAdminChatService.markRead(req.mwasalatUser, req.params.userId);
  successResponse(res, 'Marked as read');
});

export const mwasalatAdminChatController = { listInbox, getThread, sendMessage, markRead };
