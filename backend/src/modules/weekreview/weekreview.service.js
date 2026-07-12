import { weekReviewRepository } from './weekreview.repository.js';
import { studentRepository } from '../student/student.repository.js';
import { reviewRepository } from '../review/review.repository.js';
import { staffRepository } from '../staff/staff.repository.js';
import Course from '../course/course.model.js';
import { notifyUser } from '../notification/notification.service.js';
import { AppError } from '../../utils/AppError.js';
import { NOTIFICATION_TYPES } from '../../constants/index.js';

// Notify all mentors assigned to a batch (fire-and-forget)
const notifyBatchMentors = async (batchId, notification) => {
  if (!batchId) return;
  const mentors = await staffRepository.findMentorsByBatch(batchId);
  await Promise.allSettled(
    mentors.map((m) => notifyUser(m.user._id, { targetRole: 'technical_mentor', ...notification }))
  );
};

const DEFAULT_DAYS = 6;

// Advance past Sundays and holidays so earliestDate is always a valid working day
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

// Derive week-level status from the days array.
// totalDays = how many task-sheet days exist for this week (may be < 6, e.g. Week 3 has 3).
const computeWeekStatus = (days, totalDays = DEFAULT_DAYS) => {
  const approvedCount = days.filter(d => d.status === 'approved').length;
  if (totalDays > 0 && approvedCount >= totalDays) return 'approved';
  if (days.some(d => d.status === 'corrections_requested')) return 'corrections_requested';
  return 'in_progress';
};

const submitDay = async (userId, week, day) => {
  const student = await studentRepository.findByUserId(userId);
  if (!student) throw new AppError('Student profile not found', 404);
  if (student.studentStatus === 'graduated') throw new AppError('Course completed. No further submissions required.', 403);
  if (student.taskSheetStatus !== 'done') throw new AppError('Task sheet has not been provisioned yet', 400);

  if (week > student.currentWeek) {
    throw new AppError('This week is locked. Complete any pending screenings or reviews first.', 403);
  }

  // Fee access check — block if student hasn't paid for this week
  const FeeAccount = (await import('../fees/fee-account.model.js')).default;
  const feeAccount = await FeeAccount.findOne({ student: student._id }).select('accessValidUntilWeek').lean();
  if (feeAccount && week > feeAccount.accessValidUntilWeek) {
    throw new AppError(
      `Week ${week} is locked. Pay your fee installment to unlock access beyond Week ${feeAccount.accessValidUntilWeek}.`,
      403
    );
  }

  if (week > 1) {
    const prevReview = await weekReviewRepository.findByStudentAndWeek(student._id, week - 1);
    if (!prevReview || prevReview.status !== 'approved') {
      throw new AppError(`Week ${week - 1} must be fully approved before starting Week ${week}`, 400);
    }
  }

  const weekReview = await weekReviewRepository.findOrCreate(student._id, week);

  const existingDay = weekReview.days.find(d => d.day === day);
  if (existingDay) {
    if (existingDay.status === 'approved')   throw new AppError(`Day ${day} is already approved`, 409);
    if (existingDay.status === 'submitted')  throw new AppError(`Day ${day} is already submitted and awaiting review`, 409);
    // corrections_requested — allow resubmission
    existingDay.status      = 'submitted';
    existingDay.mentorNote  = null;
    existingDay.submittedAt = new Date();
    existingDay.reviewedAt  = null;
    existingDay.reviewedBy  = null;
  } else {
    weekReview.days.push({ day, status: 'submitted', submittedAt: new Date() });
  }

  const weekDays = (student.taskSheetFiles ?? []).filter(f => f.week === week).length || DEFAULT_DAYS;
  weekReview.status = computeWeekStatus(weekReview.days, weekDays);
  const saved = await weekReview.save();

  // Notify batch mentors that the student submitted a day
  notifyBatchMentors(student.batch?._id ?? student.batch, {
    type: NOTIFICATION_TYPES.DAY_SUBMITTED,
    title: 'Task Submitted',
    message: `${student.user?.name ?? 'A student'} submitted Day ${day} of Week ${week}.`,
    data: { studentId: student._id, week, day },
  }).catch(() => {});

  return saved;
};

