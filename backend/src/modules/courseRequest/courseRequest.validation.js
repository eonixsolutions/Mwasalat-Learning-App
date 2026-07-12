import { body } from 'express-validator';

export const submitRequestSchema = [
  body('courseId').isMongoId().withMessage('Valid course is required'),
  body('type').isIn(['change_course', 'add_course']).withMessage('Invalid request type'),
  body('reason').optional().trim(),
];

export const reviewRequestSchema = [
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('adminNote').optional().trim(),
];
