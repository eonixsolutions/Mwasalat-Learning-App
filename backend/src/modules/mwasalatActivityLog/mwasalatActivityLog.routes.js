import { Router } from 'express';
import { mwasalatActivityLogController } from './mwasalatActivityLog.controller.js';
import { mwasalatAuthMiddleware } from '../mwasalatAuth/mwasalatAuth.middleware.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';

const router = Router();

router.use(mwasalatAuthMiddleware.authenticate, mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN));

router.get('/', mwasalatActivityLogController.list);

export default router;
