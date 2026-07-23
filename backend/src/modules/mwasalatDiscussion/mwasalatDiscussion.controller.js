import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { mwasalatDiscussionService } from './mwasalatDiscussion.service.js';

const listThreads = asyncHandler(async (req, res) => {
  const result = await mwasalatDiscussionService.listThreads(req.params.programId, req.mwasalatUser);
  successResponse(res, 'Discussion threads fetched', result);
});

const createThread = asyncHandler(async (req, res) => {
  const thread = await mwasalatDiscussionService.createThread(req.params.programId, req.mwasalatUser, req.body);
  successResponse(res, 'Question posted', thread, 201);
});

const getThread = asyncHandler(async (req, res) => {
  const result = await mwasalatDiscussionService.getThread(req.params.threadId, req.mwasalatUser);
  successResponse(res, 'Question fetched', result);
});

const addReply = asyncHandler(async (req, res) => {
  const reply = await mwasalatDiscussionService.addReply(req.params.threadId, req.mwasalatUser, req.body.body);
  successResponse(res, 'Reply posted', reply, 201);
});

const deleteThread = asyncHandler(async (req, res) => {
  await mwasalatDiscussionService.deleteThread(req.params.threadId, req.mwasalatUser);
  successResponse(res, 'Question deleted');
});

const deleteReply = asyncHandler(async (req, res) => {
  await mwasalatDiscussionService.deleteReply(req.params.replyId, req.mwasalatUser);
  successResponse(res, 'Reply deleted');
});

const togglePin = asyncHandler(async (req, res) => {
  const thread = await mwasalatDiscussionService.togglePin(req.params.threadId, req.mwasalatUser);
  successResponse(res, 'Question updated', thread);
});

const toggleResolved = asyncHandler(async (req, res) => {
  const thread = await mwasalatDiscussionService.toggleResolved(req.params.threadId, req.mwasalatUser);
  successResponse(res, 'Question updated', thread);
});

export const mwasalatDiscussionController = {
  listThreads, createThread, getThread, addReply, deleteThread, deleteReply, togglePin, toggleResolved,
};
