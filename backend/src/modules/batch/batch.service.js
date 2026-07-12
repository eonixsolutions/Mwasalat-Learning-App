import { batchRepository } from './batch.repository.js';
import { staffRepository } from '../staff/staff.repository.js';
import { AppError } from '../../utils/AppError.js';
import { ROLES } from '../../constants/index.js';

const listBatches = (filter = {}) => batchRepository.findAll(filter);

const createBatch = async (data, requestingUser) => {
  if (requestingUser.role === ROLES.BRANCH_ADMIN) {
    const staff = await staffRepository.findStaffByUserId(requestingUser._id);
    if (!staff) throw new AppError('Staff profile not found', 403);
    const allowed = staff.branches.map((b) => b.toString());
    if (!allowed.includes(data.branch?.toString())) {
      throw new AppError('You can only create batches for your assigned branches', 403);
    }
  }
  const duplicate = await batchRepository.findOne({ name: data.name, branch: data.branch });
  if (duplicate) throw new AppError('A batch with this name already exists in the selected branch', 409);
  return batchRepository.create(data);
};

const toggleActive = async (id) => {
  const batch = await batchRepository.findById(id);
  if (!batch) throw new AppError('Batch not found', 404);
  return batchRepository.updateById(id, { isActive: !batch.isActive });
};

const updateBatch = async (id, data) => {
  const batch = await batchRepository.findById(id);
  if (!batch) throw new AppError('Batch not found', 404);
  if (data.name) {
    const conflict = await batchRepository.findOne({ name: data.name, branch: batch.branch, _id: { $ne: id } });
    if (conflict) throw new AppError('A batch with this name already exists in this branch', 409);
  }
  return batchRepository.updateById(id, data);
};

export const batchService = { listBatches, createBatch, toggleActive, updateBatch };
