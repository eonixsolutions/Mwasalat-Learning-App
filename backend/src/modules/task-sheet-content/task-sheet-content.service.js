import { taskSheetContentRepository } from './task-sheet-content.repository.js';
import { AppError } from '../../utils/AppError.js';
import { broadcastTaskSheetUpdate } from '../../sockets/socket.js';

const getPublishedWeek = async (courseId, week) => {
  const doc = await taskSheetContentRepository.findPublishedByCourseAndWeek(courseId, week);
  if (!doc) throw new AppError('Task sheet not found or not published', 404);
  return doc;
};

const getAdminWeek = async (courseId, week) => {
  const doc = await taskSheetContentRepository.findByCourseAndWeek(courseId, week);
  if (!doc) throw new AppError('Task sheet not found', 404);
  return doc;
};

const listByCourse = (courseId) =>
  taskSheetContentRepository.findByCourse(courseId);

const listPublishedByCourse = (courseId) =>
  taskSheetContentRepository.findPublishedByCourse(courseId);

const upsertWeek = async (courseId, week, body, userId) => {
  const existing = await taskSheetContentRepository.findByCourseAndWeek(courseId, week);
  if (existing) {
    return taskSheetContentRepository.updateById(existing._id, {
      ...body,
      course: courseId,
      week,
      updatedBy: userId,
    });
  }
  return taskSheetContentRepository.create({
    ...body,
    course: courseId,
    week,
    createdBy: userId,
    updatedBy: userId,
  });
};

const togglePublish = async (id, isPublished) => {
  const doc = await taskSheetContentRepository.setPublished(id, isPublished);
  if (!doc) throw new AppError('Task sheet not found', 404);
  broadcastTaskSheetUpdate(doc.course.toString(), doc.week);
  return doc;
};

const removeWeek = async (id) => {
  const doc = await taskSheetContentRepository.deleteById(id);
  if (!doc) throw new AppError('Task sheet not found', 404);
};

export const taskSheetContentService = {
  getPublishedWeek,
  getAdminWeek,
  listByCourse,
  listPublishedByCourse,
  upsertWeek,
  togglePublish,
  removeWeek,
};
