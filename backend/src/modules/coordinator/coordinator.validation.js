import { param, query, body } from 'express-validator';

export const listSchema = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('isApproved').optional().isIn(['true', 'false']).withMessage('isApproved must be true or false'),
];

export const coordinatorIdParamSchema = [
  param('id').isMongoId().withMessage('Invalid coordinator ID'),
];

export const rejectSchema = [
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),
];
