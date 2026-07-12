import Video from './video.model.js';

const create = (data) => Video.create(data);

const findById = (id) =>
  Video.findById(id).populate('course', 'name').populate('createdBy', 'name');

const findByCourse = (courseId, { publishedOnly = false } = {}) => {
  const query = { course: courseId };
  if (publishedOnly) query.isPublished = true;
  return Video.find(query).sort({ week: 1, day: 1, order: 1 });
};

const findAll = (filters = {}) =>
  Video.find(filters)
    .populate('course', 'name')
    .populate('createdBy', 'name')
    .sort({ week: 1, day: 1, order: 1 });

const updateById = (id, data) =>
  Video.findByIdAndUpdate(id, data, { new: true });

const deleteById = (id) => Video.findByIdAndDelete(id);

export const videoRepository = { create, findById, findByCourse, findAll, updateById, deleteById };
