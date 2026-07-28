import { Router } from 'express';
import { mwasalatAdminChatController } from './mwasalatAdminChat.controller.js';
import { mwasalatAuthMiddleware } from '../mwasalatAuth/mwasalatAuth.middleware.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';

const router = Router();

router.use(
  mwasalatAuthMiddleware.authenticate,
  mwasalatAuthMiddleware.authorize(
    MWASALAT_ROLES.SUPER_ADMIN,
    MWASALAT_ROLES.PLATFORM_ADMIN,
    MWASALAT_ROLES.DEPARTMENT_ADMIN,
    MWASALAT_ROLES.INSTRUCTOR,
    MWASALAT_ROLES.SUPERVISOR,
    MWASALAT_ROLES.IT_SUPPORT
  )
);

router.get('/', mwasalatAdminChatController.listInbox);
router.get('/:userId/messages', mwasalatAdminChatController.getThread);
router.post('/:userId/messages', mwasalatAdminChatController.sendMessage);
router.patch('/:userId/read', mwasalatAdminChatController.markRead);

export default router;
