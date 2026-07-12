import { courseRequestRepository } from './courseRequest.repository.js';
import { AppError } from '../../utils/AppError.js';
import Student from '../student/student.model.js';
import Course from '../course/course.model.js';

const submitRequest = async ({ userId, studentId, courseId, type, reason }) => {
  const course = await Course.findOne({ _id: courseId, isActive: true });
  if (!course) throw new AppError('Course not available', 400);

  const student = await Student.findById(studentId).populate('course');
  if (!student) throw new AppError('Student profile not found', 404);

  if (type === 'change_course' && String(student.course._id) === String(courseId))
    throw new AppError('You are already enrolled in this course', 400);

  const existing = await courseRequestRepository.findPendingByStudent(studentId);
  if (existing) throw new AppError('You already have a pending course request', 400);

  return courseRequestRepository.create({
    student: studentId,
    user: userId,
    type,
    currentCourse: student.course._id,
    requestedCourse: courseId,
    reason,
  });
};

const getMyRequests = (studentId) => courseRequestRepository.findByStudent(studentId);

const getAllRequests = (status) => {
  const filter = status ? { status } : {};
  return courseRequestRepository.findAll(filter);
};

const reviewRequest = async ({ requestId, adminId, action, adminNote }) => {
  const request = await courseRequestRepository.findById(requestId);
  if (!request) throw new AppError('Request not found', 404);
  if (request.status !== 'pending') throw new AppError('Request already reviewed', 400);

  if (action === 'approve') {
    await Student.findByIdAndUpdate(request.student, { course: request.requestedCourse._id });
  }

  return courseRequestRepository.updateById(requestId, {
    status: action === 'approve' ? 'approved' : 'rejected',
    adminNote: adminNote || null,
    reviewedBy: adminId,
    reviewedAt: new Date(),
  });
};

export const courseRequestService = {
  submitRequest,
  getMyRequests,
  getAllRequests,
  reviewRequest,
};
