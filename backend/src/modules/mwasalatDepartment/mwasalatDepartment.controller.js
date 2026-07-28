import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { mwasalatDepartmentService } from './mwasalatDepartment.service.js';

const list = asyncHandler(async (req, res) => {
  const departments = await mwasalatDepartmentService.list();
  successResponse(res, 'Departments fetched', departments);
});

const listActive = asyncHandler(async (req, res) => {
  const departments = await mwasalatDepartmentService.listActive();
  successResponse(res, 'Departments fetched', departments);
});

const create = asyncHandler(async (req, res) => {
  const department = await mwasalatDepartmentService.create(req.body, req.mwasalatUser);
  successResponse(res, 'Department created', department, 201);
});

const update = asyncHandler(async (req, res) => {
  const department = await mwasalatDepartmentService.update(req.params.id, req.body, req.mwasalatUser);
  successResponse(res, 'Department updated', department);
});

const remove = asyncHandler(async (req, res) => {
  const department = await mwasalatDepartmentService.remove(req.params.id, req.mwasalatUser);
  successResponse(res, 'Department deleted', department);
});

export const mwasalatDepartmentController = { list, listActive, create, update, remove };
