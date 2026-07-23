import { Router } from 'express';
import { mwasalatProgramController } from './mwasalatProgram.controller.js';
import { mwasalatAuthMiddleware } from '../mwasalatAuth/mwasalatAuth.middleware.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';
import { uploadCourseFiles } from '../../middlewares/upload.js';

const router = Router();

// Public — no auth required
router.get('/public', mwasalatProgramController.listPublic);
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
router.get('/mine', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.listMine);
router.get('/me/summary', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.getMySummary);
router.get('/me/today-schedule', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.getMyTodaySchedule);
router.get('/me/roster', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.getMyRoster);
router.get('/enrolled', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.LEARNER), mwasalatProgramController.listMyEnrollments);
router.patch('/:id/star', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.LEARNER), mwasalatProgramController.toggleStar);
router.post('/:id/enroll', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.LEARNER), mwasalatProgramController.enroll);
router.post('/:id/check-in', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.LEARNER), mwasalatProgramController.checkIn);
router.post('/:id/feedback', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.LEARNER), mwasalatProgramController.submitFeedback);
router.get('/:id/completion', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.LEARNER), mwasalatProgramController.getCompletionStatus);
router.post('/:id/mark-opened', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.LEARNER), mwasalatProgramController.markContentOpened);
router.get('/:id/video-url', mwasalatProgramController.getVideoUrl);
router.post('/:id/video-progress', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.LEARNER), mwasalatProgramController.updateVideoProgress);
router.get('/:id/certificate', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.LEARNER), mwasalatProgramController.getMyCertificate);
router.get('/achievements/me', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.LEARNER), mwasalatProgramController.getMyAchievements);
router.get('/achievements/:learnerId', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.getLearnerAchievements);
router.get('/admin/overview', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.getAdminOverview);
router.get('/admin/certificates', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.listAllCertificates);
router.get('/admin/programs', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.listAllForAdmin);
router.get('/admin/instructor/:instructorId', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.getInstructorDetail);
router.get('/admin/instructors/summary', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.listInstructorSummaries);
router.get('/admin/top-courses', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.getTopCoursesByCompletionRate);
router.get('/admin/upcoming-classes', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.getUpcomingClasses);
router.get('/admin/activity-feed', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.getRecentActivityFeed);
router.get('/:id', mwasalatProgramController.getById);
router.get('/:id/learners', mwasalatProgramController.getLearners);
router.post(
  '/:id/learners/:learnerId/encourage',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN),
  mwasalatProgramController.sendEncouragement
);
router.get('/:id/feedback', mwasalatProgramController.getFeedback);
router.get('/:id/stats', mwasalatProgramController.getStats);
router.get('/:id/attendance', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.getAttendance);
router.post('/:id/attendance/:learnerId', mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.INSTRUCTOR, MWASALAT_ROLES.SUPER_ADMIN), mwasalatProgramController.markAttendance);

export default router;
