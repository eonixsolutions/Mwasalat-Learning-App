import { param, query, body } from 'express-validator';
import { STUDENT_STATUS } from '../../constants/index.js';

export const listSchema = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Limit must be between 1 and 500'),
  query('status')
    .optional()
    .isIn(Object.values(STUDENT_STATUS))
    .withMessage('Invalid status value'),
  query('isApproved')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isApproved must be true or false'),
  query('batch')
    .optional()
    .isMongoId()
    .withMessage('Invalid batch ID'),
];

export const studentIdParamSchema = [
  param('id').isMongoId().withMessage('Invalid student ID'),
];

export const updateStatusSchema = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(Object.values(STUDENT_STATUS))
    .withMessage(`Status must be one of: ${Object.values(STUDENT_STATUS).join(', ')}`),
];

export const assignBatchSchema = [
  param('id').isMongoId().withMessage('Invalid student ID'),
  body('batchId').notEmpty().withMessage('Batch ID is required').isMongoId().withMessage('Invalid batch ID'),
];

export const microsoftEmailSchema = [
  param('id').isMongoId().withMessage('Invalid student ID'),
  body('microsoftEmail')
    .notEmpty().withMessage('Microsoft email is required')
    .isEmail().normalizeEmail().withMessage('Must be a valid email address'),
];

export const updateMeSchema = [
  body('leetcodeUsername')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('LeetCode username must be under 50 characters'),
  body('mentorshipMode')
    .optional()
    .isIn(['online', 'offline'])
    .withMessage('Mode must be online or offline'),
];

export const reEnrollSchema = [
  body('courseId')
    .notEmpty().withMessage('Course is required')
    .isMongoId().withMessage('Invalid course ID'),
  body('branchId')
    .optional({ nullable: true })
    .isMongoId().withMessage('Invalid branch ID'),
  body('location')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 }).withMessage('Location must not exceed 200 characters'),
  body('educationQualification')
    .optional({ nullable: true })
    .isIn(['12th', 'Graduation In Any Stream', 'Post Graduation', 'Other Qualification'])
    .withMessage('Invalid education qualification'),
  body('mentorshipMode')
    .optional()
    .isIn(['online', 'offline'])
    .withMessage('Mode must be online or offline'),
];

export const updateSchema = [
  body('currentWeek')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Week must be at least 1'),
  body('mentorshipMode')
    .optional()
    .isIn(['online', 'offline'])
    .withMessage('Mode must be online or offline'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  body('batch')
    .optional()
    .isMongoId()
    .withMessage('Invalid batch ID'),
  body('registrationFeePaid')
    .optional()
    .isBoolean()
    .withMessage('registrationFeePaid must be boolean'),
];
