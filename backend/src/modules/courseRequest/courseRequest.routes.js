import { Router } from 'express';
import { courseRequestController } from './courseRequest.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { submitRequestSchema, reviewRequestSchema } from './courseRequest.validation.js';
import { ROLES } from '../../constants/index.js';

const router = Router();

const auth = authMiddleware.authenticate;
const adminOnly = [auth, authMiddleware.authorize(ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN)];
const studentOnly = [auth, authMiddleware.authorize(ROLES.STUDENT)];

// Student
router.post('/',    ...studentOnly, validate(submitRequestSchema), courseRequestController.submitRequest);
router.get('/my',  ...studentOnly, courseRequestController.getMyRequests);

// Admin
router.get('/',         ...adminOnly, courseRequestController.getAllRequests);
router.patch('/:id/review', ...adminOnly, validate(reviewRequestSchema), courseRequestController.reviewRequest);

export default router;
