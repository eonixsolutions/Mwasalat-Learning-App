import { param, body } from 'express-validator';

export const createBatchSchema = [
  body('name').trim().notEmpty().withMessage('Batch name is required'),
  body('branch').notEmpty().withMessage('Branch is required').isMongoId().withMessage('Invalid branch ID'),
  body('course').notEmpty().withMessage('Course is required').isMongoId().withMessage('Invalid course ID'),
  body('startDate').notEmpty().withMessage('Start date is required').isISO8601().withMessage('Invalid start date'),
  body('endDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid end date'),
  body('maxStudents').optional().isInt({ min: 1 }).withMessage('Max students must be at least 1'),
];

export const updateBatchSchema = [
  param('id').isMongoId().withMessage('Invalid batch ID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('course').optional().isMongoId().withMessage('Invalid course ID'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date'),
  body('endDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid end date'),
  body('maxStudents').optional().isInt({ min: 1 }).withMessage('Max students must be at least 1'),
];
