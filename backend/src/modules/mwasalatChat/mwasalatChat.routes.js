import { Router } from 'express';
import { mwasalatChatController } from './mwasalatChat.controller.js';
import { mwasalatAuthMiddleware } from '../mwasalatAuth/mwasalatAuth.middleware.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';

const router = Router();

router.use(mwasalatAuthMiddleware.authenticate);

router.post(
  '/learner/:programId',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.LEARNER),
  mwasalatChatController.getOrCreateAsLearner
);
router.post(
  '/instructor/:programId/:learnerId',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatChatController.getOrCreateAsInstructor
);
router.get('/', mwasalatChatController.listMyConversations);
router.get('/:conversationId/messages', mwasalatChatController.getMessages);
router.post('/:conversationId/messages', mwasalatChatController.sendMessage);
router.patch('/:conversationId/read', mwasalatChatController.markRead);

export default router;
