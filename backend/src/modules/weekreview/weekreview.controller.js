import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { weekReviewService } from './weekreview.service.js';

const submitDay = asyncHandler(async (req, res) => {
  const review = await weekReviewService.submitDay(req.user._id, +req.body.week, +req.body.day);
  successResponse(res, `Day ${req.body.day} submitted for review`, review, 201);
});

const reviewDay = asyncHandler(async (req, res) => {
  const result = await weekReviewService.reviewDay(
    req.params.id,
    req.params.dayId,
    { status: req.body.status, mentorNote: req.body.mentorNote },
    req.user._id
  );
  successResponse(res, 'Day reviewed', result);
});

const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await weekReviewService.getMyReviews(req.user._id);
  successResponse(res, 'Reviews fetched', reviews);
});

const listPending = asyncHandler(async (req, res) => {
  const reviews = await weekReviewService.listPending();
  successResponse(res, 'Pending reviews fetched', reviews);
});

const listAll = asyncHandler(async (req, res) => {
  const reviews = await weekReviewService.listAll(req.query);
  successResponse(res, 'Reviews fetched', reviews);
});

const pendingCount = asyncHandler(async (req, res) => {
  const count = await weekReviewService.pendingCount();
  successResponse(res, 'Pending count fetched', { count });
});

export const weekReviewController = { submitDay, reviewDay, getMyReviews, listPending, listAll, pendingCount };
