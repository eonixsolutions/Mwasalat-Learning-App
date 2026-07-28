import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { mwasalatProgramService } from './mwasalatProgram.service.js';

const aiAutofill = asyncHandler(async (req, res) => {
  const suggestion = await mwasalatProgramService.aiAutofill(req.body.title);
  successResponse(res, 'Suggestion generated', suggestion);
});

const createLiveMeeting = asyncHandler(async (req, res) => {
  const meeting = await mwasalatProgramService.createLiveMeeting(req.body);
  successResponse(res, 'Zoom meeting created', meeting, 201);
});

const create = asyncHandler(async (req, res) => {
  const pdfFiles = req.files?.pdfFile ?? [];
  const videoFile = req.files?.videoFile?.[0];
  const program = await mwasalatProgramService.create(req.mwasalatUser._id, req.body, pdfFiles, videoFile, req.mwasalatUser);
  successResponse(res, 'Program created', program, 201);
});

const update = asyncHandler(async (req, res) => {
  const program = await mwasalatProgramService.update(req.mwasalatUser._id, req.mwasalatUser.role, req.params.id, req.body, req.mwasalatUser);
  successResponse(res, 'Program updated', program);
});

const remove = asyncHandler(async (req, res) => {
  const program = await mwasalatProgramService.remove(req.mwasalatUser._id, req.mwasalatUser.role, req.params.id, req.mwasalatUser);
  successResponse(res, 'Course deletion scheduled', program);
});

const cancelScheduledDeletion = asyncHandler(async (req, res) => {
  const program = await mwasalatProgramService.cancelScheduledDeletion(req.mwasalatUser._id, req.mwasalatUser.role, req.params.id, req.mwasalatUser);
  successResponse(res, 'Scheduled deletion cancelled', program);
});

const listMine = asyncHandler(async (req, res) => {
  const programs = await mwasalatProgramService.listMine(req.mwasalatUser._id);
  successResponse(res, 'Programs fetched', programs);
});

const listPublic = asyncHandler(async (req, res) => {
  const programs = await mwasalatProgramService.listPublic(req.mwasalatUser);
  successResponse(res, 'Programs fetched', programs);
});

const enroll = asyncHandler(async (req, res) => {
  const enrollment = await mwasalatProgramService.enroll(
    req.mwasalatUser._id, req.mwasalatUser.role, req.params.id, req.mwasalatUser.department
  );
  successResponse(res, 'Enrolled successfully', enrollment, 201);
});

const listMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await mwasalatProgramService.listMyEnrollments(req.mwasalatUser._id);
  successResponse(res, 'Enrollments fetched', enrollments);
});

const approveEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await mwasalatProgramService.approveEnrollment(
    req.mwasalatUser._id, req.mwasalatUser.role, req.params.id, req.params.learnerId
  );
  successResponse(res, 'Enrollment approved', enrollment);
});

const rejectEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await mwasalatProgramService.rejectEnrollment(
    req.mwasalatUser._id, req.mwasalatUser.role, req.params.id, req.params.learnerId, req.body.reason
  );
  successResponse(res, 'Enrollment rejected', enrollment);
});

const toggleStar = asyncHandler(async (req, res) => {
  const result = await mwasalatProgramService.toggleStar(req.mwasalatUser._id, req.params.id);
  successResponse(res, 'Star updated', result);
});

const getById = asyncHandler(async (req, res) => {
  const program = await mwasalatProgramService.getById(req.params.id, req.mwasalatUser);
  successResponse(res, 'Program fetched', program);
});

const getLearners = asyncHandler(async (req, res) => {
  const learners = await mwasalatProgramService.getLearners(req.params.id);
  successResponse(res, 'Learners fetched', learners);
});

const getMyRoster = asyncHandler(async (req, res) => {
  const roster = await mwasalatProgramService.getMyRoster(req.mwasalatUser._id);
  successResponse(res, 'Roster fetched', roster);
});

const getFeedback = asyncHandler(async (req, res) => {
  const feedback = await mwasalatProgramService.getFeedback(req.params.id);
  successResponse(res, 'Feedback fetched', feedback);
});

const getStats = asyncHandler(async (req, res) => {
  const stats = await mwasalatProgramService.getStats(req.params.id);
  successResponse(res, 'Stats fetched', stats);
});

const checkIn = asyncHandler(async (req, res) => {
  const attendance = await mwasalatProgramService.checkIn(req.mwasalatUser._id, req.params.id);
  successResponse(res, 'Checked in successfully', attendance, 201);
});

const markAttendance = asyncHandler(async (req, res) => {
  const attendance = await mwasalatProgramService.markAttendance(
    req.mwasalatUser._id, req.mwasalatUser.role, req.params.id, req.params.learnerId
  );
  successResponse(res, 'Attendance recorded', attendance, 201);
});

