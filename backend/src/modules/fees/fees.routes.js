import { Router } from 'express';
import { feesController } from './fees.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { uploadImage } from '../../middlewares/upload.js';
import { ROLES } from '../../constants/index.js';
import {
  courseIdParamSchema,
  studentIdParamSchema,
  paymentIdParamSchema,
  installmentParamSchema,
  upsertStructureSchema,
  submitPaymentSchema,
  rejectPaymentSchema,
  feeStatusQuerySchema,
} from './fees.validation.js';

const router = Router();

router.use(authMiddleware.authenticate);

const adminOnly       = [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN];
const staffReviewers  = [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.BRANCH_COORDINATOR, ROLES.TECHNICAL_MENTOR];

// ── Fee Structure (admin) ──────────────────────────────────────────────────────
router.get(
  '/structures',
  authMiddleware.authorize(...adminOnly),
  feesController.getAllStructures
);

router.get(
  '/structures/:courseId',
  authMiddleware.authorize(...adminOnly),
  validate(courseIdParamSchema),
  feesController.getStructureByCourse
);

router.put(
  '/structures/:courseId',
  authMiddleware.authorize(...adminOnly),
  validate([...courseIdParamSchema, ...upsertStructureSchema]),
  feesController.upsertStructure
);

// ── Student: fee account ───────────────────────────────────────────────────────
router.get(
  '/my-account',
  authMiddleware.authorize(ROLES.STUDENT),
  feesController.getMyFeeAccount
);

router.post(
  '/my-account/pay/:installmentNumber',
  authMiddleware.authorize(ROLES.STUDENT),
  uploadImage.single('receipt'),
  validate([...installmentParamSchema, ...submitPaymentSchema]),
  feesController.submitInstallmentPayment
);

// ── Staff: fee overview ────────────────────────────────────────────────────────
router.get(
  '/accounts',
  authMiddleware.authorize(...staffReviewers),
  validate(feeStatusQuerySchema),
  feesController.getAllFeeAccounts
);

router.get(
  '/accounts/:studentId',
  authMiddleware.authorize(...staffReviewers),
  validate(studentIdParamSchema),
  feesController.getFeeAccountByStudent
);

// ── Staff: payment approval ────────────────────────────────────────────────────
router.get(
  '/payments/pending',
  authMiddleware.authorize(...staffReviewers),
  feesController.getPendingInstallmentPayments
);

router.patch(
  '/payments/:paymentId/approve',
  authMiddleware.authorize(...staffReviewers),
  validate(paymentIdParamSchema),
  feesController.approveInstallmentPayment
);

router.patch(
  '/payments/:paymentId/reject',
  authMiddleware.authorize(...staffReviewers),
  validate([...paymentIdParamSchema, ...rejectPaymentSchema]),
  feesController.rejectInstallmentPayment
);

export default router;
