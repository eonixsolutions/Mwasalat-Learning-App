import { videoRepository } from './video.repository.js';
import { studentRepository } from '../student/student.repository.js';
import { AppError } from '../../utils/AppError.js';

const getMyVideos = async (userId) => {
  const student = await studentRepository.findByUserId(userId);
  if (!student) throw new AppError('Student profile not found', 404);
  if (!student.course) throw new AppError('No course enrolled', 400);
  const courseId = student.course._id ?? student.course;
  return videoRepository.findByCourse(courseId, { publishedOnly: true });
};

const listAll = async ({ course } = {}) => {
  const filters = {};
  if (course) filters.course = course;
  return videoRepository.findAll(filters);
};

const create = async (data, userId) => {
  return videoRepository.create({ ...data, createdBy: userId });
};

const update = async (id, data) => {
  const existing = await videoRepository.findById(id);
  if (!existing) throw new AppError('Video not found', 404);
  return videoRepository.updateById(id, data);
};

const remove = async (id) => {
  const existing = await videoRepository.findById(id);
  if (!existing) throw new AppError('Video not found', 404);
  return videoRepository.deleteById(id);
};

export const videoService = { getMyVideos, listAll, create, update, remove };
