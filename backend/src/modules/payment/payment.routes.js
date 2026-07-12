import { Router } from 'express';
import { paymentController } from './payment.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { uploadImage } from '../../middlewares/upload.js';
import { ROLES } from '../../constants/index.js';

const router = Router();

const studentOnly     = [authMiddleware.authenticate, authMiddleware.authorize(ROLES.STUDENT)];
const coordinatorOnly = [authMiddleware.authenticate, authMiddleware.authorize(ROLES.BRANCH_COORDINATOR, ROLES.SUPER_ADMIN)];
const adminOnly       = [authMiddleware.authenticate, authMiddleware.authorize(ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN)];

// Student
router.post('/registration/submit', ...studentOnly, uploadImage.single('receipt'), paymentController.submitProof);
router.get('/my', ...studentOnly, paymentController.getMyPayments);

// Coordinator
router.get('/pending', ...coordinatorOnly, paymentController.getPending);
router.patch('/:id/approve', ...coordinatorOnly, paymentController.approve);
router.patch('/:id/reject', ...coordinatorOnly, paymentController.reject);

// Admin
router.get('/', ...adminOnly, paymentController.getAll);

export default router;
