import { attendanceRepository } from './attendance.repository.js';
import { courseService } from '../course/course.service.js';
import Student from '../student/student.model.js';
import FeeAccount from '../fees/fee-account.model.js';
import { AppError } from '../../utils/AppError.js';

const toDay = (d) => {
  const date = new Date(d || Date.now());
  date.setHours(0, 0, 0, 0);
  return date;
};

const markAttendance = async ({ studentId, date, status, markedById, note }) => {
  const student = await Student.findById(studentId);
  if (!student) throw new AppError('Student not found', 404);

  const day = toDay(date);

  const record = await attendanceRepository.upsert(studentId, day, {
    status,
    markedBy: markedById,
    note: note || null,
  });

  if (status === 'present' || status === 'half_day' || status === 'late') {
    await courseService.logDailyActivity(student.user);
  }

  return record;
};

// Returns the date the student's first fee installment was approved (course start date).
// Attendance before this date is irrelevant.
const getCoursStartDate = async (studentId) => {
  const feeAccount = await FeeAccount.findOne({ student: studentId })
    .select('installments')
    .lean();
  if (!feeAccount) return null;
  const firstPaid = feeAccount.installments
    .filter((i) => (i.status === 'paid' || i.status === 'waived') && i.paidAt)
    .sort((a, b) => new Date(a.paidAt) - new Date(b.paidAt))[0];
  if (!firstPaid) return null;
  const d = new Date(firstPaid.paidAt);
  d.setHours(0, 0, 0, 0);
  return d;
};

const buildStats = async (studentId) => {
  const fromDate = await getCoursStartDate(studentId);
  const [total, present, late, absent, excused] = await Promise.all([
    attendanceRepository.countByStudent(studentId, fromDate),
    attendanceRepository.countByStudentAndStatus(studentId, 'present', fromDate),
    attendanceRepository.countByStudentAndStatus(studentId, 'late',    fromDate),
    attendanceRepository.countByStudentAndStatus(studentId, 'absent',  fromDate),
    attendanceRepository.countByStudentAndStatus(studentId, 'excused', fromDate),
  ]);
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
  return { total, present, late, absent, excused, percentage, fromDate };
};

const getMyAttendance = async (userId, { startDate, endDate } = {}) => {
  const student = await Student.findOne({ user: userId });
  if (!student) throw new AppError('Student profile not found', 404);

  const courseStart = await getCoursStartDate(student._id);
  const records = await attendanceRepository.findByStudent(student._id, {
    startDate: startDate ? toDay(startDate) : (courseStart ?? undefined),
    endDate:   endDate   ? toDay(endDate)   : undefined,
  });

  const stats = await buildStats(student._id);
  return { records, stats };
};

const getStudentAttendance = async (studentId, filters = {}) => {
  const student = await Student.findById(studentId);
  if (!student) throw new AppError('Student not found', 404);

  const courseStart = await getCoursStartDate(studentId);
  const records = await attendanceRepository.findByStudent(studentId, {
    startDate: filters.startDate ? toDay(filters.startDate) : (courseStart ?? undefined),
    endDate:   filters.endDate   ? toDay(filters.endDate)   : undefined,
  });

  const stats = await buildStats(studentId);
  return { records, stats };
};

const getAttendanceByDate = async (date) => {
  const day = toDay(date);
  return attendanceRepository.findByDate(day);
};

const deleteOverride = async ({ studentId, date }) => {
  const student = await Student.findById(studentId);
  if (!student) throw new AppError('Student not found', 404);
  const day = toDay(date);
  await attendanceRepository.deleteOverride(studentId, day);
};

export const attendanceService = {
  markAttendance,
  getMyAttendance,
  getStudentAttendance,
  getAttendanceByDate,
  deleteOverride,
};
