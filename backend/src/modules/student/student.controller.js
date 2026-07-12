import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { studentService } from './student.service.js';
import { AppError } from '../../utils/AppError.js';

const getMe = asyncHandler(async (req, res) => {
  const student = await studentService.getMyProfile(req.user._id);
  successResponse(res, 'Student profile fetched', student);
});

const updateMe = asyncHandler(async (req, res) => {
  const student = await studentService.updateMyProfile(req.user._id, req.body);
  successResponse(res, 'Profile updated', student);
});

const list = asyncHandler(async (req, res) => {
  const { status, isApproved, batch, page, limit } = req.query;
  const result = await studentService.listStudents({
    status,
    isApproved,
    batch,
    page: +page || 1,
    limit: +limit || 20,
  });
  successResponse(res, 'Students fetched', result);
});

const getById = asyncHandler(async (req, res) => {
  const student = await studentService.getStudentById(req.params.id);
  successResponse(res, 'Student fetched', student);
});

const approve = asyncHandler(async (req, res) => {
  const student = await studentService.approveStudent(req.params.id, req.user._id);
  successResponse(res, 'Student approved successfully', student);
});

const updateStatus = asyncHandler(async (req, res) => {
  const student = await studentService.updateStudentStatus(req.params.id, req.body.status);
  successResponse(res, 'Student status updated', student);
});

const update = asyncHandler(async (req, res) => {
  const student = await studentService.updateStudent(req.params.id, req.body);
  successResponse(res, 'Student updated', student);
});

const assignBatch = asyncHandler(async (req, res) => {
  const student = await studentService.assignBatch(req.params.id, req.body.batchId, req.user);
  successResponse(res, 'Batch assigned', student);
});

const setMicrosoftEmail = asyncHandler(async (req, res) => {
  const student = await studentService.setMicrosoftEmail(req.params.id, req.body.microsoftEmail);
  successResponse(res, 'Microsoft email updated', student);
});

const provisionTaskSheet = asyncHandler(async (req, res) => {
  const student = await studentService.provisionTaskSheet(req.params.id);
  successResponse(res, 'Task sheet provisioned successfully', student);
});

const resetTaskSheet = asyncHandler(async (req, res) => {
  const student = await studentService.resetTaskSheet(req.params.id);
  successResponse(res, 'Task sheet reset', student);
});

const reshareTaskSheet = asyncHandler(async (req, res) => {
  const result = await studentService.reshareTaskSheet(req.params.id);
  successResponse(res, `Task sheet reshared with ${result.shared} mentor(s)${result.failed ? `, ${result.failed} failed` : ''}`, result);
});

const getAcademicSummary = asyncHandler(async (req, res) => {
  const result = await studentService.getAcademicSummary(req.params.id, req.user.role);
  successResponse(res, 'Academic summary fetched', result);
});

const getMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await studentService.getMyEnrollments(req.user._id);
  successResponse(res, 'Enrollment history fetched', enrollments);
});

const requestReEnrollment = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Payment receipt is required', 400);
  const enrollment = await studentService.requestReEnrollment(req.user._id, req.body, req.file);
  successResponse(res, 'Re-enrollment request submitted successfully', enrollment, 201);
});

export const studentController = { getMe, updateMe, list, getById, approve, updateStatus, update, assignBatch, setMicrosoftEmail, provisionTaskSheet, resetTaskSheet, reshareTaskSheet, getAcademicSummary, getMyEnrollments, requestReEnrollment };
