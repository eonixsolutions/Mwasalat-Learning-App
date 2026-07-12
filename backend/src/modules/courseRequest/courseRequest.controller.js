import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { courseRequestService } from './courseRequest.service.js';
import Student from '../student/student.model.js';

const submitRequest = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw new Error('Student profile not found');

  const request = await courseRequestService.submitRequest({
    userId: req.user._id,
    studentId: student._id,
    courseId: req.body.courseId,
    type: req.body.type,
    reason: req.body.reason,
  });

  successResponse(res, 'Course request submitted', request, 201);
});

const getMyRequests = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  const requests = await courseRequestService.getMyRequests(student._id);
  successResponse(res, 'Requests fetched', requests);
});

const getAllRequests = asyncHandler(async (req, res) => {
  const requests = await courseRequestService.getAllRequests(req.query.status);
  successResponse(res, 'Requests fetched', requests);
});

const reviewRequest = asyncHandler(async (req, res) => {
  const request = await courseRequestService.reviewRequest({
    requestId: req.params.id,
    adminId: req.user._id,
    action: req.body.action,
    adminNote: req.body.adminNote,
  });
  successResponse(res, `Request ${req.body.action}d`, request);
});

export const courseRequestController = {
  submitRequest,
  getMyRequests,
  getAllRequests,
  reviewRequest,
};
