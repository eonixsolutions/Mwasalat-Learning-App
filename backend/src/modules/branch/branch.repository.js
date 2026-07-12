import Branch from './branch.model.js';

const findAll = (filter = {}) =>
  Branch.find(filter).sort({ name: 1 });

const findById = (id) => Branch.findById(id);

const findOne = (filter) => Branch.findOne(filter);

const create = (data) => Branch.create(data);

const updateById = (id, data) =>
  Branch.findByIdAndUpdate(id, data, { new: true });

export const branchRepository = { findAll, findById, findOne, create, updateById };
