import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { mwasalatUserService } from './mwasalatUser.service.js';

const list = asyncHandler(async (req, res) => {
  const users = await mwasalatUserService.listByRole(req.query.role);
  successResponse(res, 'Users fetched', users);
});

const inviteInstructor = asyncHandler(async (req, res) => {
  const user = await mwasalatUserService.inviteInstructor(req.body, req.mwasalatUser);
  successResponse(res, 'Invitation sent', user, 201);
});

const setActive = asyncHandler(async (req, res) => {
  const user = await mwasalatUserService.setActive(req.params.id, req.body.isActive, req.body.reason, req.mwasalatUser);
  successResponse(res, 'User updated', user);
});

export const mwasalatUserController = { list, inviteInstructor, setActive };
