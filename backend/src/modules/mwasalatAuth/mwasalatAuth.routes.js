import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { mwasalatAuthController } from './mwasalatAuth.controller.js';
import { mwasalatAuthMiddleware } from './mwasalatAuth.middleware.js';
import { uploadAvatar } from '../../middlewares/upload.js';
import { validate } from '../../middlewares/validate.js';
import { requireSpaHeader } from '../../middlewares/csrfHeaderGuard.js';
import {
  registerSchema, loginSchema, googleLoginSchema, updateProfileSchema, changePasswordSchema,
  setPasswordSchema, forgotPasswordSchema, resetPasswordSchema, verifyTwoFactorLoginSchema,
  enableTwoFactorSchema, disableTwoFactorSchema, resetExpiredPasswordSchema,
} from './mwasalatAuth.validation.js';

const router = Router();

// Pre-auth, IP-keyed limiter for the endpoints bots/abusers actually hit
// (captcha token farming, mass registration, forgot-password email bombing).
const publicAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.ip,
  message: { success: false, message: 'Too many requests. Please try again later.', data: null, error: null },
});

router.get('/captcha', publicAuthLimiter, mwasalatAuthController.getCaptcha);
router.post('/register', publicAuthLimiter, validate(registerSchema), mwasalatAuthController.register);
router.post('/login', validate(loginSchema), mwasalatAuthController.login);
router.post('/oauth/google', validate(googleLoginSchema), mwasalatAuthController.googleLogin);
router.get('/me', mwasalatAuthMiddleware.authenticate, mwasalatAuthController.getMe);
router.patch('/me', mwasalatAuthMiddleware.authenticate, uploadAvatar, validate(updateProfileSchema), mwasalatAuthController.updateProfile);
router.post('/change-password', mwasalatAuthMiddleware.authenticate, validate(changePasswordSchema), mwasalatAuthController.changePassword);
router.get('/invite/:token', mwasalatAuthController.verifyInvitation);
router.post('/invite/:token/set-password', validate(setPasswordSchema), mwasalatAuthController.setPassword);
router.post('/forgot-password', publicAuthLimiter, validate(forgotPasswordSchema), mwasalatAuthController.forgotPassword);
router.post('/reset-password', publicAuthLimiter, validate(resetPasswordSchema), mwasalatAuthController.resetPassword);

router.post('/2fa/verify', publicAuthLimiter, validate(verifyTwoFactorLoginSchema), mwasalatAuthController.verifyTwoFactorLogin);
router.post('/password-expired/reset', publicAuthLimiter, validate(resetExpiredPasswordSchema), mwasalatAuthController.resetExpiredPassword);
router.post('/2fa/setup', mwasalatAuthMiddleware.authenticate, mwasalatAuthController.setupTwoFactor);
router.post('/2fa/enable', mwasalatAuthMiddleware.authenticate, validate(enableTwoFactorSchema), mwasalatAuthController.enableTwoFactor);
router.post('/2fa/disable', mwasalatAuthMiddleware.authenticate, validate(disableTwoFactorSchema), mwasalatAuthController.disableTwoFactor);

// Cookie-authenticated (no Bearer header) — CSRF-guarded by the SPA header check
// instead of mwasalatAuthMiddleware.authenticate, since the whole point of these
// two is to work without (refresh) or independently of (logout) an access token.
router.post('/refresh', publicAuthLimiter, requireSpaHeader, mwasalatAuthController.refresh);
router.post('/logout', requireSpaHeader, mwasalatAuthController.logout);

export default router;
