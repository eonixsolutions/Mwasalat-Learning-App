import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { videoService } from './video.service.js';

const getMyVideos = asyncHandler(async (req, res) => {
  const videos = await videoService.getMyVideos(req.user._id);
  successResponse(res, 'Videos fetched', videos);
});

const listAll = asyncHandler(async (req, res) => {
  const videos = await videoService.listAll(req.query);
  successResponse(res, 'Videos fetched', videos);
});

const create = asyncHandler(async (req, res) => {
  const video = await videoService.create(req.body, req.user._id);
  successResponse(res, 'Video created', video, 201);
});

const update = asyncHandler(async (req, res) => {
  const video = await videoService.update(req.params.id, req.body);
  successResponse(res, 'Video updated', video);
});

const remove = asyncHandler(async (req, res) => {
  await videoService.remove(req.params.id);
  successResponse(res, 'Video deleted', null);
});

export const videoController = { getMyVideos, listAll, create, update, remove };
