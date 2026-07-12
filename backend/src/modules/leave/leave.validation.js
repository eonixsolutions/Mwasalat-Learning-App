import { body, param } from 'express-validator';

export const submitLeaveSchema = [
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required'),
  body('reason').optional().trim(),
];

export const reviewLeaveSchema = [
  param('id').isMongoId().withMessage('Invalid leave ID'),
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('reviewNote').optional().trim(),
];
