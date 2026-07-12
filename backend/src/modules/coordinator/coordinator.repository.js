import Coordinator from './coordinator.model.js';

const create = (data) => Coordinator.create(data);

const findByUserId = (userId) =>
  Coordinator.findOne({ user: userId });

const findByUserIdPopulated = (userId) =>
  Coordinator.findOne({ user: userId })
    .populate('user', 'name email phone isEmailVerified')
    .populate('approvedBy', 'name');

const findAll = (filter = {}, { skip = 0, limit = 20 } = {}) =>
  Coordinator.find(filter)
    .populate('user', 'name email phone isEmailVerified createdAt')
    .populate('approvedBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

const countAll = (filter = {}) => Coordinator.countDocuments(filter);

const findById = (id) =>
  Coordinator.findById(id)
    .populate('user', 'name email phone isEmailVerified createdAt')
    .populate('approvedBy', 'name');

const updateById = (id, data) =>
  Coordinator.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('user', 'name email phone')
    .populate('approvedBy', 'name');

export const coordinatorRepository = {
  create,
  findByUserId,
  findByUserIdPopulated,
  findAll,
  countAll,
  findById,
  updateById,
};
