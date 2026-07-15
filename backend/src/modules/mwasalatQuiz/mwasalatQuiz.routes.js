import { Router } from 'express';
import { mwasalatQuizController } from './mwasalatQuiz.controller.js';
import { mwasalatAuthMiddleware } from '../mwasalatAuth/mwasalatAuth.middleware.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';

const router = Router();

router.use(mwasalatAuthMiddleware.authenticate);

router.put(
  '/:programId',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatQuizController.upsertQuiz
);
router.get(
  '/:programId/instructor-view',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatQuizController.getQuizForInstructor
);
router.get(
  '/admin/results',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatQuizController.getAdminResults
);
router.get(
  '/:programId',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.LEARNER),
  mwasalatQuizController.getQuizForLearner
);
router.post(
  '/:programId/submit',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.LEARNER),
  mwasalatQuizController.submitAttempt
);
router.get(
  '/:programId/my-best',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.LEARNER),
  mwasalatQuizController.getMyBestAttempt
);

export default router;
