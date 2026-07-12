import { reviewRepository } from './review.repository.js';
import { AppError } from '../../utils/AppError.js';
import { notifyUser, notifyRole } from '../notification/notification.service.js';
import { NOTIFICATION_TYPES, ROLES } from '../../constants/index.js';
import { studentRepository } from '../student/student.repository.js';

const SCREENING_RETRY_DAYS = 5;

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

// ── Student ───────────────────────────────────────────────────────────────────

const getMyReviews = async (userId) => {
  const Student = (await import('../student/student.model.js')).default;
  const student = await Student.findOne({ user: userId });
  if (!student) throw new AppError('Student profile not found', 404);
  return reviewRepository.findAllByStudent(student._id);
};

// Returns all completed reviews for a specific past enrollment — for the performance panel.
// studentId here is the Student doc _id (enrollment ID), not the user ID.
const getEnrollmentReviews = async (userId, studentId) => {
  const Student = (await import('../student/student.model.js')).default;
  const enrollment = await Student.findOne({ _id: studentId, user: userId });
  if (!enrollment) throw new AppError('Enrollment not found', 404);
  return reviewRepository.findAllByStudent(enrollment._id);
};

// Student fetches available (unbooked) slots for their review
const getAvailableSlotsForReview = async (userId, reviewId) => {
  const Student = (await import('../student/student.model.js')).default;
  const student = await Student.findOne({ user: userId });
  if (!student) throw new AppError('Student profile not found', 404);

  const review = await reviewRepository.findById(reviewId);
  if (!review) throw new AppError('Review not found', 404);
  if (String(review.student._id ?? review.student) !== String(student._id)) {
    throw new AppError('Not your review', 403);
  }

  const allSlots = await reviewRepository.findSlotsByReview(review._id);
  const slots = allSlots.filter((s) => !s.isBooked);

  // Filter out slots that fall on the student's approved leave dates
  const { leaveRepository } = await import('../leave/leave.repository.js');
  const now = new Date();
  const maxSlotDate = slots.reduce((max, s) => (s.scheduledAt > max ? s.scheduledAt : max), now);
  const leaveDates = await leaveRepository.findApprovedLeaveDatesInRange(student._id, now, maxSlotDate);

  if (!leaveDates.size) return slots;

  return slots.filter((slot) => {
    const day = new Date(slot.scheduledAt).toISOString().split('T')[0];
    return !leaveDates.has(day);
  });
};

// Student books an available slot
const bookSlot = async (userId, reviewId, slotId) => {
  const Student = (await import('../student/student.model.js')).default;
  const student = await Student.findOne({ user: userId });
  if (!student) throw new AppError('Student profile not found', 404);

  const review = await reviewRepository.findById(reviewId);
  if (!review) throw new AppError('Review not found', 404);
  if (String(review.student._id ?? review.student) !== String(student._id)) {
    throw new AppError('Not your review', 403);
  }
  if (review.status === 'completed') throw new AppError('Review already completed', 400);

  const slot = await reviewRepository.findSlotById(slotId);
  if (!slot) throw new AppError('Slot not found', 404);
  if (slot.isBooked) throw new AppError('Slot already booked', 409);

  // Release previously booked slot if re-booking
  if (review.slot) {
    await reviewRepository.updateSlotById(review.slot, { isBooked: false, bookedBy: null });
  }

  await reviewRepository.updateSlotById(slotId, { isBooked: true, bookedBy: student._id });
  const updated = await reviewRepository.updateById(reviewId, { status: 'slot_booked', slot: slotId });

  // Auto-delete all other unbooked slots for this review — mentor prepared only these slots for this student
  await reviewRepository.deleteUnbookedSlotsByReview(review._id, slotId);

  // Notify the mentor who created this slot
  const slotDate = new Date(slot.scheduledAt).toLocaleString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const sectionLabel = review.reviewType === 'screening'
    ? `Part ${review.part} Screening`
    : `Week ${review.weekNumber} Review`;
  await student.populate('user', 'name');
  const studentName = student.user?.name ?? 'A student';

  notifyUser(slot.createdBy, {
    type:       NOTIFICATION_TYPES.REVIEW_SCHEDULED,
    title:      'Review Slot Booked',
    message:    `${studentName} has booked your ${slotDate} slot for their ${sectionLabel}.`,
    data:       { reviewId },
    targetRole: 'technical_mentor',
  }).catch(() => {});

  return updated;
};

