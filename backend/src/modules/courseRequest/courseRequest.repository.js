import CourseRequest from './courseRequest.model.js';

const POPULATE = [
  { path: 'user',            select: 'name email' },
  { path: 'currentCourse',   select: 'name slug' },
  { path: 'requestedCourse', select: 'name slug durationWeeks' },
  { path: 'reviewedBy',      select: 'name' },
];

const create = (data) => CourseRequest.create(data);

const findByStudent = (studentId) =>
  CourseRequest.find({ student: studentId }).populate(POPULATE).sort({ createdAt: -1 });

const findPendingByStudent = (studentId) =>
  CourseRequest.findOne({ student: studentId, status: 'pending' });

const findAll = (filter = {}) =>
  CourseRequest.find(filter).populate(POPULATE).sort({ createdAt: -1 });

const findById = (id) => CourseRequest.findById(id).populate(POPULATE);

const updateById = (id, data) =>
  CourseRequest.findByIdAndUpdate(id, data, { new: true }).populate(POPULATE);

export const courseRequestRepository = {
  create,
  findByStudent,
  findPendingByStudent,
  findAll,
  findById,
  updateById,
};
