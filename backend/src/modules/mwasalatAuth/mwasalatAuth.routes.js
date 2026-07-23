import { Router } from 'express';
import { mwasalatAuthController } from './mwasalatAuth.controller.js';
import { mwasalatAuthMiddleware } from './mwasalatAuth.middleware.js';
import { uploadAvatar } from '../../middlewares/upload.js';

const router = Router();

router.post('/register', mwasalatAuthController.register);
router.post('/login', mwasalatAuthController.login);
router.post('/oauth/google', mwasalatAuthController.googleLogin);
router.get('/me', mwasalatAuthMiddleware.authenticate, mwasalatAuthController.getMe);
router.patch('/me', mwasalatAuthMiddleware.authenticate, uploadAvatar, mwasalatAuthController.updateProfile);
router.post('/change-password', mwasalatAuthMiddleware.authenticate, mwasalatAuthController.changePassword);
router.get('/invite/:token', mwasalatAuthController.verifyInvitation);
router.post('/invite/:token/set-password', mwasalatAuthController.setPassword);
router.post('/forgot-password', mwasalatAuthController.forgotPassword);
router.post('/reset-password/:token', mwasalatAuthController.resetPassword);

export default router;