const reviewDay = async (reviewId, dayId, { status, mentorNote }, reviewerId) => {
  const weekReview = await weekReviewRepository.findById(reviewId);
  if (!weekReview) throw new AppError('Review not found', 404);

  const dayEntry = weekReview.days.id(dayId);
  if (!dayEntry) throw new AppError('Day entry not found', 404);
  if (dayEntry.status !== 'submitted') throw new AppError('Only submitted days can be reviewed', 400);

  if (status === 'corrections_requested' && !mentorNote?.trim()) {
    throw new AppError('A note is required when requesting corrections', 400);
  }

  dayEntry.status      = status;
  dayEntry.mentorNote  = mentorNote?.trim() ?? null;
  dayEntry.reviewedAt  = new Date();
  dayEntry.reviewedBy  = reviewerId;

  const weekDays   = (weekReview.student?.taskSheetFiles ?? []).filter(f => f.week === weekReview.week).length || DEFAULT_DAYS;
  const prevStatus  = weekReview.status;
  weekReview.status = computeWeekStatus(weekReview.days, weekDays);
  await weekReview.save();

  // Advance currentWeek — or create a screening gate if the course requires one
  if (weekReview.status === 'approved' && prevStatus !== 'approved') {
    const student = await studentRepository.findById(weekReview.student._id.toString());
    if (student && student.currentWeek === weekReview.week) {
      const courseId = student.course?._id ?? student.course;
      const course = await Course.findById(courseId).lean();
      const triggered = course?.screenings?.find(s => Number(s.afterWeek) === Number(weekReview.week));

      if (triggered) {
        // Screening gate: create a screening review record so the student must pass before continuing
        const already = await reviewRepository.findByStudentAndPart(student._id, triggered.part);
        if (!already) {
          const bufferDays = triggered.bufferDays ?? 3;
          const futureDate = new Date(Date.now() + bufferDays * 24 * 60 * 60 * 1000);
          futureDate.setUTCHours(0, 0, 0, 0);
          const earliestDate = await nextWorkingDay(futureDate);
          await reviewRepository.create({
            student:      student._id,
            course:       student.course,
            reviewType:   'screening',
            part:         triggered.part,
            status:       'pending_slot',
            earliestDate,
          });
          notifyBatchMentors(student.batch?._id ?? student.batch, {
            type:    NOTIFICATION_TYPES.SCREENING_TRIGGERED,
            title:   'Screening Slot Needed',
            message: `${student.user?.name ?? 'A student'} completed Week ${weekReview.week} and has ${bufferDays} days of revision. Schedule Part ${triggered.part} Screening on or after ${earliestDate.toDateString()}.`,
            data:    { studentId: student._id, part: triggered.part, week: weekReview.week, earliestDate },
          }).catch(() => {});
        }
        // currentWeek intentionally left at weekReview.week — acts as a gate
      } else if (course?.reviewType === 'weekly') {
        // Code2Career: every completed week requires a weekly review before unlocking the next one
        const alreadyCreated = await reviewRepository.findByStudentAndWeek(student._id, weekReview.week);
        if (!alreadyCreated) {
          await reviewRepository.create({
            student:    student._id,
            course:     student.course,
            reviewType: 'weekly',
            weekNumber: weekReview.week,
            status:     'pending_slot',
          });
          notifyBatchMentors(student.batch?._id ?? student.batch, {
            type:    NOTIFICATION_TYPES.SCREENING_TRIGGERED,
            title:   'Weekly Review Needed',
            message: `${student.user?.name ?? 'A student'} completed Week ${weekReview.week}. Please schedule their Week ${weekReview.week} review.`,
            data:    { studentId: student._id, weekNumber: weekReview.week },
          }).catch(() => {});
        }
        // currentWeek stays at weekReview.week until the weekly review passes
      } else {
        await studentRepository.updateById(student._id, { currentWeek: weekReview.week + 1 });
      }
    }
  }

  return weekReview;
};

const getMyReviews = async (userId) => {
  const student = await studentRepository.findByUserId(userId);
  if (!student) throw new AppError('Student profile not found', 404);
  return weekReviewRepository.findAllByStudent(student._id);
};

const listPending  = async ()        => weekReviewRepository.findPending();
const listAll      = async (filters) => weekReviewRepository.findAll(filters);
const pendingCount = async ()        => weekReviewRepository.countPending();

export const weekReviewService = {
  submitDay,
  reviewDay,
  getMyReviews,
  listPending,
  listAll,
  pendingCount,
};
