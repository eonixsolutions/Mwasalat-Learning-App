import { body } from 'express-validator';

export const registerSchema = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[@$!%*#?&^_\-+=<>.,;:'"~`|\\/()\[\]{}]/).withMessage('Password must contain at least one special character'),
  body('phone').notEmpty().withMessage('Phone number is required').isMobilePhone('any').withMessage('Valid phone number required'),
  body('courseId').isMongoId().withMessage('Valid course selection is required'),
  body('branchId').isMongoId().withMessage('Valid branch selection is required'),
  body('educationQualification')
    .isIn(['12th', 'Graduation In Any Stream', 'Post Graduation', 'Other Qualification'])
    .withMessage('Valid education qualification is required'),
  body('mentorshipMode')
    .isIn(['online', 'offline'])
    .withMessage('Mentorship mode must be online or offline'),
  body('location').optional().trim(),
];

export const registerWithInviteSchema = [
  body('token').notEmpty().withMessage('Invite token is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[@$!%*#?&^_\-+=<>.,;:'"~`|\\/()\[\]{}]/).withMessage('Password must contain at least one special character'),
  body('phone').notEmpty().withMessage('Phone number is required').isMobilePhone('any').withMessage('Valid phone number required'),
];

export const loginSchema = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('activeRole').optional().isString().withMessage('Active role must be a string'),
];

export const forgotPasswordSchema = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
];

export const resetPasswordSchema = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

export const changePasswordSchema = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Za-z]/).withMessage('New password must contain at least one letter')
    .matches(/\d/).withMessage('New password must contain at least one number'),
];
