import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { branchService } from './branch.service.js';

const list = asyncHandler(async (req, res) => {
  const branches = await branchService.listBranches(req.query.active === 'true');
  successResponse(res, 'Branches fetched', branches);
});

const listPublic = asyncHandler(async (req, res) => {
  const branches = await branchService.listBranches(true);
  const safe = branches.map(({ _id, name, code, location }) => ({ _id, name, code, location }));
  successResponse(res, 'Branches fetched', safe);
});

const create = asyncHandler(async (req, res) => {
  const branch = await branchService.createBranch(req.body);
  successResponse(res, 'Branch created', branch, 201);
});

const update = asyncHandler(async (req, res) => {
  const branch = await branchService.updateBranch(req.params.id, req.body);
  successResponse(res, 'Branch updated', branch);
});

const toggleActive = asyncHandler(async (req, res) => {
  const branch = await branchService.toggleActive(req.params.id);
  successResponse(res, 'Branch updated', branch);
});

export const branchController = { list, listPublic, create, update, toggleActive };
