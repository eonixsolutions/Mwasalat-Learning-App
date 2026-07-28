import cron from 'node-cron';
import logger from '../utils/logger.js';
import { getOrgTimezone } from '../utils/orgTimezone.js';

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

// Runs hourly — archives Mwasalat courses whose deletion grace period (see
// remove() in mwasalatProgram.service.js) has elapsed
const runMwasalatScheduledDeletions = async () => {
  try {
    const { mwasalatProgramService } = await import('../modules/mwasalatProgram/mwasalatProgram.service.js');
    const count = await mwasalatProgramService.runScheduledDeletions();
    if (count > 0) logger.info(`[scheduler] Archived ${count} Mwasalat program(s) past their deletion grace period`);
  } catch (err) {
    logger.error('[scheduler] runMwasalatScheduledDeletions failed:', err);
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

// Runs daily — checks enrollments against their course's completion deadline
// (if one is set): notifies a supervisor once for an overdue mandatory
// internal course, or walks an overdue external-learner enrollment through a
// warning then a lock (see runDeadlineSweep).
const runMwasalatDeadlineSweep = async () => {
  try {
    const { mwasalatProgramService } = await import('../modules/mwasalatProgram/mwasalatProgram.service.js');
    const { checked, supervisorNotified, warned, locked } = await mwasalatProgramService.runDeadlineSweep();
    logger.info(`[scheduler] Mwasalat deadline sweep: ${checked} overdue, ${supervisorNotified} supervisor(s) notified, ${warned} warned, ${locked} locked`);
  } catch (err) {
    logger.error('[scheduler] runMwasalatDeadlineSweep failed:', err);
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

// Runs daily — silently renews certificates for courses with autoRenewCertificate
// enabled, shortly before they'd otherwise expire.
const runMwasalatCertificateAutoRenewal = async () => {
  try {
    const { mwasalatProgramService } = await import('../modules/mwasalatProgram/mwasalatProgram.service.js');
    const count = await mwasalatProgramService.autoRenewExpiringCertificates();
    if (count > 0) logger.info(`[scheduler] Mwasalat certificate auto-renewal: ${count} renewed`);
  } catch (err) {
    logger.error('[scheduler] runMwasalatCertificateAutoRenewal failed:', err);
  }
};

// Cron zone is read once at boot from the org's configured timezone (Settings →
// timezone, default Asia/Muscat) — changing it later requires a server restart
// to take effect, same as any other config read at startup.
export const startScheduler = async () => {
  const timezone = await getOrgTimezone();

  // Every hour
  cron.schedule('0 * * * *', archiveExpiredMwasalatPrograms, { timezone });
  logger.info(`[scheduler] Mwasalat program expiry check active (hourly, ${timezone})`);

  // Every hour, 5 minutes past — after the expiry check
  cron.schedule('5 * * * *', runMwasalatScheduledDeletions, { timezone });
  logger.info(`[scheduler] Mwasalat scheduled-deletion sweep active (hourly, ${timezone})`);

  // Every day at 3am
  cron.schedule('0 3 * * *', runMwasalatEngagementSweep, { timezone });
  logger.info(`[scheduler] Mwasalat engagement sweep active (daily 3am, ${timezone})`);

  // Every day at 3:15am — after the engagement sweep
  cron.schedule('15 3 * * *', runMwasalatDeadlineSweep, { timezone });
  logger.info(`[scheduler] Mwasalat deadline sweep active (daily 3:15am, ${timezone})`);

  // Every Monday at 8am
  cron.schedule('0 8 * * 1', sendMwasalatInstructorDigests, { timezone });
  logger.info(`[scheduler] Mwasalat instructor weekly digest active (Monday 8am, ${timezone})`);

  // Every day at 3:30am
  cron.schedule('30 3 * * *', sendMwasalatCertificateExpiryReminders, { timezone });
  logger.info(`[scheduler] Mwasalat certificate expiry reminders active (daily 3:30am, ${timezone})`);

  // Every day at 4am — after reminders, so a cert renewed today doesn't also fire a redundant reminder
  cron.schedule('0 4 * * *', runMwasalatCertificateAutoRenewal, { timezone });
  logger.info(`[scheduler] Mwasalat certificate auto-renewal active (daily 4am, ${timezone})`);
};
