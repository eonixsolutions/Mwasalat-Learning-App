import { Router } from 'express';
import { mwasalatQuizController } from './mwasalatQuiz.controller.js';
import { mwasalatAuthMiddleware } from '../mwasalatAuth/mwasalatAuth.middleware.js';
import { MWASALAT_ROLES, MWASALAT_LEARNER_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';

const router = Router();

router.use(mwasalatAuthMiddleware.authenticate);

router.put(
  '/:programId',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatQuizController.upsertQuiz
);
router.post(
  '/:programId/generate',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR),
  mwasalatQuizController.generateQuestions
);
router.get(
  '/:programId/instructor-view',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatQuizController.getQuizForInstructor
);
router.get(
  '/admin/results',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN, MWASALAT_ROLES.PLATFORM_ADMIN),
  mwasalatQuizController.getAdminResults
);
router.get(
  '/:programId',
  mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES),
  mwasalatQuizController.getQuizForLearner
);
router.post(
  '/:programId/submit',
  mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES),
  mwasalatQuizController.submitAttempt
);
router.get(
  '/:programId/my-best',
  mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES),
  mwasalatQuizController.getMyBestAttempt
);

// --- Modular ("super course") per-module quiz — same handlers as above,
// just with an extra :moduleId segment (see mwasalatQuiz.service.js, every
// function now takes an optional moduleId that defaults to null/legacy). ---
router.put(
  '/:programId/module/:moduleId',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatQuizController.upsertQuiz
);
router.get(
  '/:programId/module/:moduleId/instructor-view',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatQuizController.getQuizForInstructor
);
router.get(
  '/:programId/module/:moduleId',
  mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES),
  mwasalatQuizController.getQuizForLearner
);
router.post(
  '/:programId/module/:moduleId/submit',
  mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES),
  mwasalatQuizController.submitAttempt
);
router.get(
  '/:programId/module/:moduleId/my-best',
  mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES),
  mwasalatQuizController.getMyBestAttempt
);

export default router;
