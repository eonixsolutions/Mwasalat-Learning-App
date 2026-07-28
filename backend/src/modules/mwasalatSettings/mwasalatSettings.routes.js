import { Router } from 'express';
import { mwasalatSettingsController } from './mwasalatSettings.controller.js';
import { mwasalatAuthMiddleware } from '../mwasalatAuth/mwasalatAuth.middleware.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';

const router = Router();

router.use(mwasalatAuthMiddleware.authenticate);

router.get(
  '/',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN, MWASALAT_ROLES.PLATFORM_ADMIN),
  mwasalatSettingsController.getSettings
);
router.put(
  '/',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.PLATFORM_ADMIN),
  mwasalatSettingsController.updateSettings
);

export default router;
