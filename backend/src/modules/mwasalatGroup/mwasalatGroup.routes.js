import { Router } from 'express';
import { mwasalatGroupController } from './mwasalatGroup.controller.js';
import { mwasalatAuthMiddleware } from '../mwasalatAuth/mwasalatAuth.middleware.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';
import { validate } from '../../middlewares/validate.js';
import { createGroupSchema, updateGroupSchema } from './mwasalatGroup.validation.js';

const router = Router();

router.use(mwasalatAuthMiddleware.authenticate);

const manageRoles = mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN, MWASALAT_ROLES.PLATFORM_ADMIN, MWASALAT_ROLES.DEPARTMENT_ADMIN);

router.get('/active', manageRoles, mwasalatGroupController.listActive);
router.get('/', manageRoles, mwasalatGroupController.list);
router.post('/', manageRoles, validate(createGroupSchema), mwasalatGroupController.create);
router.patch('/:id', manageRoles, validate(updateGroupSchema), mwasalatGroupController.update);
router.delete('/:id', manageRoles, mwasalatGroupController.remove);

export default router;
