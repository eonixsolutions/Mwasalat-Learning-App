import { branchRepository } from './branch.repository.js';
import { AppError } from '../../utils/AppError.js';

const listBranches = (onlyActive = false) =>
  branchRepository.findAll(onlyActive ? { isActive: true } : {});

const nameFilter = (name) => ({ name: { $regex: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });

const createBranch = async (data) => {
  const code = data.code.toUpperCase();
  if (await branchRepository.findOne({ code })) throw new AppError('Branch code already exists', 409);
  if (await branchRepository.findOne(nameFilter(data.name))) throw new AppError('Branch name already exists', 409);
  return branchRepository.create({ ...data, code });
};

const updateBranch = async (id, data) => {
  const branch = await branchRepository.findById(id);
  if (!branch) throw new AppError('Branch not found', 404);
  if (data.name) {
    const conflict = await branchRepository.findOne({ ...nameFilter(data.name), _id: { $ne: id } });
    if (conflict) throw new AppError('Branch name already exists', 409);
  }
  return branchRepository.updateById(id, data);
};

const toggleActive = async (id) => {
  const branch = await branchRepository.findById(id);
  if (!branch) throw new AppError('Branch not found', 404);
  return branchRepository.updateById(id, { isActive: !branch.isActive });
};

export const branchService = { listBranches, createBranch, updateBranch, toggleActive };
