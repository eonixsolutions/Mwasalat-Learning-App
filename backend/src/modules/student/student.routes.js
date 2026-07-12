import { Router } from 'express';
import { studentController } from './student.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { uploadImage } from '../../middlewares/upload.js';
import { ROLES } from '../../constants/index.js';
import {
  listSchema,
  studentIdParamSchema,
  updateStatusSchema,
  updateSchema,
  updateMeSchema,
  assignBatchSchema,
  microsoftEmailSchema,
  reEnrollSchema,
} from './student.validation.js';

const router = Router();

const allStaff = [
  ROLES.SUPER_ADMIN,
  ROLES.BRANCH_ADMIN,
  ROLES.BRANCH_COORDINATOR,
  ROLES.TECHNICAL_MENTOR,
  ROLES.COMMUNICATION_MENTOR,
];

// Coordinators + admins can approve and change status
const coordinatorAndAbove = [
  ROLES.SUPER_ADMIN,
  ROLES.BRANCH_ADMIN,
  ROLES.BRANCH_COORDINATOR,
];

// Only admins can do structural updates (week, batch, fee)
const adminOnly = [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN];

// Can view academic summary: mentors + admins + coordinators (not comm-mentor)
const academicViewers = [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.TECHNICAL_MENTOR, ROLES.BRANCH_COORDINATOR];

router.get(
  '/me',
  authMiddleware.authenticate,
  authMiddleware.authorize(ROLES.STUDENT),
  studentController.getMe
);

router.patch(
  '/me',
  authMiddleware.authenticate,
  authMiddleware.authorize(ROLES.STUDENT),
  validate(updateMeSchema),
  studentController.updateMe
);

router.get(
  '/me/enrollments',
  authMiddleware.authenticate,
  authMiddleware.authorize(ROLES.STUDENT),
  studentController.getMyEnrollments
);

router.post(
  '/me/re-enroll',
  authMiddleware.authenticate,
  authMiddleware.authorize(ROLES.STUDENT),
  uploadImage.single('receipt'),
  validate(reEnrollSchema),
  studentController.requestReEnrollment
);

router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authorize(...allStaff),
  validate(listSchema),
  studentController.list
);

router.get(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.authorize(...allStaff),
  validate(studentIdParamSchema),
  studentController.getById
);

router.get(
  '/:id/academic-summary',
  authMiddleware.authenticate,
  authMiddleware.authorize(...academicViewers),
  validate(studentIdParamSchema),
  studentController.getAcademicSummary
);

router.patch(
  '/:id/approve',
  authMiddleware.authenticate,
  authMiddleware.authorize(...coordinatorAndAbove),
  validate(studentIdParamSchema),
  studentController.approve
);

router.patch(
  '/:id/status',
  authMiddleware.authenticate,
  authMiddleware.authorize(...coordinatorAndAbove),
  validate([...studentIdParamSchema, ...updateStatusSchema]),
  studentController.updateStatus
);

router.patch(
  '/:id/batch',
  authMiddleware.authenticate,
  authMiddleware.authorize(...coordinatorAndAbove),
  validate(assignBatchSchema),
  studentController.assignBatch
);

router.patch(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate([...studentIdParamSchema, ...updateSchema]),
  studentController.update
);

router.patch(
  '/:id/microsoft-email',
  authMiddleware.authenticate,
  authMiddleware.authorize(...coordinatorAndAbove),
  validate(microsoftEmailSchema),
  studentController.setMicrosoftEmail
);

router.post(
  '/:id/provision-task-sheet',
  authMiddleware.authenticate,
  authMiddleware.authorize(...coordinatorAndAbove),
  validate(studentIdParamSchema),
  studentController.provisionTaskSheet
);

router.post(
  '/:id/reset-task-sheet',
  authMiddleware.authenticate,
  authMiddleware.authorize(ROLES.SUPER_ADMIN),
  validate(studentIdParamSchema),
  studentController.resetTaskSheet
);

router.post(
  '/:id/reshare-task-sheet',
  authMiddleware.authenticate,
  authMiddleware.authorize(...coordinatorAndAbove),
  validate(studentIdParamSchema),
  studentController.reshareTaskSheet
);

export default router;
