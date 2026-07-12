import Batch from './batch.model.js';

const findAll = (filter = {}) =>
  Batch.find(filter)
    .populate('branch', 'name code')
    .populate('course', 'name')
    .sort({ startDate: -1 });

const findById = (id) =>
  Batch.findById(id).populate('branch', 'name code').populate('course', 'name');

const findOne = (filter) => Batch.findOne(filter);

const create = (data) => Batch.create(data);

const updateById = (id, data) =>
  Batch.findByIdAndUpdate(id, data, { new: true });

export const batchRepository = { findAll, findById, findOne, create, updateById };
