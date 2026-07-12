import { body, param } from 'express-validator';

export const createVideoSchema = [
  body('course').isMongoId().withMessage('Valid course ID required'),
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('week').isInt({ min: 1 }).withMessage('Week must be a positive integer'),
  body('day').optional().isInt({ min: 0, max: 6 }).withMessage('Day must be 0 (extra) or 1–6'),
  body('embedUrl').notEmpty().trim().withMessage('Embed URL is required'),
  body('description').optional().trim(),
  body('duration').optional().trim(),
  body('order').optional().isInt({ min: 0 }),
  body('isPublished').optional().isBoolean(),
];

export const updateVideoSchema = [
  param('id').isMongoId().withMessage('Invalid video ID'),
  body('title').optional().notEmpty().trim(),
  body('week').optional().isInt({ min: 1 }),
  body('day').optional().isInt({ min: 0, max: 6 }),
  body('embedUrl').optional().notEmpty().trim(),
  body('description').optional().trim(),
  body('duration').optional().trim(),
  body('order').optional().isInt({ min: 0 }),
  body('isPublished').optional().isBoolean(),
];
