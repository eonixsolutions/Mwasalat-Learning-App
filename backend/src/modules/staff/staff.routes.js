import { Router } from 'express';
import { staffController } from './staff.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { ROLES } from '../../constants/index.js';
import {
  createInviteSchema,
  listInvitesSchema,
  listStaffSchema,
  inviteIdParamSchema,
  staffIdParamSchema,
  assignStaffSchema,
  manageRolesSchema,
  staffMicrosoftEmailSchema,
  updateMeSchema,
} from './staff.validation.js';

const router = Router();

const adminOnly = [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN];

// Own profile (any authenticated staff)
router.get(
  '/me',
  authMiddleware.authenticate,
  staffController.getMe
);

router.patch(
  '/me',
  authMiddleware.authenticate,
  validate(updateMeSchema),
  staffController.updateMe
);

router.get(
  '/me/students',
  authMiddleware.authenticate,
  staffController.getMyStudents
);

router.get(
  '/me/courses',
  authMiddleware.authenticate,
  staffController.getMyCourses
);

// Staff list
router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate(listStaffSchema),
  staffController.listStaff
);

// Invites
router.post(
  '/invites',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate(createInviteSchema),
  staffController.createInvite
);

router.get(
  '/invites',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate(listInvitesSchema),
  staffController.listInvites
);

router.patch(
  '/invites/:id/revoke',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate(inviteIdParamSchema),
  staffController.revokeInvite
);

router.patch(
  '/:id/approve',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate(staffIdParamSchema),
  staffController.approveStaff
);

router.patch(
  '/:id/reject',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate(staffIdParamSchema),
  staffController.rejectStaff
);

router.patch(
  '/:id/assign',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate(assignStaffSchema),
  staffController.assignStaff
);

router.patch(
  '/:id/roles',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate(manageRolesSchema),
  staffController.manageRoles
);

router.patch(
  '/:id/microsoft-email',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate(staffMicrosoftEmailSchema),
  staffController.setMicrosoftEmail
);

export default router;