// ── Staff ─────────────────────────────────────────────────────────────────────

const getPendingReviews = async (staffUserId) => {
  const staffRepository = (await import('../staff/staff.repository.js')).staffRepository;
  const staff = await staffRepository.findStaffByUserId(staffUserId);
  if (!staff) throw new AppError('Staff profile not found', 404);

  const allCourses = await (await import('../course/course.model.js')).default.find({ isActive: true }, '_id');
  const courseIds = allCourses.map((c) => c._id);
  return reviewRepository.findPendingReviews(courseIds);
};

// Coordinator/mentor adds a time slot scoped to a specific student's review
const addSlot = async (staffUserId, data) => {
  const { reviewId, scheduledAt, meetingLink } = data;

  const review = await reviewRepository.findById(reviewId);
  if (!review) throw new AppError('Review not found', 404);
  if (review.status === 'completed') throw new AppError('This review is already completed', 400);

  const slotDate = new Date(scheduledAt);

  if (slotDate.getDay() === 0)
    throw new AppError('Slots cannot be scheduled on Sundays', 400);

  if (review.earliestDate && slotDate < new Date(review.earliestDate))
    throw new AppError(
      `Cannot schedule before ${new Date(review.earliestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      400
    );

  const { holidayRepository } = await import('../holiday/holiday.repository.js');
  const holiday = await holidayRepository.findHolidayOnDate(slotDate);
  if (holiday) throw new AppError(`${holiday.name} is a holiday — slots cannot be scheduled on this day`, 400);

  const conflict = await reviewRepository.findConflictingSlot(staffUserId, scheduledAt);
  if (conflict) {
    throw new AppError(
      `You already have a slot scheduled within 1 hour of this time (${new Date(conflict.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}). Each slot requires at least 1 hour gap.`,
      409
    );
  }

  const slot = await reviewRepository.createSlot({
    review:     review._id,
    course:     review.course,
    reviewType: review.reviewType,
    part:       review.part ?? null,
    weekNumber: review.weekNumber ?? null,
    scheduledAt,
    meetingLink,
    createdBy:  staffUserId,
  });

  // Notify only the student whose review this slot belongs to
  // review.student.user is an ObjectId (not nested-populated) — use it directly
  const studentUserId = review.student?.user;
  if (studentUserId) {
    const formattedSlotDate = new Date(scheduledAt).toLocaleString('en-IN', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    const sectionLabel = review.reviewType === 'screening'
      ? `Part ${review.part} Screening`
      : `Week ${review.weekNumber} Review`;

    notifyUser(studentUserId, {
      type:       NOTIFICATION_TYPES.REVIEW_SCHEDULED,
      title:      'Review Slot Available',
      message:    `A slot has been added for your ${sectionLabel} on ${formattedSlotDate}. Open your Screenings tab to book a time.`,
      data:       { reviewId: review._id },
      targetRole: 'student',
    }).catch(() => {});
  }

  return slot;
};

const updateSlot = async (slotId, staffUserId, { scheduledAt, meetingLink }) => {
  const slot = await reviewRepository.findSlotById(slotId);
  if (!slot) throw new AppError('Slot not found', 404);
  if (slot.isBooked) throw new AppError('Cannot edit a slot that has already been booked by a student', 400);

  const conflict = await reviewRepository.findConflictingSlot(staffUserId, scheduledAt, slotId);
  if (conflict) {
    throw new AppError(
      `You already have a slot scheduled within 1 hour of this time (${new Date(conflict.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}). Each slot requires at least 1 hour gap.`,
      409
    );
  }
  return reviewRepository.updateSlotById(slotId, { scheduledAt, meetingLink });
};

const getSlots = async (reviewId) => reviewRepository.findSlotsByReview(reviewId);

const deleteSlot = async (slotId, staffUserId) => {
  const slot = await reviewRepository.findSlotById(slotId);
  if (!slot) throw new AppError('Slot not found', 404);
  if (slot.isBooked) throw new AppError('Cannot delete a booked slot', 400);
  await reviewRepository.deleteSlotById(slotId);
};

// Mark pass/fail + add notes
const completeReview = async (reviewId, staffUserId, { result, marks, remarks, pendingTopics }) => {
  const review = await reviewRepository.findById(reviewId);
  if (!review) throw new AppError('Review not found', 404);
  if (review.status === 'pending_slot') throw new AppError('Student has not booked a slot yet', 400);

  const updated = await reviewRepository.updateById(reviewId, {
    status: 'completed',
    result,
    marks: marks ?? null,
    remarks: remarks ?? null,
    pendingTopics: pendingTopics ?? [],
    reviewedBy: staffUserId,
    reviewedAt: new Date(),
  });

  const studentId = review.student._id ?? review.student;

  if (result === 'pass') {
    const { progressService } = await import('../progress/progress.service.js');
    await progressService.unlockNextSection(studentId, review);

    // Determine whether this is the final review for the course.
    // We compare against the course structure (not attempt counts), so retries never
    // incorrectly trigger graduation — only the actual last defined part/week does.
    const Course = (await import('../course/course.model.js')).default;
    const Student = (await import('../student/student.model.js')).default;

    const [course, student] = await Promise.all([
      Course.findById(review.course._id ?? review.course).lean(),
      Student.findById(studentId).populate('user', '_id name').populate('batch', '_id'),
    ]);

    const isFinalReview = (() => {
      if (!course) return false;
      if (review.reviewType === 'screening' && course.screenings?.length) {
        const maxPart = Math.max(...course.screenings.map((s) => s.part));
        return review.part === maxPart;
      }
      if (review.reviewType === 'weekly') {
        return review.weekNumber === course.durationWeeks;
      }
      return false;
    })();

    if (isFinalReview && student) {
      await studentRepository.updateById(studentId, {
        studentStatus: 'graduated',
        graduatedAt:   new Date(),
      });

      if (student.user) {
        notifyUser(student.user._id, {
          type:       NOTIFICATION_TYPES.COURSE_COMPLETED,
          title:      'Course Completed!',
          message:    `Congratulations! You have successfully completed the ${course.name} course. We are proud of your achievement!`,
          targetRole: 'student',
        }).catch(() => {});
      }

      // Notify coordinators and admins so they know to handle the student's next steps
      notifyRole([ROLES.BRANCH_COORDINATOR, ROLES.BRANCH_ADMIN, ROLES.SUPER_ADMIN], {
        type:    NOTIFICATION_TYPES.COURSE_COMPLETED,
        title:   'Student Graduated',
        message: `${student.user?.name ?? 'A student'} has completed the ${course.name} course and has been marked as graduated.`,
        data:    { studentId },
      }).catch(() => {});

    } else if (student?.user) {
      // Intermediate pass — tell the student they can continue
      const passMsg = review.reviewType === 'screening'
        ? `Congratulations! You passed the Part ${review.part} Screening. You can now continue to the next week.`
        : `Your Week ${review.weekNumber} review passed. Keep going!`;

      notifyUser(student.user._id, {
        type:       NOTIFICATION_TYPES.REVIEW_RESULT,
        title:      'Review Passed!',
        message:    passMsg,
        targetRole: 'student',
      }).catch(() => {});
    }
  }

  if (result === 'fail') {
    // Wipe all slots tied to this specific review record — fresh slate for the retry
    await reviewRepository.deleteSlotsByFilter({ review: reviewId });
  }

  if (result === 'fail' && review.reviewType === 'weekly') {
    const retryReview = await reviewRepository.create({
      student:    studentId,
      course:     review.course,
      reviewType: 'weekly',
      weekNumber: review.weekNumber,
      status:     'pending_slot',
      attempt:    (review.attempt ?? 1) + 1,
    });

    const Student = (await import('../student/student.model.js')).default;
    const student = await Student.findById(studentId).populate('user', '_id name').populate('batch', '_id');
    if (student?.user) {
      notifyUser(student.user._id, {
        type:       NOTIFICATION_TYPES.REVIEW_RESULT,
        title:      'Week Review — Retry Scheduled',
        message:    `You did not pass the Week ${review.weekNumber} review. A retry will be scheduled — keep practicing the topics your mentor flagged!`,
        data:       { reviewId: retryReview._id },
        targetRole: 'student',
      }).catch(() => {});
    }

    if (student?.batch) {
      const { staffRepository } = await import('../staff/staff.repository.js');
      const batchId = student.batch?._id ?? student.batch;
      const mentors = await staffRepository.findMentorsByBatch(batchId);
      await Promise.allSettled(mentors.map(m =>
        notifyUser(m.user._id, {
          type:       NOTIFICATION_TYPES.SCREENING_RESCHEDULED,
          title:      'Weekly Review Retry Needed',
          message:    `${student.user?.name ?? 'A student'} did not pass the Week ${review.weekNumber} review. Please add retry slots for them.`,
          data:       { studentId, weekNumber: review.weekNumber },
          targetRole: 'technical_mentor',
        })
      ));
    }
  }

  if (result === 'fail' && review.reviewType === 'screening') {
    const retryFuture = new Date(Date.now() + SCREENING_RETRY_DAYS * 24 * 60 * 60 * 1000);
    retryFuture.setUTCHours(0, 0, 0, 0);
    const earliestDate = await nextWorkingDay(retryFuture);

    // Create a retry review record
    const retryReview = await reviewRepository.create({
      student:     studentId,
      course:      review.course,
      reviewType:  'screening',
      part:        review.part,
      status:      'pending_slot',
      earliestDate,
      attempt:     (review.attempt ?? 1) + 1,
    });

    // Notify the student
    const Student = (await import('../student/student.model.js')).default;
    const student = await Student.findById(studentId).populate('user', '_id').populate('batch', '_id');
    if (student?.user) {
      notifyUser(student.user._id, {
        type:       NOTIFICATION_TYPES.REVIEW_RESULT,
        title:      'Screening — Retry Scheduled',
        message:    `You did not pass Part ${review.part} Screening. A retry will be available after ${earliestDate.toDateString()}. Keep practicing!`,
        data:       { reviewId: retryReview._id, earliestDate },
        targetRole: 'student',
      }).catch(() => {});
    }

    // Notify batch mentors to add new slots for the retry
    if (student?.batch) {
      const { staffRepository } = await import('../staff/staff.repository.js');
      const batchId = student.batch?._id ?? student.batch;
      const mentors = await staffRepository.findMentorsByBatch(batchId);
      await Promise.allSettled(mentors.map((m) =>
        notifyUser(m.user._id, {
          type:       NOTIFICATION_TYPES.SCREENING_RESCHEDULED,
          title:      'Screening Retry Needed',
          message:    `${student.user?.name ?? 'A student'} did not pass Part ${review.part} Screening. Please add retry slots available after ${earliestDate.toDateString()}.`,
          data:       { studentId, part: review.part, earliestDate },
          targetRole: 'technical_mentor',
        })
      ));
    }
  }

  return updated;
};

// Called by holiday service — flags slots on that date and asks mentors to decide
const cancelSlotsOnDate = async (date, holidayName) => {
  const dayStart = new Date(date); dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd   = new Date(date); dayEnd.setUTCHours(23, 59, 59, 999);

  // Flag all slots on this date
  await reviewRepository.updateSlotsByFilter(
    { scheduledAt: { $gte: dayStart, $lte: dayEnd } },
    { holidayConflict: true }
  );

  // Notify each affected mentor once (group by createdBy)
  const slots = await reviewRepository.findSlotsByDateRange(dayStart, dayEnd);
  const formattedDate = new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const mentorsSeen   = new Set();

  for (const slot of slots) {
    const mentorId = String(slot.createdBy);
    if (mentorsSeen.has(mentorId)) continue;
    mentorsSeen.add(mentorId);
    notifyUser(slot.createdBy, {
      type:       NOTIFICATION_TYPES.REVIEW_SCHEDULED,
      title:      'Holiday Conflict — Action Required',
      message:    `${holidayName ?? 'A holiday'} has been declared on ${formattedDate}. You have review slot(s) scheduled that day. Please go to Reviews and choose to keep or cancel each slot.`,
      targetRole: 'technical_mentor',
    }).catch(() => {});
  }
};

// Mentor resolves a holiday-conflicted slot: 'keep' or 'cancel'
const resolveHolidayConflict = async (slotId, staffUserId, action) => {
  const slot = await reviewRepository.findSlotById(slotId);
  if (!slot) throw new AppError('Slot not found', 404);
  if (!slot.holidayConflict) throw new AppError('This slot has no holiday conflict', 400);

  const formattedDate = new Date(slot.scheduledAt).toLocaleString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  if (action === 'keep') {
    await reviewRepository.updateSlotById(slotId, { holidayConflict: false });

    // Notify booked student that the slot is confirmed
    if (slot.isBooked) {
      const review = await reviewRepository.findReviewByBookedSlot(slotId);
      const studentUserId = review?.student?.user?._id;
      if (studentUserId) {
        notifyUser(studentUserId, {
          type:       NOTIFICATION_TYPES.REVIEW_SCHEDULED,
          title:      'Review Slot Confirmed',
          message:    `Your review slot on ${formattedDate} is confirmed — your mentor will conduct the session despite the holiday.`,
          targetRole: 'student',
        }).catch(() => {});
      }
    }
    return { action: 'kept' };
  }

  if (action === 'cancel') {
    if (slot.isBooked) {
      const review = await reviewRepository.findReviewByBookedSlot(slotId);
      if (review) {
        await reviewRepository.updateById(review._id, { status: 'pending_slot', slot: null });
        const studentUserId = review?.student?.user?._id;
        if (studentUserId) {
          notifyUser(studentUserId, {
            type:       NOTIFICATION_TYPES.REVIEW_SCHEDULED,
            title:      'Review Slot Cancelled',
            message:    `Your review slot on ${formattedDate} has been cancelled due to a holiday. New slots will be added soon — please book again.`,
            targetRole: 'student',
          }).catch(() => {});
        }
      }
    }
    await reviewRepository.deleteSlotById(slotId);

    // Notify batch mentors to add a replacement slot for the affected review
    const sectionLabel = slot.reviewType === 'screening'
      ? `Part ${slot.part} Screening`
      : `Week ${slot.weekNumber} Review`;

    // If slot is scoped to a specific review, use that; otherwise fall back to course/type/part filter
    const affectedReviews = slot.review
      ? [await reviewRepository.findById(slot.review)].filter(Boolean)
      : await reviewRepository.findPendingBySlotFilter((() => {
          const f = { course: slot.course, reviewType: slot.reviewType };
          if (slot.reviewType === 'screening') f.part       = slot.part;
          if (slot.reviewType === 'weekly')    f.weekNumber = slot.weekNumber;
          return f;
        })());

    const batchIds = [...new Set(
      affectedReviews.map(r => r.student?.batch?._id ?? r.student?.batch).filter(Boolean).map(String)
    )];

    if (batchIds.length) {
      const { staffRepository } = await import('../staff/staff.repository.js');
      await Promise.allSettled(
        batchIds.map(async (batchId) => {
          const mentors = await staffRepository.findMentorsByBatch(batchId);
          return Promise.allSettled(
            mentors.map(m => notifyUser(m.user._id, {
              type:       NOTIFICATION_TYPES.SCREENING_RESCHEDULED,
              title:      'New Slot Needed',
              message:    `A ${sectionLabel} slot was cancelled due to a holiday. Please add a replacement slot for the next available working day so the student can rebook.`,
              targetRole: 'technical_mentor',
            }))
          );
        })
      );
    }

    return { action: 'cancelled' };
  }

  throw new AppError('Action must be keep or cancel', 400);
};

export const reviewService = {
  getMyReviews,
  getEnrollmentReviews,
  getAvailableSlotsForReview,
  bookSlot,
  getPendingReviews,
  addSlot,
  updateSlot,
  getSlots,
  deleteSlot,
  completeReview,
  cancelSlotsOnDate,
  resolveHolidayConflict,
};
