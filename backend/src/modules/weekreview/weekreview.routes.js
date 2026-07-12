import { Router } from 'express';
import { weekReviewController } from './weekreview.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { ROLES } from '../../constants/index.js';
import { submitDaySchema, reviewDaySchema } from './weekreview.validation.js';

const router = Router();

const mentorAndAbove = [
  ROLES.SUPER_ADMIN,
  ROLES.BRANCH_ADMIN,
  ROLES.BRANCH_COORDINATOR,
  ROLES.TECHNICAL_MENTOR,
  ROLES.COMMUNICATION_MENTOR,
];

// ── Student routes ─────────────────────────────────────────────────────────────

router.post(
  '/submit-day',
  authMiddleware.authenticate,
  authMiddleware.authorize(ROLES.STUDENT),
  validate(submitDaySchema),
  weekReviewController.submitDay
);

router.get(
  '/my',
  authMiddleware.authenticate,
  authMiddleware.authorize(ROLES.STUDENT),
  weekReviewController.getMyReviews
);

// ── Staff routes ───────────────────────────────────────────────────────────────

router.get(
  '/pending',
  authMiddleware.authenticate,
  authMiddleware.authorize(...mentorAndAbove),
  weekReviewController.listPending
);

router.get(
  '/pending/count',
  authMiddleware.authenticate,
  authMiddleware.authorize(...mentorAndAbove),
  weekReviewController.pendingCount
);

router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authorize(...mentorAndAbove),
  weekReviewController.listAll
);

router.patch(
  '/:id/days/:dayId/review',
  authMiddleware.authenticate,
  authMiddleware.authorize(...mentorAndAbove),
  validate(reviewDaySchema),
  weekReviewController.reviewDay
);

export default router;
