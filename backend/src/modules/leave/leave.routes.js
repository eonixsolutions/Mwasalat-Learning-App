import { Router } from 'express';
import { leaveController } from './leave.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { submitLeaveSchema, reviewLeaveSchema } from './leave.validation.js';

const router = Router();

router.use(authMiddleware.authenticate);

router.post('/', authMiddleware.authorize('student'), validate(submitLeaveSchema), leaveController.submitLeave);
router.get('/my', authMiddleware.authorize('student'), leaveController.getMyLeaves);
router.get('/pending', authMiddleware.authorize('branch_coordinator', 'branch_admin', 'super_admin', 'technical_mentor', 'communication_mentor'), leaveController.getPendingLeaves);
router.get('/student/:studentId', authMiddleware.authorize('branch_coordinator', 'branch_admin', 'super_admin', 'technical_mentor', 'communication_mentor'), leaveController.getStudentLeaves);
router.patch('/:id/review', authMiddleware.authorize('branch_coordinator', 'branch_admin', 'super_admin', 'technical_mentor', 'communication_mentor'), validate(reviewLeaveSchema), leaveController.reviewLeave);

export default router;
