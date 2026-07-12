import { body, param, query } from 'express-validator';

export const courseIdParamSchema = [
  param('courseId').isMongoId().withMessage('Invalid course ID'),
];

export const studentIdParamSchema = [
  param('studentId').isMongoId().withMessage('Invalid student ID'),
];

export const paymentIdParamSchema = [
  param('paymentId').isMongoId().withMessage('Invalid payment ID'),
];

export const installmentParamSchema = [
  param('installmentNumber').isInt({ min: 1 }).withMessage('Invalid installment number'),
];

export const upsertStructureSchema = [
  body('totalFee').isFloat({ min: 0 }).withMessage('Total fee must be a positive number'),
  body('currency').optional().isString(),
  body('notes').optional().isString(),
  body('installments').isArray({ min: 1 }).withMessage('At least one installment is required'),
  body('installments.*.installmentNumber').isInt({ min: 1 }).withMessage('Each installment must have a valid number'),
  body('installments.*.amount').isFloat({ min: 0 }).withMessage('Each installment must have a valid amount'),
  body('installments.*.weeksAccess').isInt({ min: 0 }).withMessage('weeksAccess must be a non-negative integer'),
  body('installments.*.dueAfterDays').optional().isInt({ min: 0 }),
  body('installments.*.label').optional().isString(),
];

export const submitPaymentSchema = [
  body('paymentMethod').isIn(['upi', 'bank_transfer', 'cash', 'other']).withMessage('Invalid payment method'),
  body('transactionId').optional().isString(),
  body('studentNote').optional().isString(),
];

export const rejectPaymentSchema = [
  body('reviewNote').notEmpty().withMessage('Rejection reason is required'),
];

export const feeStatusQuerySchema = [
  query('feeStatus').optional().isIn(['pending', 'partial', 'paid', 'overdue']),
];
