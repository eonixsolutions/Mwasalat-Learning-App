import { coordinatorRepository } from './coordinator.repository.js';
import { AppError } from '../../utils/AppError.js';

const listCoordinators = async ({ isApproved, page = 1, limit = 20 } = {}) => {
  const filter = {};
  if (isApproved !== undefined && isApproved !== '') {
    filter.isApproved = isApproved === 'true' || isApproved === true;
  }

  const skip = (page - 1) * limit;
  const [coordinators, total] = await Promise.all([
    coordinatorRepository.findAll(filter, { skip, limit }),
    coordinatorRepository.countAll(filter),
  ]);

  return {
    coordinators,
    pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / limit) },
  };
};

const approveCoordinator = async (id, adminId) => {
  const coordinator = await coordinatorRepository.findById(id);
  if (!coordinator) throw new AppError('Coordinator not found', 404);
  if (coordinator.isApproved) throw new AppError('Coordinator is already approved', 400);

  return coordinatorRepository.updateById(id, {
    isApproved: true,
    approvedBy: adminId,
    approvedAt: new Date(),
    rejectionReason: null,
  });
};

const rejectCoordinator = async (id, reason) => {
  const coordinator = await coordinatorRepository.findById(id);
  if (!coordinator) throw new AppError('Coordinator not found', 404);

  return coordinatorRepository.updateById(id, {
    isApproved: false,
    rejectionReason: reason || 'Application not approved',
    approvedBy: null,
    approvedAt: null,
  });
};

export const coordinatorService = {
  listCoordinators,
  approveCoordinator,
  rejectCoordinator,
};
