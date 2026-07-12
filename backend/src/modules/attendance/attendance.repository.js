import Attendance from './attendance.model.js';

const upsert = (studentId, date, data) =>
  Attendance.findOneAndUpdate(
    { student: studentId, date },
    { ...data, student: studentId, date },
    { upsert: true, new: true, runValidators: true }
  ).populate('markedBy', 'name role');

const findByStudent = (studentId, { startDate, endDate } = {}) => {
  const filter = { student: studentId };
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = startDate;
    if (endDate)   filter.date.$lte = endDate;
  }
  return Attendance.find(filter)
    .populate('markedBy', 'name role')
    .sort({ date: -1 });
};

const findByDate = (date) =>
  Attendance.find({ date })
    .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
    .populate('markedBy', 'name role')
    .sort({ createdAt: 1 });

const findAll = (filter = {}) =>
  Attendance.find(filter)
    .populate('markedBy', 'name role')
    .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
    .sort({ date: -1 });

const countByStudent = (studentId, startDate) => {
  const filter = { student: studentId };
  if (startDate) filter.date = { $gte: startDate };
  return Attendance.countDocuments(filter);
};

const countByStudentAndStatus = (studentId, status, startDate) => {
  const filter = { student: studentId, status };
  if (startDate) filter.date = { $gte: startDate };
  return Attendance.countDocuments(filter);
};

const findById = (id) => Attendance.findById(id);

const deleteOverride = (studentId, date) =>
  Attendance.findOneAndDelete({ student: studentId, date });

export const attendanceRepository = {
  upsert,
  findByStudent,
  findByDate,
  findAll,
  countByStudent,
  countByStudentAndStatus,
  findById,
  deleteOverride,
};
