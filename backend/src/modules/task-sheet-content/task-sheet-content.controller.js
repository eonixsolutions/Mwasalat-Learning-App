import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { taskSheetContentService } from './task-sheet-content.service.js';

const getPublishedWeek = asyncHandler(async (req, res) => {
  const data = await taskSheetContentService.getPublishedWeek(
    req.params.courseId,
    Number(req.params.week),
  );
  successResponse(res, 'Task sheet fetched', data);
});

const getAdminWeek = asyncHandler(async (req, res) => {
  const data = await taskSheetContentService.getAdminWeek(
    req.params.courseId,
    Number(req.params.week),
  );
  successResponse(res, 'Task sheet fetched', data);
});

const listByCourse = asyncHandler(async (req, res) => {
  const data = await taskSheetContentService.listByCourse(req.params.courseId);
  successResponse(res, 'Task sheets fetched', data);
});

const listPublishedByCourse = asyncHandler(async (req, res) => {
  const data = await taskSheetContentService.listPublishedByCourse(req.params.courseId);
  successResponse(res, 'Published task sheets fetched', data);
});

const upsertWeek = asyncHandler(async (req, res) => {
  const data = await taskSheetContentService.upsertWeek(
    req.params.courseId,
    Number(req.params.week),
    req.body,
    req.user._id,
  );
  successResponse(res, 'Task sheet saved', data);
});

const togglePublish = asyncHandler(async (req, res) => {
  const { isPublished } = req.body;
  const data = await taskSheetContentService.togglePublish(req.params.id, isPublished);
  successResponse(res, `Task sheet ${isPublished ? 'published' : 'unpublished'}`, data);
});

const removeWeek = asyncHandler(async (req, res) => {
  await taskSheetContentService.removeWeek(req.params.id);
  successResponse(res, 'Task sheet deleted', null);
});

export const taskSheetContentController = {
  getPublishedWeek,
  getAdminWeek,
  listByCourse,
  listPublishedByCourse,
  upsertWeek,
  togglePublish,
  removeWeek,
};
