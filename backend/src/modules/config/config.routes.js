import { Router } from 'express';
import { configController } from './config.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware.authenticate, configController.getConfig);

export default router;
