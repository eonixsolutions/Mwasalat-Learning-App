import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { mwasalatChatService } from './mwasalatChat.service.js';

const getOrCreateAsLearner = asyncHandler(async (req, res) => {
  const conversation = await mwasalatChatService.getOrCreateAsLearner(req.mwasalatUser._id, req.params.programId);
  successResponse(res, 'Conversation ready', conversation);
});

const getOrCreateAsInstructor = asyncHandler(async (req, res) => {
  const conversation = await mwasalatChatService.getOrCreateAsInstructor(
    req.mwasalatUser._id, req.params.programId, req.params.learnerId
  );
  successResponse(res, 'Conversation ready', conversation);
});

const listMyConversations = asyncHandler(async (req, res) => {
  const conversations = await mwasalatChatService.listMyConversations(req.mwasalatUser._id);
  successResponse(res, 'Conversations fetched', conversations);
});

const getMessages = asyncHandler(async (req, res) => {
  const result = await mwasalatChatService.getMessages(req.params.conversationId, req.mwasalatUser._id);
  successResponse(res, 'Messages fetched', result);
});

const sendMessage = asyncHandler(async (req, res) => {
  const message = await mwasalatChatService.sendMessage(req.params.conversationId, req.mwasalatUser, req.body.text);
  successResponse(res, 'Message sent', message, 201);
});

const markRead = asyncHandler(async (req, res) => {
  await mwasalatChatService.markRead(req.params.conversationId, req.mwasalatUser._id);
  successResponse(res, 'Marked as read');
});

export const mwasalatChatController = {
  getOrCreateAsLearner, getOrCreateAsInstructor, listMyConversations, getMessages, sendMessage, markRead,
};
