import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { mwasalatAiController } from './mwasalatAi.controller.js';
import { mwasalatAuthMiddleware } from '../mwasalatAuth/mwasalatAuth.middleware.js';
import { MWASALAT_ROLES, MWASALAT_LEARNER_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';

const router = Router();

// All four roles get an assistant, each scoped to their own data —
// mwasalatAi.service.js picks the tool set/system instruction per role
// (Platform Admin gets the same operational tools as Super Admin minus
// revenue/sales/transaction data, matching the finance nav restriction).
router.use(
  mwasalatAuthMiddleware.authenticate,
  mwasalatAuthMiddleware.authorize(
    MWASALAT_ROLES.SUPER_ADMIN, MWASALAT_ROLES.PLATFORM_ADMIN, MWASALAT_ROLES.INSTRUCTOR, ...MWASALAT_LEARNER_ROLES
  )
);

// Costs real Gemini tokens per call, so this gets a much tighter cap than the
// global 1000/15min limiter in app.js — keyed per-user (not shared IP) since
// it's mounted after `authenticate`.
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => String(req.mwasalatUser?._id ?? req.ip),
  message: { success: false, message: 'Too many AI questions — please wait a few minutes.', data: null, error: null },
});

router.post('/ask', aiRateLimiter, mwasalatAiController.ask);

export default router;
