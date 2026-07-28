import { Router } from 'express';
import { mwasalatActivityLogController } from './mwasalatActivityLog.controller.js';
import { mwasalatAuthMiddleware } from '../mwasalatAuth/mwasalatAuth.middleware.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';

const router = Router();

router.use(mwasalatAuthMiddleware.authenticate);

// The audit log itself is Super Admin's exclusive oversight tool over Platform
// Admin's actions — but "users online" is just a harmless engagement metric
// shown in the shared admin header, not an audit concern.
router.get(
  '/',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatActivityLogController.list
);
router.get(
  '/online-count',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN, MWASALAT_ROLES.PLATFORM_ADMIN),
  mwasalatActivityLogController.onlineCount
);

export default router;
