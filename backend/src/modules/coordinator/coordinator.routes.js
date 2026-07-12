import { Router } from 'express';
import { coordinatorController } from './coordinator.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { ROLES } from '../../constants/index.js';
import {
  listSchema,
  coordinatorIdParamSchema,
  rejectSchema,
} from './coordinator.validation.js';

const router = Router();

const adminOnly = [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN];

router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate(listSchema),
  coordinatorController.list
);

router.patch(
  '/:id/approve',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate(coordinatorIdParamSchema),
  coordinatorController.approve
);

router.patch(
  '/:id/reject',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate([...coordinatorIdParamSchema, ...rejectSchema]),
  coordinatorController.reject
);

export default router;
