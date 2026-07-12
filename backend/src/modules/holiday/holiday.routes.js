import { Router } from 'express';
import { holidayController } from './holiday.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { createHolidaySchema, deleteHolidaySchema } from './holiday.validation.js';

const router = Router();

router.use(authMiddleware.authenticate);

router.get('/', holidayController.getHolidays);

router.post(
  '/',
  authMiddleware.authorize('branch_coordinator', 'branch_admin', 'super_admin'),
  validate(createHolidaySchema),
  holidayController.createHoliday
);

router.delete(
  '/:id',
  authMiddleware.authorize('branch_coordinator', 'branch_admin', 'super_admin'),
  validate(deleteHolidaySchema),
  holidayController.deleteHoliday
);

export default router;
