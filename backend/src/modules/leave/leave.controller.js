import { leaveService } from './leave.service.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';

const submitLeave = asyncHandler(async (req, res) => {
  const leave = await leaveService.submitLeave(req.user._id, req.body);
  successResponse(res, 'Leave request submitted', leave, 201);
});

const getMyLeaves = asyncHandler(async (req, res) => {
  const leaves = await leaveService.getMyLeaves(req.user._id);
  successResponse(res, 'Leave requests fetched', leaves);
});

const getPendingLeaves = asyncHandler(async (req, res) => {
  const leaves = await leaveService.getPendingLeaves(req.user._id, req.user.roles);
  successResponse(res, 'Pending leaves fetched', leaves);
});

const reviewLeave = asyncHandler(async (req, res) => {
  const { status, reviewNote } = req.body;
  const leave = await leaveService.reviewLeave(req.params.id, req.user._id, status, reviewNote);
  successResponse(res, `Leave ${status}`, leave);
});

const getStudentLeaves = asyncHandler(async (req, res) => {
  const leaves = await leaveService.getLeavesByStudent(req.params.studentId);
  successResponse(res, 'Student leaves fetched', leaves);
});

export const leaveController = { submitLeave, getMyLeaves, getPendingLeaves, reviewLeave, getStudentLeaves };
