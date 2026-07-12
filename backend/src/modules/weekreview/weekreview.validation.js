import { body, param } from 'express-validator';

export const submitDaySchema = [
  body('week').isInt({ min: 1, max: 4 }).withMessage('Week must be between 1 and 4'),
  body('day').isInt({ min: 1, max: 6 }).withMessage('Day must be between 1 and 6'),
];

export const reviewDaySchema = [
  param('id').isMongoId().withMessage('Invalid review ID'),
  param('dayId').isMongoId().withMessage('Invalid day ID'),
  body('status')
    .isIn(['approved', 'corrections_requested'])
    .withMessage('Status must be approved or corrections_requested'),
  body('mentorNote')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Note must not exceed 1000 characters'),
];
