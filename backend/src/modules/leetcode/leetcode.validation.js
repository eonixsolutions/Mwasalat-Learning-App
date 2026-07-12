import { body, param } from 'express-validator';

export const createProblemSchema = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('leetcodeNo').optional().isInt({ min: 1 }).withMessage('LeetCode number must be a positive integer'),
  body('leetcodeUrl').trim().isURL().withMessage('Valid LeetCode URL required'),
  body('list').isIn(['general', 'javascript']).withMessage('List must be general or javascript'),
  body('topic').optional().trim(),
  body('hints').optional().isArray().withMessage('Hints must be an array'),
  body('hints.*').optional().trim().notEmpty(),
  body('order').optional().isInt({ min: 1 }).withMessage('Order must be a positive integer'),
];

export const updateProblemSchema = [
  param('id').isMongoId().withMessage('Invalid problem ID'),
  body('title').optional().trim().notEmpty(),
  body('leetcodeNo').optional().isInt({ min: 1 }),
  body('leetcodeUrl').optional().trim().isURL().withMessage('Valid URL required'),
  body('list').optional().isIn(['general', 'javascript']),
  body('topic').optional().trim(),
  body('hints').optional().isArray(),
  body('hints.*').optional().trim(),
  body('order').optional().isInt({ min: 1 }),
  body('isActive').optional().isBoolean(),
];

export const submitSolutionSchema = [
  body('problemId').isMongoId().withMessage('Invalid problem ID'),
];

export const setUsernameSchema = [
  body('leetcodeUsername').trim().notEmpty().withMessage('LeetCode username is required'),
];

