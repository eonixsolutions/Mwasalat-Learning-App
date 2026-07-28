import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { mwasalatGroupService } from './mwasalatGroup.service.js';

const list = asyncHandler(async (req, res) => {
  const groups = await mwasalatGroupService.list();
  successResponse(res, 'Groups fetched', groups);
});

const listActive = asyncHandler(async (req, res) => {
  const groups = await mwasalatGroupService.listActive();
  successResponse(res, 'Groups fetched', groups);
});

const create = asyncHandler(async (req, res) => {
  const group = await mwasalatGroupService.create(req.body, req.mwasalatUser);
  successResponse(res, 'Group created', group, 201);
});

const update = asyncHandler(async (req, res) => {
  const group = await mwasalatGroupService.update(req.params.id, req.body, req.mwasalatUser);
  successResponse(res, 'Group updated', group);
});

const remove = asyncHandler(async (req, res) => {
  const group = await mwasalatGroupService.remove(req.params.id, req.mwasalatUser);
  successResponse(res, 'Group deleted', group);
});

export const mwasalatGroupController = { list, listActive, create, update, remove };
