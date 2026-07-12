import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { coordinatorService } from './coordinator.service.js';

const list = asyncHandler(async (req, res) => {
  const { isApproved, page, limit } = req.query;
  const result = await coordinatorService.listCoordinators({
    isApproved,
    page: +page || 1,
    limit: +limit || 20,
  });
  successResponse(res, 'Coordinators fetched', result);
});

const approve = asyncHandler(async (req, res) => {
  const coordinator = await coordinatorService.approveCoordinator(req.params.id, req.user._id);
  successResponse(res, 'Coordinator approved successfully', coordinator);
});

const reject = asyncHandler(async (req, res) => {
  const coordinator = await coordinatorService.rejectCoordinator(req.params.id, req.body.reason);
  successResponse(res, 'Coordinator rejected', coordinator);
});

export const coordinatorController = { list, approve, reject };
