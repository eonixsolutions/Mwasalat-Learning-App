import { Router } from 'express';
import { mwasalatNotificationController } from './mwasalatNotification.controller.js';
import { mwasalatAuthMiddleware } from '../mwasalatAuth/mwasalatAuth.middleware.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';

const router = Router();

router.use(mwasalatAuthMiddleware.authenticate);

router.get('/', mwasalatNotificationController.list);
router.get(
  '/admin/sent',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN, MWASALAT_ROLES.PLATFORM_ADMIN),
  mwasalatNotificationController.listSent
);
router.get(
  '/admin/reminders',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN, MWASALAT_ROLES.PLATFORM_ADMIN),
  mwasalatNotificationController.listReminders
);
router.post('/', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.PLATFORM_ADMIN), mwasalatNotificationController.create);
router.post(
  '/instructor',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatNotificationController.sendFromInstructor
);
router.patch('/read-all', mwasalatNotificationController.markAllRead);
router.patch('/:id/read', mwasalatNotificationController.markRead);
router.post('/push/subscribe', mwasalatNotificationController.subscribePush);
router.post('/push/unsubscribe', mwasalatNotificationController.unsubscribePush);

export default router;
