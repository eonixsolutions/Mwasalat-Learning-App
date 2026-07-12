import { Router } from 'express';
import { batchController } from './batch.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { ROLES } from '../../constants/index.js';
import { createBatchSchema, updateBatchSchema } from './batch.validation.js';

const router = Router();
const adminOnly = [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN];

router.get('/', authMiddleware.authenticate, batchController.list);

router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate(createBatchSchema),
  batchController.create
);

router.patch(
  '/:id/toggle',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  batchController.toggleActive
);

router.patch(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate(updateBatchSchema),
  batchController.update
);

export default router;
