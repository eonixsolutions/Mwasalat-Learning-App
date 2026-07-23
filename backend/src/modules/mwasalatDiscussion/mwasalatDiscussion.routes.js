import { Router } from 'express';
import { mwasalatDiscussionController } from './mwasalatDiscussion.controller.js';
import { mwasalatAuthMiddleware } from '../mwasalatAuth/mwasalatAuth.middleware.js';

const router = Router();

router.use(mwasalatAuthMiddleware.authenticate);

router.get('/programs/:programId/threads', mwasalatDiscussionController.listThreads);
router.post('/programs/:programId/threads', mwasalatDiscussionController.createThread);
router.get('/threads/:threadId', mwasalatDiscussionController.getThread);
router.post('/threads/:threadId/replies', mwasalatDiscussionController.addReply);
router.delete('/threads/:threadId', mwasalatDiscussionController.deleteThread);
router.patch('/threads/:threadId/pin', mwasalatDiscussionController.togglePin);
router.patch('/threads/:threadId/resolve', mwasalatDiscussionController.toggleResolved);
router.delete('/replies/:replyId', mwasalatDiscussionController.deleteReply);

export default router;
