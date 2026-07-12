import { Router } from 'express';
import { contactController } from './contact.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { ROLES } from '../../constants/index.js';

const router = Router();

const staffRoles = [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.BRANCH_COORDINATOR];

// Public — anyone on the landing page can submit
router.post('/', contactController.submit);

// Staff only
router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authorize(...staffRoles),
  contactController.getAll
);

router.get(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.authorize(...staffRoles),
  contactController.getById
);

router.patch(
  '/:id/close',
  authMiddleware.authenticate,
  authMiddleware.authorize(...staffRoles),
  contactController.close
);

export default router;
