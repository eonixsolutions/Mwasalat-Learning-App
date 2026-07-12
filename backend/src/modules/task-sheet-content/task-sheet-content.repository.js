import TaskSheetContent from './task-sheet-content.model.js';

const findByCourseAndWeek = (courseId, week) =>
  TaskSheetContent.findOne({ course: courseId, week }).lean();

const findByCourse = (courseId) =>
  TaskSheetContent.find({ course: courseId })
    .select('course program week topicsOverview isPublished days createdAt updatedAt')
    .sort({ week: 1 })
    .lean();

const findPublishedByCourseAndWeek = (courseId, week) =>
  TaskSheetContent.findOne({ course: courseId, week, isPublished: true }).lean();

const findPublishedByCourse = (courseId) =>
  TaskSheetContent.find({ course: courseId, isPublished: true })
    .select('course program week topicsOverview days isPublished createdAt updatedAt')
    .sort({ week: 1 })
    .lean();

const create = (data) => TaskSheetContent.create(data);

const updateById = (id, data) =>
  TaskSheetContent.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();

const deleteById = (id) => TaskSheetContent.findByIdAndDelete(id);

const setPublished = (id, isPublished) =>
  TaskSheetContent.findByIdAndUpdate(id, { isPublished }, { new: true }).lean();

export const taskSheetContentRepository = {
  findByCourseAndWeek,
  findByCourse,
  findPublishedByCourse,
  findPublishedByCourseAndWeek,
  create,
  updateById,
  deleteById,
  setPublished,
};
