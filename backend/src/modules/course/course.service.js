import { courseRepository } from './course.repository.js';
import { AppError } from '../../utils/AppError.js';
import Student from '../student/student.model.js';

const toSlug = (name) =>
  name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const getActiveCourses = async () => courseRepository.findActive();

const getAllCourses = async () => courseRepository.findAll();

const getCourseById = async (id) => {
  const course = await courseRepository.findById(id);
  if (!course) throw new AppError('Course not found', 404);
  return course;
};

const createCourse = async ({ name, slug, description, durationWeeks, createdBy }) => {
  const course = await courseRepository.create({
    name,
    slug: slug || toSlug(name),
    description,
    durationWeeks,
    createdBy,
  });
  return course;
};

const updateCourse = async (id, data) => {
  const course = await courseRepository.updateById(id, data);
  if (!course) throw new AppError('Course not found', 404);
  return course;
};

const deleteCourse = async (id) => {
  const course = await courseRepository.deleteById(id);
  if (!course) throw new AppError('Course not found', 404);
  return course;
};

const getStudentEnrollment = async (userId) => {
  const student = await Student.findOne({ user: userId, studentStatus: { $ne: 'dropped' } })
    .sort({ createdAt: -1 })
    .populate('course', 'name slug description durationWeeks isActive reviewType screenings');
  if (!student) throw new AppError('Student profile not found', 404);
  if (!student.course) throw new AppError('No course enrolled', 404);

  // Fetch fee account to expose access week to the student's frontend
  const FeeAccount = (await import('../fees/fee-account.model.js')).default;
  const feeAccount = await FeeAccount.findOne({ student: student._id })
    .select('accessValidUntilWeek feeStatus totalPaid totalFee installments')
    .lean();

  return {
    course: student.course,
    currentWeek: student.currentWeek,
    currentStreak: student.currentStreak,
    longestStreak: student.longestStreak,
    lastActivityDate: student.lastActivityDate,
    studentStatus: student.studentStatus,
    enrollmentDate: student.enrollmentDate,
    isApproved: student.isApproved,
    registrationFeePaid: student.registrationFeePaid,
    mentorshipMode: student.mentorshipMode,
    // null = no fee structure for this course = unrestricted
    feeAccount: feeAccount ?? null,
  };
};

const logDailyActivity = async (userId) => {
  const student = await Student.findOne({ user: userId });
  if (!student) throw new AppError('Student profile not found', 404);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  if (student.lastActivityDate) {
    const last = new Date(student.lastActivityDate);
    last.setHours(0, 0, 0, 0);
    const diffDays = Math.round((todayStart - last) / 86400000);

    if (diffDays === 0) {
      return { currentStreak: student.currentStreak, longestStreak: student.longestStreak, alreadyLogged: true };
    }
    student.currentStreak = diffDays === 1 ? student.currentStreak + 1 : 1;
  } else {
    student.currentStreak = 1;
  }

  student.lastActivityDate = new Date();
  student.longestStreak = Math.max(student.longestStreak, student.currentStreak);
  await student.save();

  return { currentStreak: student.currentStreak, longestStreak: student.longestStreak, alreadyLogged: false };
};

export const courseService = {
  getActiveCourses,
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getStudentEnrollment,
  logDailyActivity,
};
