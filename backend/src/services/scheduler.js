import cron from 'node-cron';
import logger from '../utils/logger.js';

// Runs at 09:00 every day — reminds batch mentors to add slots for screenings
// that become schedulable tomorrow if no slots exist yet.
const remindMentorsForUpcomingScreenings = async () => {
  try {
    const Review     = (await import('../modules/review/review.model.js')).default;
    const ReviewSlot = (await import('../modules/review/review-slot.model.js')).default;
    const { staffRepository }  = await import('../modules/staff/staff.repository.js');
    const { notifyUser }       = await import('../modules/notification/notification.service.js');
    const { NOTIFICATION_TYPES } = await import('../constants/index.js');

    const tomorrowStart = new Date();
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const pendingReviews = await Review.find({
      status:      'pending_slot',
      earliestDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
    })
      .populate({ path: 'student', populate: [
        { path: 'user',  select: 'name' },
        { path: 'batch', select: '_id name' },
      ]})
      .populate('course', 'name');

    if (!pendingReviews.length) return;

    // Group by course+reviewType+part/weekNumber so we only send one reminder per slot bucket
    const buckets = new Map();
    for (const review of pendingReviews) {
      const key = `${review.course?._id}-${review.reviewType}-${review.part ?? review.weekNumber}`;
      if (!buckets.has(key)) buckets.set(key, { review, students: [] });
      buckets.get(key).students.push(review.student);
    }

    for (const { review, students } of buckets.values()) {
      const slotFilter = { course: review.course?._id ?? review.course, reviewType: review.reviewType };
      if (review.reviewType === 'screening') slotFilter.part       = review.part;
      if (review.reviewType === 'weekly')    slotFilter.weekNumber = review.weekNumber;

      const hasSlots = await ReviewSlot.exists(slotFilter);
      if (hasSlots) continue;

      const sectionLabel = review.reviewType === 'screening'
        ? `Part ${review.part} Screening`
        : `Week ${review.weekNumber} Review`;

      const earliestStr = tomorrowStart.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      });

      // Collect unique batch IDs from affected students
      const batchIds = [...new Set(
        students.map(s => String(s?.batch?._id ?? s?.batch)).filter(Boolean)
      )];

      await Promise.allSettled(
        batchIds.map(async (batchId) => {
          const mentors = await staffRepository.findMentorsByBatch(batchId);
          return Promise.allSettled(
            mentors.map(m => notifyUser(m.user._id, {
              type:       NOTIFICATION_TYPES.SCREENING_TRIGGERED,
              title:      'Reminder: Add Screening Slots',
              message:    `The ${sectionLabel} for ${review.course?.name ?? 'your course'} can be scheduled from tomorrow (${earliestStr}). No slots have been added yet — please add your available times so students can book.`,
              data:       { part: review.part, weekNumber: review.weekNumber },
              targetRole: 'technical_mentor',
            }))
          );
        })
      );

      logger.info(`[scheduler] Sent slot reminder for ${sectionLabel} — ${batchIds.length} batch(es)`);
    }
  } catch (err) {
    logger.error('[scheduler] remindMentorsForUpcomingScreenings failed:', err);
  }
};

// Runs hourly — archives Mwasalat courses whose expiry date has passed
const archiveExpiredMwasalatPrograms = async () => {
  try {
    const { mwasalatProgramService } = await import('../modules/mwasalatProgram/mwasalatProgram.service.js');
    const count = await mwasalatProgramService.archiveExpired();
    if (count > 0) logger.info(`[scheduler] Archived ${count} expired Mwasalat program(s)`);
  } catch (err) {
    logger.error('[scheduler] archiveExpiredMwasalatPrograms failed:', err);
  }
};

export const startScheduler = () => {
  // Every day at 09:00
  cron.schedule('0 9 * * *', remindMentorsForUpcomingScreenings, { timezone: 'Asia/Kolkata' });
  logger.info('[scheduler] Started — slot reminder cron active (09:00 IST daily)');

  // Every hour
  cron.schedule('0 * * * *', archiveExpiredMwasalatPrograms, { timezone: 'Asia/Kolkata' });
  logger.info('[scheduler] Mwasalat program expiry check active (hourly)');
};
