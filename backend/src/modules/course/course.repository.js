import Course from './course.model.js';

const findActive = () =>
  Course.find({ isActive: true }).select('name slug description durationWeeks').sort('name');

const findAll = () => Course.find().sort({ createdAt: -1 });

const findById = (id) => Course.findById(id);

const findActiveById = (id) => Course.findOne({ _id: id, isActive: true });

const create = (data) => Course.create(data);

const updateById = (id, data) =>
  Course.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteById = (id) => Course.findByIdAndDelete(id);

export const courseRepository = {
  findActive,
  findAll,
  findById,
  findActiveById,
  create,
  updateById,
  deleteById,
};
