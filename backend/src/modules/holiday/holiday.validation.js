import { body, param } from 'express-validator';

export const createHolidaySchema = [
  body('date').isISO8601().withMessage('Valid date required'),
  body('name').trim().notEmpty().withMessage('Holiday name is required'),
  body('type').optional().isIn(['public', 'custom']),
];

export const deleteHolidaySchema = [
  param('id').isMongoId().withMessage('Invalid holiday ID'),
];
