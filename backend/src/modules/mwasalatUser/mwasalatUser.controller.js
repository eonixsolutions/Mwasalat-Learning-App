import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { AppError } from '../../utils/AppError.js';
import { mwasalatUserService } from './mwasalatUser.service.js';

const list = asyncHandler(async (req, res) => {
  const users = await mwasalatUserService.listByRole(req.query.role, req.mwasalatUser);
  successResponse(res, 'Users fetched', users);
});

const inviteInstructor = asyncHandler(async (req, res) => {
  const user = await mwasalatUserService.inviteInstructor(req.body, req.mwasalatUser);
  successResponse(res, 'Invitation sent', user, 201);
});

const invitePlatformAdmin = asyncHandler(async (req, res) => {
  const user = await mwasalatUserService.invitePlatformAdmin(req.body, req.mwasalatUser);
  successResponse(res, 'Invitation sent', user, 201);
});

const updatePlatformAdmin = asyncHandler(async (req, res) => {
  const user = await mwasalatUserService.updatePlatformAdmin(req.params.id, req.body, req.mwasalatUser);
  successResponse(res, 'Platform admin updated', user);
});

const inviteStaff = asyncHandler(async (req, res) => {
  const user = await mwasalatUserService.inviteStaff(req.body, req.mwasalatUser);
  successResponse(res, 'Invitation sent', user, 201);
});

const assignDepartment = asyncHandler(async (req, res) => {
  const user = await mwasalatUserService.assignDepartment(req.params.id, req.body.departmentId, req.mwasalatUser);
  successResponse(res, 'Department assigned', user);
});

const assignSupervisor = asyncHandler(async (req, res) => {
  const user = await mwasalatUserService.assignSupervisor(req.params.id, req.body.supervisorId, req.mwasalatUser);
  successResponse(res, 'Supervisor assigned', user);
});

const setActive = asyncHandler(async (req, res) => {
  const user = await mwasalatUserService.setActive(req.params.id, req.body.isActive, req.body.reason, req.mwasalatUser);
  successResponse(res, 'User updated', user);
});

const bulkImport = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('A CSV file is required', 400);
  const results = await mwasalatUserService.bulkImport(req.file.buffer, req.mwasalatUser);
  successResponse(res, 'Bulk import complete', results, 201);
});

const getItSupportOverview = asyncHandler(async (req, res) => {
  const overview = await mwasalatUserService.getItSupportOverview();
  successResponse(res, 'IT Support overview fetched', overview);
});

const getMyTeamOverview = asyncHandler(async (req, res) => {
  const team = await mwasalatUserService.getMyTeamOverview(req.mwasalatUser);
  successResponse(res, 'Team overview fetched', team);
});

const escalateOverdueToAdmin = asyncHandler(async (req, res) => {
  const notification = await mwasalatUserService.escalateOverdueToAdmin(
    req.mwasalatUser._id, req.body.learnerId, req.body.programId, req.mwasalatUser
  );
  successResponse(res, 'Escalated to Platform Admin', notification);
});

export const mwasalatUserController = {
  list, inviteInstructor, invitePlatformAdmin, updatePlatformAdmin, inviteStaff, setActive, bulkImport,
  assignDepartment, assignSupervisor, getItSupportOverview, getMyTeamOverview, escalateOverdueToAdmin,
};
