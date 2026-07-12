import Student from './student.model.js';

const batchPopulate = { path: 'batch', select: 'name branch', populate: { path: 'branch', select: 'name code' } };

const findAll = (filter = {}, { skip = 0, limit = 20 } = {}) =>
  Student.find(filter)
    .populate('user', 'name email phone isEmailVerified')
    .populate('course', 'name slug reviewType')
    .populate(batchPopulate)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

const countAll = (filter = {}) => Student.countDocuments(filter);

const findById = (id) =>
  Student.findById(id)
    .populate('user', 'name email phone isEmailVerified createdAt')
    .populate('course', 'name slug durationWeeks reviewType')
    .populate('branch', 'name code location')
    .populate(batchPopulate);

const findByUserId = (userId) =>
  Student.findOne({ user: userId, studentStatus: { $ne: 'dropped' } })
    .sort({ createdAt: -1 })
    .populate('user', 'name email phone')
    .populate('course', 'name slug durationWeeks reviewType')
    .populate('branch', 'name code location')
    .populate(batchPopulate);

const findAllByUserId = (userId) =>
  Student.find({ user: userId })
    .populate('course', 'name slug durationWeeks')
    .sort({ createdAt: -1 })
    .lean();

const updateById = (id, data) =>
  Student.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('user', 'name email phone')
    .populate('course', 'name slug');

// Returns the next roll number scoped to a batch (or globally if no batch)
const getNextRollNumber = async (batchId) => {
  const filter = batchId
    ? { batch: batchId, rollNumber: { $ne: null } }
    : { batch: null, rollNumber: { $ne: null } };
  const last = await Student.findOne(filter).sort({ rollNumber: -1 }).select('rollNumber');
  return (last?.rollNumber ?? 0) + 1;
};

export const studentRepository = {
  findAll,
  countAll,
  findById,
  findByUserId,
  findAllByUserId,
  updateById,
  getNextRollNumber,
};
