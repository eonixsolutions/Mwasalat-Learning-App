import { reviewService } from './review.service.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';

// ── Student ───────────────────────────────────────────────────────────────────

const getMyReviews = asyncHandler(async (req, res) => {
  const data = await reviewService.getMyReviews(req.user._id);
  successResponse(res, 'Reviews fetched', data);
});

const getEnrollmentReviews = asyncHandler(async (req, res) => {
  const data = await reviewService.getEnrollmentReviews(req.user._id, req.params.studentId);
  successResponse(res, 'Enrollment reviews fetched', data);
});

const getAvailableSlotsForReview = asyncHandler(async (req, res) => {
  const data = await reviewService.getAvailableSlotsForReview(req.user._id, req.params.reviewId);
  successResponse(res, 'Available slots fetched', data);
});

const bookSlot = asyncHandler(async (req, res) => {
  const data = await reviewService.bookSlot(req.user._id, req.params.reviewId, req.body.slotId);
  successResponse(res, 'Slot booked', data);
});

// ── Staff ─────────────────────────────────────────────────────────────────────

const getPendingReviews = asyncHandler(async (req, res) => {
  const data = await reviewService.getPendingReviews(req.user._id);
  successResponse(res, 'Pending reviews fetched', data);
});

const addSlot = asyncHandler(async (req, res) => {
  const data = await reviewService.addSlot(req.user._id, req.body);
  successResponse(res, 'Slot added', data, 201);
});

const getSlots = asyncHandler(async (req, res) => {
  const data = await reviewService.getSlots(req.query.reviewId);
  successResponse(res, 'Slots fetched', data);
});

const updateSlot = asyncHandler(async (req, res) => {
  const data = await reviewService.updateSlot(req.params.slotId, req.user._id, req.body);
  successResponse(res, 'Slot updated', data);
});

const resolveHolidayConflict = asyncHandler(async (req, res) => {
  const data = await reviewService.resolveHolidayConflict(
    req.params.slotId, req.user._id, req.body.action
  );
  successResponse(res, data.action === 'kept' ? 'Slot kept' : 'Slot cancelled', data);
});

const deleteSlot = asyncHandler(async (req, res) => {
  await reviewService.deleteSlot(req.params.slotId, req.user._id);
  successResponse(res, 'Slot deleted', null);
});

const completeReview = asyncHandler(async (req, res) => {
  const data = await reviewService.completeReview(
    req.params.reviewId,
    req.user._id,
    req.body
  );
  successResponse(res, 'Review completed', data);
});

export const reviewController = {
  getMyReviews,
  getEnrollmentReviews,
  getAvailableSlotsForReview,
  bookSlot,
  getPendingReviews,
  addSlot,
  updateSlot,
  getSlots,
  deleteSlot,
  completeReview,
  resolveHolidayConflict,
};
