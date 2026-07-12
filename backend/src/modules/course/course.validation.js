import { body } from 'express-validator';

export const createCourseSchema = [
  body('name').trim().notEmpty().withMessage('Course name is required'),
  body('slug')
    .optional()
    .trim()
    .toLowerCase()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('description').optional().trim(),
  body('durationWeeks')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 week'),
];

export const updateCourseSchema = [
  body('name').optional().trim().notEmpty().withMessage('Course name cannot be empty'),
  body('slug')
    .optional()
    .trim()
    .toLowerCase()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('description').optional().trim(),
  body('durationWeeks')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 week'),
  body('isActive').optional().isBoolean(),
];
