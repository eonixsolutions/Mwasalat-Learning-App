import { body, param, query } from 'express-validator';

export const bookSlotSchema = [
  param('reviewId').isMongoId().withMessage('Invalid review ID'),
  body('slotId').isMongoId().withMessage('Invalid slot ID'),
];

export const addSlotSchema = [
  body('reviewId').isMongoId().withMessage('Invalid review ID'),
  body('scheduledAt').isISO8601().withMessage('Valid date is required'),
  body('meetingLink').trim().notEmpty().isURL().withMessage('Valid meeting link is required'),
];

export const getSlotsSchema = [
  query('reviewId').isMongoId().withMessage('Invalid review ID'),
];

export const updateSlotSchema = [
  param('slotId').isMongoId().withMessage('Invalid slot ID'),
  body('scheduledAt').isISO8601().withMessage('Valid date is required'),
  body('meetingLink').trim().notEmpty().isURL().withMessage('Valid meeting link is required'),
];

export const completeReviewSchema = [
  param('reviewId').isMongoId().withMessage('Invalid review ID'),
  body('result').isIn(['pass', 'fail']).withMessage('Result must be pass or fail'),
  body('marks').optional({ nullable: true }).isFloat({ min: 0, max: 10 }).withMessage('Marks must be between 0 and 10'),
  body('remarks').optional({ checkFalsy: true }).trim(),
  body('pendingTopics').optional().isArray(),
];
