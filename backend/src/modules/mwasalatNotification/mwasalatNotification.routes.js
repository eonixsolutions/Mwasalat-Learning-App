import { Router } from 'express';
import { mwasalatNotificationController } from './mwasalatNotification.controller.js';
import { mwasalatAuthMiddleware } from '../mwasalatAuth/mwasalatAuth.middleware.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';

const router = Router();

router.use(mwasalatAuthMiddleware.authenticate);

router.get('/', mwasalatNotificationController.list);
router.get('/admin/sent', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN), mwasalatNotificationController.listSent);
router.post('/', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN), mwasalatNotificationController.create);
router.patch('/read-all', mwasalatNotificationController.markAllRead);
router.patch('/:id/read', mwasalatNotificationController.markRead);

export default router;
