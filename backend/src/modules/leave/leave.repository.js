import LeaveRequest from './leave.model.js';

const createLeave = (data) => LeaveRequest.create(data);

const findByStudent = (studentId) =>
  LeaveRequest.find({ student: studentId }).sort({ createdAt: -1 });

const findPending = () =>
  LeaveRequest.find({ status: 'pending' })
    .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
    .sort({ createdAt: 1 });

const findPendingByStudentIds = (studentIds) =>
  LeaveRequest.find({ status: 'pending', student: { $in: studentIds } })
    .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
    .sort({ createdAt: 1 });

const findById = (id) => LeaveRequest.findById(id);

const updateById = (id, data) =>
  LeaveRequest.findByIdAndUpdate(id, data, { new: true });

// Returns all approved leave dates for a student within a date range (for day calculation)
const findApprovedLeaveDatesInRange = async (studentId, startDate, endDate) => {
  const leaves = await LeaveRequest.find({
    student: studentId,
    status: 'approved',
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
    ],
  }).select('startDate endDate');

  const dates = new Set();
  for (const leave of leaves) {
    const current = new Date(leave.startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(Math.min(leave.endDate, endDate));
    end.setHours(0, 0, 0, 0);
    while (current <= end) {
      dates.add(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
  }
  return dates;
};

export const leaveRepository = {
  createLeave,
  findByStudent,
  findPending,
  findPendingByStudentIds,
  findById,
  updateById,
  findApprovedLeaveDatesInRange,
};
