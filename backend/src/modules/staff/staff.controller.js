import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { staffService } from './staff.service.js';

// ── Invites ──────────────────────────────────────────────────────

const createInvite = asyncHandler(async (req, res) => {
  const { role, email } = req.body;
  const invite = await staffService.createInvite({ role, email, createdBy: req.user._id });
  const link = `${process.env.CLIENT_URL}/register/staff?token=${invite.token}`;
  successResponse(res, 'Invite created', { invite, link }, 201);
});

const listInvites = asyncHandler(async (req, res) => {
  const { role, isUsed, page, limit } = req.query;
  const result = await staffService.listInvites({ role, isUsed, page: +page || 1, limit: +limit || 20 });
  successResponse(res, 'Invites fetched', result);
});

const revokeInvite = asyncHandler(async (req, res) => {
  const invite = await staffService.revokeInvite(req.params.id);
  successResponse(res, 'Invite revoked', invite);
});

// ── Staff ────────────────────────────────────────────────────────

const getMe = asyncHandler(async (req, res) => {
  const staff = await staffService.getMyProfile(req.user._id);
  successResponse(res, 'Profile fetched', staff);
});

const updateMe = asyncHandler(async (req, res) => {
  const staff = await staffService.updateMyProfile(req.user._id, req.body);
  successResponse(res, 'Profile updated', staff);
});

const getMyStudents = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await staffService.getMyStudents(req.user._id, { page: +page || 1, limit: +limit || 50 });
  successResponse(res, 'Students fetched', result);
});

const getMyCourses = asyncHandler(async (req, res) => {
  const result = await staffService.getMyCourses(req.user._id);
  successResponse(res, 'Courses fetched', result);
});

const listStaff = asyncHandler(async (req, res) => {
  const { role, isApproved, isRejected, page, limit } = req.query;
  const result = await staffService.listStaff({ role, isApproved, isRejected, page: +page || 1, limit: +limit || 20 });
  successResponse(res, 'Staff fetched', result);
});

const approveStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.approveStaff(req.params.id, req.user._id);
  successResponse(res, 'Staff member approved', staff);
});

const rejectStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.rejectStaff(req.params.id, req.user._id);
  successResponse(res, 'Staff member rejected', staff);
});

const assignStaff = asyncHandler(async (req, res) => {
  const { branches, batches } = req.body;
  const staff = await staffService.assignStaff(req.params.id, { branches, batches });
  successResponse(res, 'Assignments updated', staff);
});

const manageRoles = asyncHandler(async (req, res) => {
  const { action, role } = req.body;
  const result = await staffService.manageRoles(req.params.id, { action, role });
  successResponse(res, action === 'add' ? 'Role added' : 'Role removed', result);
});

const setMicrosoftEmail = asyncHandler(async (req, res) => {
  const staff = await staffService.setMicrosoftEmail(req.params.id, req.body.microsoftEmail);
  successResponse(res, 'Microsoft email updated', staff);
});

export const staffController = { createInvite, listInvites, revokeInvite, getMe, updateMe, getMyStudents, getMyCourses, listStaff, approveStaff, rejectStaff, assignStaff, manageRoles, setMicrosoftEmail };
