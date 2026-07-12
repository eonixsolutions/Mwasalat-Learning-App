import Review from './review.model.js';
import ReviewSlot from './review-slot.model.js';

// ── Review ────────────────────────────────────────────────────────────────────

const findOne = (filter) =>
  Review.findOne(filter);

const findLatest = (filter) =>
  Review.findOne(filter).sort({ createdAt: -1 });

const findById = (id) =>
  Review.findById(id)
    .populate('student', 'user batch')
    .populate('slot')
    .populate('reviewedBy', 'name email');

const findAllByStudent = (studentId) =>
  Review.find({ student: studentId })
    .populate('slot')
    .sort({ createdAt: -1 });

const findPendingReviews = (courseIds) =>
  Review.find({ course: { $in: courseIds }, status: { $ne: 'completed' } })
    .populate({ path: 'student', populate: [
      { path: 'user',  select: 'name email' },
      { path: 'batch', select: 'name' },
    ]})
    .populate('course', 'name reviewType')
    .populate('slot')
    .sort({ createdAt: 1 });

const findByStudentAndPart = (studentId, part) =>
  Review.findOne({ student: studentId, reviewType: 'screening', part });

const findByStudentAndWeek = (studentId, weekNumber) =>
  Review.findOne({ student: studentId, reviewType: 'weekly', weekNumber });

const findPendingBySlotFilter = (filter) =>
  Review.find({ ...filter, status: 'pending_slot' })
    .populate({ path: 'student', populate: [
      { path: 'user',  select: '_id name' },
      { path: 'batch', select: '_id' },
    ]});

const findPendingByStudent = (studentId) =>
  Review.find({ student: studentId, status: 'pending_slot' });

const create = (data) => Review.create(data);

const updateById = (id, data) =>
  Review.findByIdAndUpdate(id, data, { new: true });

// ── ReviewSlot ────────────────────────────────────────────────────────────────

const createSlot = (data) => ReviewSlot.create(data);

const findSlots = (filter) =>
  ReviewSlot.find(filter).sort({ scheduledAt: 1 });

const findSlotById = (id) => ReviewSlot.findById(id);

const updateSlotById = (id, data) =>
  ReviewSlot.findByIdAndUpdate(id, data, { new: true });

const deleteSlotById = (id) => ReviewSlot.findByIdAndDelete(id);

const findSlotsByReview = (reviewId) =>
  ReviewSlot.find({ review: reviewId }).sort({ scheduledAt: 1 });

const deleteUnbookedSlotsByReview = (reviewId, excludeSlotId = null) => {
  const filter = { review: reviewId, isBooked: false };
  if (excludeSlotId) filter._id = { $ne: excludeSlotId };
  return ReviewSlot.deleteMany(filter);
};

const deleteSlotsByFilter  = (filter)       => ReviewSlot.deleteMany(filter);
const updateSlotsByFilter  = (filter, data) => ReviewSlot.updateMany(filter, data);

const findSlotsByDateRange = (startDate, endDate) =>
  ReviewSlot.find({ scheduledAt: { $gte: startDate, $lte: endDate } });

const findReviewByBookedSlot = (slotId) =>
  Review.findOne({ slot: slotId, status: 'slot_booked' })
    .populate({ path: 'student', populate: { path: 'user', select: '_id name' } });

// Returns any slot by the same creator within 1 hour of scheduledAt (excludes excludeId when editing)
const findConflictingSlot = (createdBy, scheduledAt, excludeId = null) => {
  const t     = new Date(scheduledAt).getTime();
  const query = {
    createdBy,
    scheduledAt: { $gte: new Date(t - 60 * 60 * 1000), $lte: new Date(t + 60 * 60 * 1000) },
  };
  if (excludeId) query._id = { $ne: excludeId };
  return ReviewSlot.findOne(query);
};

export const reviewRepository = {
  findOne,
  findLatest,
  findById,
  findAllByStudent,
  findByStudentAndPart,
  findByStudentAndWeek,
  findPendingReviews,
  findPendingByStudent,
  findPendingBySlotFilter,
  deleteSlotsByFilter,
  updateSlotsByFilter,
  findSlotsByDateRange,
  findReviewByBookedSlot,
  create,
  updateById,
  createSlot,
  findSlots,
  findSlotsByReview,
  deleteUnbookedSlotsByReview,
  findSlotById,
  updateSlotById,
  deleteSlotById,
  findConflictingSlot,
};
