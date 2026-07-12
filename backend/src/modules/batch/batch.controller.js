import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { batchService } from './batch.service.js';

const list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.branch)  filter.branch  = req.query.branch;
  if (req.query.course)  filter.course  = req.query.course;
  if (req.query.active === 'true') filter.isActive = true;
  const batches = await batchService.listBatches(filter);
  successResponse(res, 'Batches fetched', batches);
});

const create = asyncHandler(async (req, res) => {
  const batch = await batchService.createBatch(req.body, req.user);
  successResponse(res, 'Batch created', batch, 201);
});

const toggleActive = asyncHandler(async (req, res) => {
  const batch = await batchService.toggleActive(req.params.id);
  successResponse(res, 'Batch updated', batch);
});

const update = asyncHandler(async (req, res) => {
  const batch = await batchService.updateBatch(req.params.id, req.body);
  successResponse(res, 'Batch updated', batch);
});

export const batchController = { list, create, toggleActive, update };