const getAttendance = asyncHandler(async (req, res) => {
  const attendance = await mwasalatProgramService.getAttendance(req.params.id);
  successResponse(res, 'Attendance fetched', attendance);
});

const completeClass = asyncHandler(async (req, res) => {
  const program = await mwasalatProgramService.completeClass(
    req.mwasalatUser._id, req.mwasalatUser.role, req.params.id, req.body.contentType, req.mwasalatUser
  );
  successResponse(res, 'Class marked as completed', program);
});

const submitFeedback = asyncHandler(async (req, res) => {
  const feedback = await mwasalatProgramService.submitFeedback(req.mwasalatUser._id, req.params.id, req.body);
  successResponse(res, 'Feedback submitted', feedback, 201);
});

const getCompletionStatus = asyncHandler(async (req, res) => {
  const status = await mwasalatProgramService.getCompletionStatus(req.mwasalatUser._id, req.params.id);
  successResponse(res, 'Completion status fetched', status);
});

const markContentOpened = asyncHandler(async (req, res) => {
  const result = await mwasalatProgramService.markContentOpened(req.mwasalatUser._id, req.params.id, req.body.contentType);
  successResponse(res, 'Content marked as opened', result);
});

const getVideoUrl = asyncHandler(async (req, res) => {
  const result = await mwasalatProgramService.getVideoUrl(req.mwasalatUser._id, req.params.id);
  successResponse(res, 'Video URL fetched', result);
});

const updateVideoProgress = asyncHandler(async (req, res) => {
  const result = await mwasalatProgramService.updateVideoProgress(
    req.mwasalatUser._id, req.params.id, req.body.positionSeconds, req.body.durationSeconds
  );
  successResponse(res, 'Progress recorded', result);
});

const getMyCertificate = asyncHandler(async (req, res) => {
  const certificate = await mwasalatProgramService.getMyCertificate(req.mwasalatUser._id, req.params.id);
  successResponse(res, 'Certificate fetched', certificate);
});

const verifyCertificate = asyncHandler(async (req, res) => {
  const result = await mwasalatProgramService.verifyCertificate(req.params.id);
  successResponse(res, 'Certificate verified', result);
});

const getMyAchievements = asyncHandler(async (req, res) => {
  const achievements = await mwasalatProgramService.getAchievements(req.mwasalatUser._id);
  successResponse(res, 'Achievements fetched', achievements);
});

const getLearnerAchievements = asyncHandler(async (req, res) => {
  const achievements = await mwasalatProgramService.getAchievements(req.params.learnerId);
  successResponse(res, 'Achievements fetched', achievements);
});

const getAdminOverview = asyncHandler(async (req, res) => {
  const overview = await mwasalatProgramService.getAdminOverview(req.mwasalatUser);
  successResponse(res, 'Overview fetched', overview);
});

const listAllCertificates = asyncHandler(async (req, res) => {
  const certificates = await mwasalatProgramService.listAllCertificates();
  successResponse(res, 'Certificates fetched', certificates);
});

const listAllForAdmin = asyncHandler(async (req, res) => {
  const programs = await mwasalatProgramService.listAllForAdmin(req.mwasalatUser);
  successResponse(res, 'Programs fetched', programs);
});

const getInstructorDetail = asyncHandler(async (req, res) => {
  const detail = await mwasalatProgramService.getInstructorDetail(req.params.instructorId);
  successResponse(res, 'Instructor detail fetched', detail);
});

const listInstructorSummaries = asyncHandler(async (req, res) => {
  const summaries = await mwasalatProgramService.listInstructorSummaries();
  successResponse(res, 'Instructor summaries fetched', summaries);
});

const getTopCoursesByCompletionRate = asyncHandler(async (req, res) => {
  const courses = await mwasalatProgramService.getTopCoursesByCompletionRate(req.mwasalatUser);
  successResponse(res, 'Top courses fetched', courses);
});

const getUpcomingClasses = asyncHandler(async (req, res) => {
  const classes = await mwasalatProgramService.getUpcomingClasses(req.mwasalatUser);
  successResponse(res, 'Upcoming classes fetched', classes);
});

const getRecentActivityFeed = asyncHandler(async (req, res) => {
  const feed = await mwasalatProgramService.getRecentActivityFeed(Number(req.query.limit) || 8, req.mwasalatUser);
  successResponse(res, 'Activity feed fetched', feed);
});

const getMySummary = asyncHandler(async (req, res) => {
  const detail = await mwasalatProgramService.getInstructorDetail(req.mwasalatUser._id);
  successResponse(res, 'Summary fetched', detail);
});

const getMyTodaySchedule = asyncHandler(async (req, res) => {
  const schedule = await mwasalatProgramService.getMyTodaySchedule(req.mwasalatUser._id);
  successResponse(res, 'Schedule fetched', schedule);
});

