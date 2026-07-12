import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { courseService } from './course.service.js';
import Student from '../student/student.model.js';
import { AppError } from '../../utils/AppError.js';

const getActiveCourses = asyncHandler(async (req, res) => {
  const courses = await courseService.getActiveCourses();
  successResponse(res, 'Courses fetched', courses);
});

const getAllCourses = asyncHandler(async (req, res) => {
  const courses = await courseService.getAllCourses();
  successResponse(res, 'Courses fetched', courses);
});

const createCourse = asyncHandler(async (req, res) => {
  const { name, slug, description, durationWeeks } = req.body;
  const course = await courseService.createCourse({
    name, slug, description, durationWeeks, createdBy: req.user._id,
  });
  successResponse(res, 'Course created', course, 201);
});

const updateCourse = asyncHandler(async (req, res) => {
  const course = await courseService.updateCourse(req.params.id, req.body);
  successResponse(res, 'Course updated', course);
});

const logActivity = asyncHandler(async (req, res) => {
  const result = await courseService.logDailyActivity(req.user._id);
  successResponse(res, result.alreadyLogged ? 'Already logged today' : 'Streak updated', result);
});

const getMyEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await courseService.getStudentEnrollment(req.user._id);
  successResponse(res, 'Enrollment fetched', enrollment);
});

const deleteCourse = asyncHandler(async (req, res) => {
  const enrolledCount = await Student.countDocuments({ course: req.params.id });
  if (enrolledCount > 0)
    throw new AppError(`Cannot delete: ${enrolledCount} student(s) are enrolled in this course.`, 400);
  await courseService.deleteCourse(req.params.id);
  successResponse(res, 'Course deleted');
});

export const courseController = {
  getActiveCourses,
  getAllCourses,
  getMyEnrollment,
  logActivity,
  createCourse,
  updateCourse,
  deleteCourse,
};
