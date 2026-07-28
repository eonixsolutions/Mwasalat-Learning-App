import { Router } from 'express';
import { mwasalatCategoryController } from './mwasalatCategory.controller.js';
import { mwasalatAuthMiddleware } from '../mwasalatAuth/mwasalatAuth.middleware.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';

const router = Router();

router.use(mwasalatAuthMiddleware.authenticate);

// Any authenticated role — instructors need this for the course-creation category picker.
router.get('/active', mwasalatCategoryController.listActive);

// Super Admin can view the taxonomy; only Platform Admin manages it.
router.get('/', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN, MWASALAT_ROLES.PLATFORM_ADMIN), mwasalatCategoryController.list);

router.use(mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.PLATFORM_ADMIN));
router.post('/ai-suggest', mwasalatCategoryController.suggest);
router.post('/', mwasalatCategoryController.create);
router.patch('/:id', mwasalatCategoryController.update);
router.delete('/:id', mwasalatCategoryController.remove);

export default router;
