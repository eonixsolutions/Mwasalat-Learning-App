import { body, param } from 'express-validator';

export const createBranchSchema = [
  body('name').trim().notEmpty().withMessage('Branch name is required'),
  body('code')
    .trim()
    .notEmpty().withMessage('Branch code is required')
    .matches(/^[A-Z0-9]+$/i).withMessage('Code must be alphanumeric (no spaces)'),
  body('location').optional().trim(),
  body('address').optional().trim(),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^(\+91[\s-]?)?[6-9]\d{9}$/)
    .withMessage('Enter a valid 10-digit Indian mobile number (e.g. 9876543210 or +91 9876543210)'),
];

export const updateBranchSchema = [
  param('id').isMongoId().withMessage('Invalid branch ID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('location').optional().trim(),
  body('address').optional().trim(),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^(\+91[\s-]?)?[6-9]\d{9}$/)
    .withMessage('Enter a valid 10-digit Indian mobile number (e.g. 9876543210 or +91 9876543210)'),
];
