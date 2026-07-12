import { body, param, query } from 'express-validator';

export const markAttendanceSchema = [
  body('studentId')
    .notEmpty().withMessage('Student ID is required')
    .isMongoId().withMessage('Invalid student ID'),
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Date must be a valid ISO 8601 date'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['present', 'half_day', 'absent', 'excused']).withMessage('Invalid status'),
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Note must not exceed 500 characters'),
];

export const dateParamSchema = [
  param('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Date must be a valid ISO 8601 date'),
];

export const studentIdParamSchema = [
  param('studentId')
    .isMongoId().withMessage('Invalid student ID'),
];

export const dateRangeQuerySchema = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('startDate must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('endDate must be a valid ISO 8601 date'),
];