const sendEncouragement = asyncHandler(async (req, res) => {
  const result = await mwasalatProgramService.sendEncouragement(
    req.mwasalatUser._id, req.mwasalatUser.role, req.params.id, req.params.learnerId, req.body.templateKey
  );
  successResponse(res, 'Encouragement sent', result);
});

// --- Modular ("super course") modules/lessons ---

const addModule = asyncHandler(async (req, res) => {
  const program = await mwasalatProgramService.addModule(req.mwasalatUser._id, req.mwasalatUser.role, req.params.id, req.body);
  successResponse(res, 'Module added', program, 201);
});

const updateModule = asyncHandler(async (req, res) => {
  const program = await mwasalatProgramService.updateModule(
    req.mwasalatUser._id, req.mwasalatUser.role, req.params.id, req.params.moduleId, req.body
  );
  successResponse(res, 'Module updated', program);
});

const removeModule = asyncHandler(async (req, res) => {
  const program = await mwasalatProgramService.removeModule(
    req.mwasalatUser._id, req.mwasalatUser.role, req.params.id, req.params.moduleId
  );
  successResponse(res, 'Module removed', program);
});

const reorderModules = asyncHandler(async (req, res) => {
  const program = await mwasalatProgramService.reorderModules(
    req.mwasalatUser._id, req.mwasalatUser.role, req.params.id, req.body.orderedModuleIds
  );
  successResponse(res, 'Modules reordered', program);
});

const addLesson = asyncHandler(async (req, res) => {
  const program = await mwasalatProgramService.addLesson(
    req.mwasalatUser._id, req.mwasalatUser.role, req.params.id, req.params.moduleId, req.body, req.file
  );
  successResponse(res, 'Lesson added', program, 201);
});

const updateLesson = asyncHandler(async (req, res) => {
  const program = await mwasalatProgramService.updateLesson(
    req.mwasalatUser._id, req.mwasalatUser.role, req.params.id, req.params.moduleId, req.params.lessonId, req.body, req.file
  );
  successResponse(res, 'Lesson updated', program);
});

const removeLesson = asyncHandler(async (req, res) => {
  const program = await mwasalatProgramService.removeLesson(
    req.mwasalatUser._id, req.mwasalatUser.role, req.params.id, req.params.moduleId, req.params.lessonId
  );
  successResponse(res, 'Lesson removed', program);
});

const reorderLessons = asyncHandler(async (req, res) => {
  const program = await mwasalatProgramService.reorderLessons(
    req.mwasalatUser._id, req.mwasalatUser.role, req.params.id, req.params.moduleId, req.body.orderedLessonIds
  );
  successResponse(res, 'Lessons reordered', program);
});

const getCourseForLearner = asyncHandler(async (req, res) => {
  const course = await mwasalatProgramService.getCourseForLearner(req.mwasalatUser._id, req.params.id);
  successResponse(res, 'Course fetched', course);
});

const markLessonOpened = asyncHandler(async (req, res) => {
  const result = await mwasalatProgramService.markLessonOpened(
    req.mwasalatUser._id, req.params.id, req.params.moduleId, req.params.lessonId
  );
  successResponse(res, 'Lesson marked as opened', result);
});

const updateLessonMediaProgress = asyncHandler(async (req, res) => {
  const result = await mwasalatProgramService.updateLessonMediaProgress(
    req.mwasalatUser._id, req.params.id, req.params.moduleId, req.params.lessonId, req.body.positionSeconds, req.body.durationSeconds
  );
  successResponse(res, 'Progress recorded', result);
});

const getLessonMediaUrl = asyncHandler(async (req, res) => {
  const result = await mwasalatProgramService.getLessonMediaUrl(
    req.mwasalatUser._id, req.params.id, req.params.moduleId, req.params.lessonId
  );
  successResponse(res, 'Media URL fetched', result);
});

export const mwasalatProgramController = {
  aiAutofill, createLiveMeeting, create, update, remove, cancelScheduledDeletion, listMine, listPublic, enroll, listMyEnrollments, toggleStar,
  approveEnrollment, rejectEnrollment,
  getById, getLearners, getMyRoster, getFeedback, getStats, checkIn, markAttendance, getAttendance,
  completeClass,
  submitFeedback, getCompletionStatus, markContentOpened, getMyCertificate, verifyCertificate,
  getVideoUrl, updateVideoProgress, sendEncouragement,
  getMyAchievements, getLearnerAchievements, getAdminOverview, listAllCertificates, listAllForAdmin,
  getInstructorDetail, listInstructorSummaries, getMySummary, getMyTodaySchedule,
  getTopCoursesByCompletionRate, getUpcomingClasses, getRecentActivityFeed,
  addModule, updateModule, removeModule, reorderModules,
  addLesson, updateLesson, removeLesson, reorderLessons,
  getCourseForLearner, markLessonOpened, updateLessonMediaProgress, getLessonMediaUrl,
};
