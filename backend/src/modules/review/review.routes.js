import { Router } from 'express';
import { reviewController } from './review.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { ROLES } from '../../constants/index.js';
import {
  bookSlotSchema,
  addSlotSchema,
  updateSlotSchema,
  getSlotsSchema,
  completeReviewSchema,
} from './review.validation.js';

const router = Router();

const allStaff = [
  ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.BRANCH_COORDINATOR,
  ROLES.TECHNICAL_MENTOR, ROLES.COMMUNICATION_MENTOR,
];

// ── Student ───────────────────────────────────────────────────────────────────

// GET /reviews/me
router.get(
  '/me',
  authMiddleware.authenticate,
  authMiddleware.authorize(ROLES.STUDENT),
  reviewController.getMyReviews
);

// GET /reviews/enrollment/:studentId — performance panel for a past enrollment
router.get(
  '/enrollment/:studentId',
  authMiddleware.authenticate,
  authMiddleware.authorize(ROLES.STUDENT),
  reviewController.getEnrollmentReviews
);

// GET /reviews/:reviewId/available-slots
router.get(
  '/:reviewId/available-slots',
  authMiddleware.authenticate,
  authMiddleware.authorize(ROLES.STUDENT),
  reviewController.getAvailableSlotsForReview
);

// PATCH /reviews/:reviewId/book
router.patch(
  '/:reviewId/book',
  authMiddleware.authenticate,
  authMiddleware.authorize(ROLES.STUDENT),
  validate(bookSlotSchema),
  reviewController.bookSlot
);

// ── Staff ─────────────────────────────────────────────────────────────────────

// GET /reviews/pending
router.get(
  '/pending',
  authMiddleware.authenticate,
  authMiddleware.authorize(...allStaff),
  reviewController.getPendingReviews
);

// GET /reviews/slots?courseId=&reviewType=&section=
router.get(
  '/slots',
  authMiddleware.authenticate,
  authMiddleware.authorize(...allStaff),
  validate(getSlotsSchema),
  reviewController.getSlots
);

// POST /reviews/slots
router.post(
  '/slots',
  authMiddleware.authenticate,
  authMiddleware.authorize(
    ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.BRANCH_COORDINATOR, ROLES.TECHNICAL_MENTOR
  ),
  validate(addSlotSchema),
  reviewController.addSlot
);

// PATCH /reviews/slots/:slotId
router.patch(
  '/slots/:slotId',
  authMiddleware.authenticate,
  authMiddleware.authorize(
    ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.BRANCH_COORDINATOR, ROLES.TECHNICAL_MENTOR
  ),
  validate(updateSlotSchema),
  reviewController.updateSlot
);

// PATCH /reviews/slots/:slotId/resolve-conflict
router.patch(
  '/slots/:slotId/resolve-conflict',
  authMiddleware.authenticate,
  authMiddleware.authorize(
    ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.BRANCH_COORDINATOR, ROLES.TECHNICAL_MENTOR
  ),
  reviewController.resolveHolidayConflict
);

// DELETE /reviews/slots/:slotId
router.delete(
  '/slots/:slotId',
  authMiddleware.authenticate,
  authMiddleware.authorize(
    ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.BRANCH_COORDINATOR, ROLES.TECHNICAL_MENTOR
  ),
  reviewController.deleteSlot
);

// PATCH /reviews/:reviewId/complete
router.patch(
  '/:reviewId/complete',
  authMiddleware.authenticate,
  authMiddleware.authorize(ROLES.SUPER_ADMIN, ROLES.TECHNICAL_MENTOR),
  validate(completeReviewSchema),
  reviewController.completeReview
);

export default router;
