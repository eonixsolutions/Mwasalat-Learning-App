import { body, param, query } from 'express-validator';
import { ROLES } from '../../constants/index.js';

const INVITABLE_ROLES = [
  ROLES.BRANCH_ADMIN,
  ROLES.BRANCH_COORDINATOR,
  ROLES.TECHNICAL_MENTOR,
  ROLES.COMMUNICATION_MENTOR,
];

export const createInviteSchema = [
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(INVITABLE_ROLES).withMessage('Invalid role'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail().normalizeEmail().withMessage('Valid email required'),
];

export const listInvitesSchema = [
  query('role').optional().isIn(INVITABLE_ROLES).withMessage('Invalid role'),
  query('isUsed').optional().isIn(['true', 'false']).withMessage('isUsed must be true or false'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

export const listStaffSchema = [
  query('role').optional().isIn(INVITABLE_ROLES).withMessage('Invalid role'),
  query('isApproved').optional().isIn(['true', 'false']).withMessage('isApproved must be true or false'),
  query('isRejected').optional().isIn(['true', 'false']).withMessage('isRejected must be true or false'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

export const inviteIdParamSchema = [
  param('id').isMongoId().withMessage('Invalid invite ID'),
];

export const staffIdParamSchema = [
  param('id').isMongoId().withMessage('Invalid staff ID'),
];

export const staffMicrosoftEmailSchema = [
  param('id').isMongoId().withMessage('Invalid staff ID'),
  body('microsoftEmail')
    .notEmpty().withMessage('Microsoft email is required')
    .isEmail().normalizeEmail().withMessage('Must be a valid email address'),
];

export const manageRolesSchema = [
  param('id').isMongoId().withMessage('Invalid staff ID'),
  body('action').isIn(['add', 'remove']).withMessage('action must be "add" or "remove"'),
  body('role').isIn(INVITABLE_ROLES).withMessage('Invalid role'),
];

export const updateMeSchema = [
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 7, max: 20 }).withMessage('Phone number must be 7–20 characters'),
  body('microsoftEmail')
    .optional({ checkFalsy: true })
    .isEmail().normalizeEmail().withMessage('Must be a valid email address'),
];

export const assignStaffSchema = [
  param('id').isMongoId().withMessage('Invalid staff ID'),
  body('branches')
    .isArray().withMessage('branches must be an array')
    .custom((arr) => arr.every((id) => /^[a-f\d]{24}$/i.test(id)))
    .withMessage('Invalid branch ID in branches'),
  body('batches')
    .isArray().withMessage('batches must be an array')
    .custom((arr) => arr.every((id) => /^[a-f\d]{24}$/i.test(id)))
    .withMessage('Invalid batch ID in batches'),
];
