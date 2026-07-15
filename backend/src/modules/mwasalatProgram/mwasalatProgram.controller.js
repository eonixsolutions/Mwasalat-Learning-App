import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { mwasalatProgramService } from './mwasalatProgram.service.js';

const aiAutofill = asyncHandler(async (req, res) => {
  const suggestion = await mwasalatProgramService.aiAutofill(req.body.title);
  successResponse(res, 'Suggestion generated', suggestion);
});

const create = asyncHandler(async (req, res) => {
  const pdfFile = req.files?.pdfFile?.[0];
  const videoFile = req.files?.videoFile?.[0];
  const program = await mwasalatProgramService.create(req.mwasalatUser._id, req.body, pdfFile, videoFile, req.mwasalatUser);
  successResponse(res, 'Program created', program, 201);
});

const update = asyncHandler(async (req, res) => {
  const program = await mwasalatProgramService.update(req.mwasalatUser._id, req.mwasalatUser.role, req.params.id, req.body, req.mwasalatUser);
  successResponse(res, 'Program updated', program);
});

const remove = asyncHandler(async (req, res) => {
  const program = await mwasalatProgramService.remove(req.mwasalatUser._id, req.mwasalatUser.role, req.params.id, req.mwasalatUser);
  successResponse(res, 'Program deleted', program);
});

const listMine = asyncHandler(async (req, res) => {
  const programs = await mwasalatProgramService.listMine(req.mwasalatUser._id);
  successResponse(res, 'Programs fetched', programs);
});

const listPublic = asyncHandler(async (req, res) => {
  const programs = await mwasalatProgramService.listPublic();
  successResponse(res, 'Programs fetched', programs);
});

const enroll = asyncHandler(async (req, res) => {
  const enrollment = await mwasalatProgramService.enroll(req.mwasalatUser._id, req.params.id);
  successResponse(res, 'Enrolled successfully', enrollment, 201);
});

const listMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await mwasalatProgramService.listMyEnrollments(req.mwasalatUser._id);
  successResponse(res, 'Enrollments fetched', enrollments);
});

const getById = asyncHandler(async (req, res) => {
  const program = await mwasalatProgramService.getById(req.params.id);
  successResponse(res, 'Program fetched', program);
});

const getLearners = asyncHandler(async (req, res) => {
  const learners = await mwasalatProgramService.getLearners(req.params.id);
  successResponse(res, 'Learners fetched', learners);
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

const getMyAchievements = asyncHandler(async (req, res) => {
  const achievements = await mwasalatProgramService.getAchievements(req.mwasalatUser._id);
  successResponse(res, 'Achievements fetched', achievements);
});

const getLearnerAchievements = asyncHandler(async (req, res) => {
  const achievements = await mwasalatProgramService.getAchievements(req.params.learnerId);
  successResponse(res, 'Achievements fetched', achievements);
});

const getAdminOverview = asyncHandler(async (req, res) => {
  const overview = await mwasalatProgramService.getAdminOverview();
  successResponse(res, 'Overview fetched', overview);
});

const listAllCertificates = asyncHandler(async (req, res) => {
  const certificates = await mwasalatProgramService.listAllCertificates();
  successResponse(res, 'Certificates fetched', certificates);
});

const listAllForAdmin = asyncHandler(async (req, res) => {
  const programs = await mwasalatProgramService.listAllForAdmin();
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

const getMySummary = asyncHandler(async (req, res) => {
  const detail = await mwasalatProgramService.getInstructorDetail(req.mwasalatUser._id);
  successResponse(res, 'Summary fetched', detail);
});

export const mwasalatProgramController = {
  aiAutofill, create, update, remove, listMine, listPublic, enroll, listMyEnrollments,
  getById, getLearners, getFeedback, getStats, checkIn, markAttendance, getAttendance,
  submitFeedback, getCompletionStatus, markContentOpened, getMyCertificate,
  getVideoUrl, updateVideoProgress,
  getMyAchievements, getLearnerAchievements, getAdminOverview, listAllCertificates, listAllForAdmin,
  getInstructorDetail, listInstructorSummaries, getMySummary,
};
