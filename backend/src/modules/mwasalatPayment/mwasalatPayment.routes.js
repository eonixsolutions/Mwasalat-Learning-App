import { Router } from 'express';
import { mwasalatPaymentController } from './mwasalatPayment.controller.js';
import { mwasalatAuthMiddleware } from '../mwasalatAuth/mwasalatAuth.middleware.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';

const router = Router();

// Note: the webhook route itself is mounted separately in app.js with a raw
// body parser (Stripe signature verification needs the unparsed request body)
router.post(
  '/checkout/:programId',
  mwasalatAuthMiddleware.authenticate,
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.LEARNER),
  mwasalatPaymentController.createCheckoutSession
);

router.post(
  '/confirm/:sessionId',
  mwasalatAuthMiddleware.authenticate,
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.LEARNER),
  mwasalatPaymentController.confirmSession
);

router.get(
  '/admin/transactions',
  mwasalatAuthMiddleware.authenticate,
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatPaymentController.listTransactions
);

router.get(
  '/admin/summary',
  mwasalatAuthMiddleware.authenticate,
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatPaymentController.getRevenueSummary
);

router.get(
  '/admin/sales-report',
  mwasalatAuthMiddleware.authenticate,
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatPaymentController.getSalesReport
);

router.get(
  '/admin/sales-report/transactions',
  mwasalatAuthMiddleware.authenticate,
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatPaymentController.listReportTransactions
);

export default router;
