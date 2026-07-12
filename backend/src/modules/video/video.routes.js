import { Router } from 'express';
import { videoController } from './video.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { ROLES } from '../../constants/index.js';
import { createVideoSchema, updateVideoSchema } from './video.validation.js';

const router = Router();

const adminOnly = [ROLES.SUPER_ADMIN];

const staffAndAbove = [
  ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.BRANCH_COORDINATOR,
  ROLES.TECHNICAL_MENTOR, ROLES.COMMUNICATION_MENTOR,
];

// Student: published videos for their enrolled course
router.get(
  '/my',
  authMiddleware.authenticate,
  authMiddleware.authorize(ROLES.STUDENT),
  videoController.getMyVideos
);

// Staff: all videos (optional ?course=<id> filter)
router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authorize(...staffAndAbove),
  videoController.listAll
);

router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate(createVideoSchema),
  videoController.create
);

router.patch(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate(updateVideoSchema),
  videoController.update
);

router.delete(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  videoController.remove
);

export default router;
