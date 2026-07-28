import { Router } from 'express';
import { mwasalatAssignmentController } from './mwasalatAssignment.controller.js';
import { mwasalatAuthMiddleware } from '../mwasalatAuth/mwasalatAuth.middleware.js';
import { MWASALAT_ROLES, MWASALAT_LEARNER_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';
import { uploadAssignmentSubmission } from '../../middlewares/upload.js';

const router = Router();

router.use(mwasalatAuthMiddleware.authenticate);

router.put(
  '/:programId',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatAssignmentController.upsertAssignment
);
router.get(
  '/:programId/instructor-view',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatAssignmentController.getAssignmentForInstructor
);
router.get(
  '/:programId/submissions',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatAssignmentController.listSubmissionsForInstructor
);
router.patch(
  '/submissions/:submissionId/grade',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatAssignmentController.gradeSubmission
);
router.get(
  '/:programId/my-submissions',
  mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES),
  mwasalatAssignmentController.getMySubmissions
);
router.post(
  '/:programId/submit',
  mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES),
  uploadAssignmentSubmission,
  mwasalatAssignmentController.submitAssignment
);
router.get(
  '/:programId',
  mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES),
  mwasalatAssignmentController.getAssignmentForLearner
);

// --- Modular ("super course") assignment lessons — a module can have more
// than one, so these are keyed by :moduleId/:lessonId together (see
// mwasalatAssignment.service.js, every function now takes optional
// moduleId/lessonId that default to null/legacy). ---
router.put(
  '/:programId/module/:moduleId/lesson/:lessonId',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatAssignmentController.upsertAssignment
);
router.get(
  '/:programId/module/:moduleId/lesson/:lessonId/instructor-view',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatAssignmentController.getAssignmentForInstructor
);
router.get(
  '/:programId/module/:moduleId/lesson/:lessonId/submissions',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatAssignmentController.listSubmissionsForInstructor
);
router.get(
  '/:programId/module/:moduleId/lesson/:lessonId/my-submissions',
  mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES),
  mwasalatAssignmentController.getMySubmissions
);
router.post(
  '/:programId/module/:moduleId/lesson/:lessonId/submit',
  mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES),
  uploadAssignmentSubmission,
  mwasalatAssignmentController.submitAssignment
);
router.get(
  '/:programId/module/:moduleId/lesson/:lessonId',
  mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES),
  mwasalatAssignmentController.getAssignmentForLearner
);

export default router;
