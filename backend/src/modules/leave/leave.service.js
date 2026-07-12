import { leaveRepository } from './leave.repository.js';
import { AppError } from '../../utils/AppError.js';
import Student from '../student/student.model.js';
import { ROLES, NOTIFICATION_TYPES } from '../../constants/index.js';

// Next working day — skips Sundays and public holidays
const nextWorkingDay = async (date) => {
  const { holidayRepository } = await import('../holiday/holiday.repository.js');
  const d = new Date(date);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (d.getDay() === 0) { d.setDate(d.getDate() + 1); continue; }
    const holiday = await holidayRepository.findHolidayOnDate(d);
    if (holiday)           { d.setDate(d.getDate() + 1); continue; }
    break;
  }
  return d;
};

const submitLeave = async (userId, data) => {
  const student = await Student.findOne({ user: userId })
    .populate('user', 'name')
    .populate('batch', '_id');
  if (!student) throw new AppError('Student profile not found', 404);

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  if (end < start) throw new AppError('End date must be on or after start date', 400);

  const leave = await leaveRepository.createLeave({ ...data, student: student._id });

  // Notify batch mentors about the new leave request
  notifyBatchMentorsOfRequest(student, start, end).catch(() => {});

  return leave;
};

const notifyBatchMentorsOfRequest = async (student, start, end) => {
  const { staffRepository } = await import('../staff/staff.repository.js');
  const { notifyUser } = await import('../notification/notification.service.js');

  const batchId = student.batch?._id ?? student.batch;
  if (!batchId) return;

  const mentors = await staffRepository.findMentorsByBatch(batchId);
  if (!mentors.length) return;

  const studentName = student.user?.name ?? 'A student';
  const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const dayCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  await Promise.allSettled(
    mentors.map((m) =>
      notifyUser(m.user._id, {
        type:       NOTIFICATION_TYPES.LEAVE_REQUESTED,
        title:      'New Leave Request',
        message:    `${studentName} has requested leave from ${fmt(start)} to ${fmt(end)} (${dayCount} day${dayCount !== 1 ? 's' : ''}). Please review it in the Leave Requests tab.`,
        data:       { studentId: student._id },
        targetRole: 'technical_mentor',
      })
    )
  );
};

const getMyLeaves = async (userId) => {
  const student = await Student.findOne({ user: userId });
  if (!student) throw new AppError('Student profile not found', 404);
  return leaveRepository.findByStudent(student._id);
};

const getPendingLeaves = async (userId, roles = []) => {
  const isMentor =
    roles.includes(ROLES.TECHNICAL_MENTOR) ||
    roles.includes(ROLES.COMMUNICATION_MENTOR);

  if (!isMentor) return leaveRepository.findPending();

  // Mentors see only leaves from students in their assigned batches
  const { staffRepository } = await import('../staff/staff.repository.js');
  const staff = await staffRepository.findStaffByUserId(userId);
  if (!staff?.batches?.length) return [];

  const studentIds = await Student.find({ batch: { $in: staff.batches } }).distinct('_id');
  return leaveRepository.findPendingByStudentIds(studentIds);
};

const reviewLeave = async (leaveId, staffUserId, status, reviewNote) => {
  const leave = await leaveRepository.findById(leaveId);
  if (!leave) throw new AppError('Leave request not found', 404);
  if (leave.status !== 'pending') throw new AppError('Leave already reviewed', 400);

  const updated = await leaveRepository.updateById(leaveId, {
    status,
    reviewedBy: staffUserId,
    reviewNote: reviewNote ?? null,
  });

  if (status === 'approved') {
    handleLeaveApproved(leave).catch(() => {});
  }

  return updated;
};

// Side-effects run after approval — does not block the HTTP response
const handleLeaveApproved = async (leave) => {
  const { reviewRepository } = await import('../review/review.repository.js');
  const { staffRepository } = await import('../staff/staff.repository.js');
  const { notifyUser } = await import('../notification/notification.service.js');

  const studentId = leave.student._id ?? leave.student;
  const leaveStart = new Date(leave.startDate);
  const leaveEnd = new Date(leave.endDate);

  leaveStart.setUTCHours(0, 0, 0, 0);
  leaveEnd.setUTCHours(23, 59, 59, 999);

  const studentDoc = await Student.findById(studentId)
    .populate('batch', '_id')
    .populate('user', 'name');

  if (!studentDoc) return;

  const batchId = studentDoc.batch?._id ?? studentDoc.batch;
  const studentName = studentDoc.user?.name ?? 'A student';

  // Adjust earliestDate for any pending review that falls inside the leave window
  const pendingReviews = await reviewRepository.findPendingByStudent(studentId);
  const adjustedReviews = [];

  for (const review of pendingReviews) {
    if (!review.earliestDate) continue;
    const earliest = new Date(review.earliestDate);
    if (earliest >= leaveStart && earliest <= leaveEnd) {
      const newEarliest = await nextWorkingDay(new Date(leaveEnd.getTime() + 24 * 60 * 60 * 1000));
      await reviewRepository.updateById(review._id, { earliestDate: newEarliest });
      adjustedReviews.push({ review, newEarliest });
    }
  }

  if (!batchId) return;

  const mentors = await staffRepository.findMentorsByBatch(batchId);
  if (!mentors.length) return;

  const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const returnDate = fmt(new Date(leaveEnd.getTime() + 24 * 60 * 60 * 1000));
  const leaveRange = `${fmt(leaveStart)} – ${fmt(leaveEnd)}`;

  let reviewPart = '';
  if (adjustedReviews.length) {
    const labels = adjustedReviews.map(({ review, newEarliest }) => {
      const label = review.reviewType === 'screening'
        ? `Part ${review.part} Screening`
        : `Week ${review.weekNumber} Review`;
      return `${label} (earliest slot: ${fmt(newEarliest)})`;
    });
    reviewPart = ` They have a pending ${labels.join(', ')}. Earliest booking date adjusted automatically.`;
  }

  await Promise.allSettled(
    mentors.map((m) =>
      notifyUser(m.user._id, {
        type:       NOTIFICATION_TYPES.LEAVE_APPROVED,
        title:      'Student On Approved Leave',
        message:    `${studentName} is on approved leave from ${leaveRange}. They return on ${returnDate}.${reviewPart}`,
        data:       { studentId, leaveStart, leaveEnd },
        targetRole: 'technical_mentor',
      })
    )
  );
};

const getLeavesByStudent = (studentId) => leaveRepository.findByStudent(studentId);

export const leaveService = { submitLeave, getMyLeaves, getPendingLeaves, reviewLeave, getLeavesByStudent };
