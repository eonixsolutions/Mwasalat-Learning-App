import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware.js';
import { ROLES } from '../../constants/index.js';
import { taskSheetContentController } from './task-sheet-content.controller.js';

const router = Router();

router.use(authMiddleware.authenticate);

const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.TECHNICAL_MENTOR];

// Student: list all published weeks for their course
router.get(
  '/course/:courseId',
  authMiddleware.authorize(ROLES.STUDENT, ...ADMIN_ROLES),
  taskSheetContentController.listPublishedByCourse,
);

// Student: get one published week's full content
router.get(
  '/course/:courseId/week/:week',
  authMiddleware.authorize(ROLES.STUDENT, ...ADMIN_ROLES),
  taskSheetContentController.getPublishedWeek,
);

// Admin: list all weeks for a course
router.get(
  '/admin/course/:courseId',
  authMiddleware.authorize(...ADMIN_ROLES),
  taskSheetContentController.listByCourse,
);

// Admin: get one week for editing (even unpublished)
router.get(
  '/admin/course/:courseId/week/:week',
  authMiddleware.authorize(...ADMIN_ROLES),
  taskSheetContentController.getAdminWeek,
);

// Admin: create or update a week
router.put(
  '/admin/course/:courseId/week/:week',
  authMiddleware.authorize(...ADMIN_ROLES),
  taskSheetContentController.upsertWeek,
);

// Admin: toggle publish
router.patch(
  '/admin/:id/publish',
  authMiddleware.authorize(...ADMIN_ROLES),
  taskSheetContentController.togglePublish,
);

// Admin: delete a week
router.delete(
  '/admin/:id',
  authMiddleware.authorize(...ADMIN_ROLES),
  taskSheetContentController.removeWeek,
);

export default router;
