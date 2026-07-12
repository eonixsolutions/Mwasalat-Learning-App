import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authMiddleware } from './auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { uploadImage } from '../../middlewares/upload.js';
import {
  registerSchema,
  registerWithInviteSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.validation.js';

const router = Router();

router.post('/register', uploadImage.single('receipt'), validate(registerSchema), authController.register);
router.post('/register/staff', validate(registerWithInviteSchema), authController.registerWithInvite);
router.get('/invite/:token', authController.validateInvite);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authMiddleware.authenticate, authController.logout);
router.post('/switch-role', authMiddleware.authenticate, authController.switchRole);
router.post('/refresh-token', authController.refreshToken);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', authMiddleware.authenticate, authController.getMe);
router.post('/change-password', authMiddleware.authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;
