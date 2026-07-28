import { Router } from 'express';
import { mwasalatDepartmentController } from './mwasalatDepartment.controller.js';
import { mwasalatAuthMiddleware } from '../mwasalatAuth/mwasalatAuth.middleware.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';
import { validate } from '../../middlewares/validate.js';
import { createDepartmentSchema, updateDepartmentSchema } from './mwasalatDepartment.validation.js';

const router = Router();

router.use(mwasalatAuthMiddleware.authenticate);

// Any authenticated staff role needs this for department pickers (invite forms, profile, etc).
router.get('/active', mwasalatDepartmentController.listActive);

router.get('/', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN, MWASALAT_ROLES.PLATFORM_ADMIN), mwasalatDepartmentController.list);

router.use(mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.PLATFORM_ADMIN));
router.post('/', validate(createDepartmentSchema), mwasalatDepartmentController.create);
router.patch('/:id', validate(updateDepartmentSchema), mwasalatDepartmentController.update);
router.delete('/:id', mwasalatDepartmentController.remove);

export default router;
