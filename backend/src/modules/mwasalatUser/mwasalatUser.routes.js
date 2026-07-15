import { Router } from 'express';
import { mwasalatUserController } from './mwasalatUser.controller.js';
import { mwasalatAuthMiddleware } from '../mwasalatAuth/mwasalatAuth.middleware.js';
import { MWASALAT_ROLES } from './mwasalatUser.constants.js';

const router = Router();

router.use(mwasalatAuthMiddleware.authenticate, mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN));

router.get('/', mwasalatUserController.list);
router.post('/invite-instructor', mwasalatUserController.inviteInstructor);
router.patch('/:id/active', mwasalatUserController.setActive);

export default router;
