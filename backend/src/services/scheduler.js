import cron from 'node-cron';
import logger from '../utils/logger.js';

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

// Runs daily — scores every active enrollment's churn risk and sends
// escalating 3/7/14-day inactivity nudges (see computeEngagementAndNudge).
const runMwasalatEngagementSweep = async () => {
  try {
    const { mwasalatProgramService } = await import('../modules/mwasalatProgram/mwasalatProgram.service.js');
    const { scored, nudged } = await mwasalatProgramService.computeEngagementAndNudge();
    logger.info(`[scheduler] Mwasalat engagement sweep: ${scored} scored, ${nudged} nudged`);
  } catch (err) {
    logger.error('[scheduler] runMwasalatEngagementSweep failed:', err);
  }
};

// Runs weekly (Monday morning) — emails each instructor a per-course digest.
const sendMwasalatInstructorDigests = async () => {
  try {
    const { mwasalatProgramService } = await import('../modules/mwasalatProgram/mwasalatProgram.service.js');
    const count = await mwasalatProgramService.sendWeeklyInstructorDigests();
    logger.info(`[scheduler] Mwasalat weekly instructor digest: ${count} email(s) sent`);
  } catch (err) {
    logger.error('[scheduler] sendMwasalatInstructorDigests failed:', err);
  }
};

// Runs daily — emails + notifies learners whose certificate expires within 30 days.
const sendMwasalatCertificateExpiryReminders = async () => {
  try {
    const { mwasalatProgramService } = await import('../modules/mwasalatProgram/mwasalatProgram.service.js');
    const count = await mwasalatProgramService.sendCertificateExpiryReminders();
    if (count > 0) logger.info(`[scheduler] Mwasalat certificate expiry reminders: ${count} sent`);
  } catch (err) {
    logger.error('[scheduler] sendMwasalatCertificateExpiryReminders failed:', err);
  }
};

export const startScheduler = () => {
  // Every hour
  cron.schedule('0 * * * *', archiveExpiredMwasalatPrograms, { timezone: 'Asia/Kolkata' });
  logger.info('[scheduler] Mwasalat program expiry check active (hourly)');

  // Every day at 3am
  cron.schedule('0 3 * * *', runMwasalatEngagementSweep, { timezone: 'Asia/Kolkata' });
  logger.info('[scheduler] Mwasalat engagement sweep active (daily 3am)');

  // Every Monday at 8am
  cron.schedule('0 8 * * 1', sendMwasalatInstructorDigests, { timezone: 'Asia/Kolkata' });
  logger.info('[scheduler] Mwasalat instructor weekly digest active (Monday 8am)');

  // Every day at 3:30am
  cron.schedule('30 3 * * *', sendMwasalatCertificateExpiryReminders, { timezone: 'Asia/Kolkata' });
  logger.info('[scheduler] Mwasalat certificate expiry reminders active (daily 3:30am)');
};
