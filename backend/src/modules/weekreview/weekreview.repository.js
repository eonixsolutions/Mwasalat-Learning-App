import WeekReview from './weekreview.model.js';

const findByStudentAndWeek = (studentId, week) =>
  WeekReview.findOne({ student: studentId, week });

// Atomic find-or-create — safe under concurrent requests
const findOrCreate = (studentId, week) =>
  WeekReview.findOneAndUpdate(
    { student: studentId, week },
    { $setOnInsert: { student: studentId, week, days: [], status: 'in_progress' } },
    { upsert: true, new: true }
  );

const findAllByStudent = (studentId) =>
  WeekReview.find({ student: studentId }).sort({ week: 1 });

const STUDENT_POPULATE = {
  path: 'student',
  populate: [
    { path: 'user',   select: 'name email' },
    { path: 'course', select: 'name reviewType' },
  ],
};

// Pending = any week that has at least one day still awaiting mentor review
const findPending = () =>
  WeekReview.find({ 'days.status': 'submitted' })
    .populate(STUDENT_POPULATE)
    .sort({ updatedAt: 1 });

const findAll = (filters = {}) =>
  WeekReview.find(filters)
    .populate(STUDENT_POPULATE)
    .sort({ updatedAt: -1 });

const findById = (id) =>
  WeekReview.findById(id)
    .populate(STUDENT_POPULATE);

const updateById = (id, data) =>
  WeekReview.findByIdAndUpdate(id, data, { new: true });

const countPending = () =>
  WeekReview.countDocuments({ 'days.status': 'submitted' });

export const weekReviewRepository = {
  findById,
  findByStudentAndWeek,
  findOrCreate,
  findAllByStudent,
  findPending,
  findAll,
  updateById,
  countPending,
};
