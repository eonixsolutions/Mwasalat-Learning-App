import { Router } from 'express';
import { branchController } from './branch.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { createBranchSchema, updateBranchSchema } from './branch.validation.js';
import { ROLES } from '../../constants/index.js';

const router = Router();
const adminOnly = [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN];

router.get('/public', branchController.listPublic);

router.get('/',
  authMiddleware.authenticate,
  branchController.list
);

router.post('/',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate(createBranchSchema),
  branchController.create
);

router.patch('/:id',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate(updateBranchSchema),
  branchController.update
);

router.patch('/:id/toggle',
  authMiddleware.authenticate,
  authMiddleware.authorize(ROLES.SUPER_ADMIN),
  branchController.toggleActive
);

export default router;
