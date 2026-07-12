import { Router } from 'express';
import { notificationController } from './notification.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware.authenticate, notificationController.list);
router.patch('/read-all', authMiddleware.authenticate, notificationController.markAllRead);
router.patch('/:id/read', authMiddleware.authenticate, notificationController.markRead);

export default router;
