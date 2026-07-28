import { Router } from 'express';
import { mwasalatProgramController } from './mwasalatProgram.controller.js';
import { mwasalatAuthMiddleware } from '../mwasalatAuth/mwasalatAuth.middleware.js';
import { MWASALAT_ROLES, MWASALAT_LEARNER_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';
import { uploadCourseFiles, uploadLessonFile } from '../../middlewares/upload.js';

const router = Router();

// Public — no auth required, but personalized (audience/department
// filtering) when the caller happens to be logged in — see listPublic().
router.get('/public', mwasalatAuthMiddleware.authenticateOptional, mwasalatProgramController.listPublic);
router.get('/certificates/verify/:id', mwasalatProgramController.verifyCertificate);

router.use(mwasalatAuthMiddleware.authenticate);

router.post('/ai-autofill', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.aiAutofill);
router.post('/live-meeting', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.createLiveMeeting);
router.post(
  '/',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN),
  uploadCourseFiles,
  mwasalatProgramController.create
);
router.patch('/:id', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.update);
router.delete('/:id', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.remove);
router.post('/:id/cancel-deletion', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.cancelScheduledDeletion);

// --- Modular ("super course") modules/lessons — instructor authoring ---
const instructorAuthor = mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN);
router.post('/:id/modules', instructorAuthor, mwasalatProgramController.addModule);
router.patch('/:id/modules/reorder', instructorAuthor, mwasalatProgramController.reorderModules);
router.patch('/:id/modules/:moduleId', instructorAuthor, mwasalatProgramController.updateModule);
router.delete('/:id/modules/:moduleId', instructorAuthor, mwasalatProgramController.removeModule);
router.post('/:id/modules/:moduleId/lessons', instructorAuthor, uploadLessonFile, mwasalatProgramController.addLesson);
router.patch('/:id/modules/:moduleId/lessons/reorder', instructorAuthor, mwasalatProgramController.reorderLessons);
router.patch('/:id/modules/:moduleId/lessons/:lessonId', instructorAuthor, uploadLessonFile, mwasalatProgramController.updateLesson);
router.delete('/:id/modules/:moduleId/lessons/:lessonId', instructorAuthor, mwasalatProgramController.removeLesson);
router.get('/mine', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.listMine);
router.get('/me/summary', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.getMySummary);
router.get('/me/today-schedule', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.getMyTodaySchedule);
router.get('/me/roster', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.getMyRoster);
router.get('/enrolled', mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES), mwasalatProgramController.listMyEnrollments);
router.patch('/:id/star', mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES), mwasalatProgramController.toggleStar);
router.post('/:id/enroll', mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES), mwasalatProgramController.enroll);
router.post('/:id/check-in', mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES), mwasalatProgramController.checkIn);
router.post('/:id/feedback', mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES), mwasalatProgramController.submitFeedback);
router.get('/:id/completion', mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES), mwasalatProgramController.getCompletionStatus);
router.post('/:id/mark-opened', mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES), mwasalatProgramController.markContentOpened);
router.get('/:id/video-url', mwasalatProgramController.getVideoUrl);
router.post('/:id/video-progress', mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES), mwasalatProgramController.updateVideoProgress);

// --- Modular ("super course") modules/lessons — learner progression ---
const learnerAccess = mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES);
router.get('/:id/learn', learnerAccess, mwasalatProgramController.getCourseForLearner);
router.get('/:id/modules/:moduleId/lessons/:lessonId/media-url', mwasalatProgramController.getLessonMediaUrl);
router.post('/:id/modules/:moduleId/lessons/:lessonId/open', learnerAccess, mwasalatProgramController.markLessonOpened);
router.post('/:id/modules/:moduleId/lessons/:lessonId/media-progress', learnerAccess, mwasalatProgramController.updateLessonMediaProgress);
router.get('/:id/certificate', mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES), mwasalatProgramController.getMyCertificate);
router.get('/achievements/me', mwasalatAuthMiddleware.authorize(...MWASALAT_LEARNER_ROLES), mwasalatProgramController.getMyAchievements);
const adminView = mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN, MWASALAT_ROLES.PLATFORM_ADMIN);
// Department Admin's dashboard overview widgets, plus the Programs list now
// that courses carry a real `departments` field (see mwasalatProgram.model.js)
// — scoped in the service layer. Certificates/Instructor-detail admin pages
// stay Super/Platform Admin only for now (out of scope for course targeting).
const adminOverviewView = mwasalatAuthMiddleware.authorize(
  MWASALAT_ROLES.SUPER_ADMIN, MWASALAT_ROLES.PLATFORM_ADMIN, MWASALAT_ROLES.DEPARTMENT_ADMIN
);
router.get('/achievements/:learnerId', adminView, mwasalatProgramController.getLearnerAchievements);
router.get('/admin/overview', adminOverviewView, mwasalatProgramController.getAdminOverview);
router.get('/admin/certificates', adminView, mwasalatProgramController.listAllCertificates);
router.get('/admin/programs', adminOverviewView, mwasalatProgramController.listAllForAdmin);
router.get('/admin/instructor/:instructorId', adminView, mwasalatProgramController.getInstructorDetail);
router.get('/admin/instructors/summary', adminView, mwasalatProgramController.listInstructorSummaries);
router.get('/admin/top-courses', adminOverviewView, mwasalatProgramController.getTopCoursesByCompletionRate);
router.get('/admin/upcoming-classes', adminOverviewView, mwasalatProgramController.getUpcomingClasses);
router.get('/admin/activity-feed', adminOverviewView, mwasalatProgramController.getRecentActivityFeed);
router.get('/:id', mwasalatProgramController.getById);
router.get('/:id/learners', mwasalatProgramController.getLearners);
router.post(
  '/:id/learners/:learnerId/encourage',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatProgramController.sendEncouragement
);
router.post(
  '/:id/learners/:learnerId/approve',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatProgramController.approveEnrollment
);
router.post(
  '/:id/learners/:learnerId/reject',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatProgramController.rejectEnrollment
);
router.get('/:id/feedback', mwasalatProgramController.getFeedback);
router.get('/:id/stats', mwasalatProgramController.getStats);
router.get('/:id/attendance', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.getAttendance);
router.post('/:id/attendance/:learnerId', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.markAttendance);
router.post('/:id/complete-class', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.completeClass);

export default router;
