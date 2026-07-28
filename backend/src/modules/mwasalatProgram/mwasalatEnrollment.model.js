import mongoose from 'mongoose';
import { ENROLLMENT_STATUS } from './mwasalatProgram.constants.js';

const mwasalatEnrollmentSchema = new mongoose.Schema(
  {
    learner: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatProgram', required: true },
    status: {
      type: String,
      enum: Object.values(ENROLLMENT_STATUS),
      default: ENROLLMENT_STATUS.ENROLLED,
    },
    purchasedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    // Set when a 'pending_approval' enrollment is approved/rejected by the
    // course's instructor (or a super admin) — see approveEnrollment/rejectEnrollment.
    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', default: null },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true },
    // Learner-controlled pin — surfaces this course in the "Starred" shelf so it
    // doesn't get lost once someone has enrolled in a lot of courses.
    isStarred: { type: Boolean, default: false },
    contentOpenedAt: { type: Date, default: null },
    openedContentTypes: { type: [String], default: [] },
    // Distinct calendar days (YYYY-MM-DD) the learner opened the PDF — only used
    // when the course sets pdfDurationDays; drives fractional day-by-day PDF
    // progress instead of a single open/not-open flag.
    pdfOpenedDates: { type: [String], default: [] },
    // Furthest position (seconds) reached in an uploaded course video — only ever
    // increases, so seeking backward to rewatch never reduces recorded progress.
    videoFurthestSeconds: { type: Number, default: 0 },

    // Modular ("super course") progress — only meaningful when the program has
    // contentTypes including 'modular'. One entry per module the learner has
    // touched; a module with no entry here is simply untouched (0% complete).
    // Whether a module is *unlocked*/*complete* is always derived on the fly
    // from this against program.modules (see computeModuleStatus in
    // mwasalatProgram.service.js) — nothing here stores that directly.
    moduleProgress: {
      type: [
        {
          moduleId: { type: mongoose.Schema.Types.ObjectId, required: true },
          lessonsOpened: { type: [mongoose.Schema.Types.ObjectId], default: [] },
          completedAt: { type: Date, default: null },
        },
      ],
      default: [],
    },
    // Furthest position (seconds) reached per video/audio lesson — the
    // per-lesson analogue of videoFurthestSeconds above, used by modular
    // courses (which can have many video/audio lessons, not just one).
    lessonMediaProgress: {
      type: [
        {
          lessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
          furthestSeconds: { type: Number, default: 0 },
        },
      ],
      default: [],
    },

    // Engagement streak — consecutive calendar days (UTC) the learner did
    // something in this specific course. See registerActivity() in
    // mwasalatProgram.service.js for the read/write logic.
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: null }, // 'YYYY-MM-DD', UTC day-key
    lastActivityAt: { type: Date, default: null },
    // Distinct day-keys, capped to the last 14 — powers the dot-strip UI. Not
    // derivable from currentStreak alone since that resets to 1 on a break.
    recentActiveDates: { type: [String], default: [] },

    // Churn-risk scoring — recomputed daily by the engagement cron
    // (computeEngagementAndNudge in mwasalatProgram.service.js), not per-request.
    riskLevel: {
      type: String,
      enum: ['on_track', 'at_risk', 'inactive', 'churned'],
      default: 'on_track',
    },
    riskComputedAt: { type: Date, default: null },
    // Highest of [3, 7, 14] inactivity-day nudges already sent — prevents
    // re-sending the same tier on every daily cron run.
    lastNudgeThreshold: { type: Number, default: 0 },
    // True once a nudge has been sent; flipping back to false (on the
    // learner's next real activity) is what fires the welcome-back message.
    wasFlaggedInactive: { type: Boolean, default: false },
    returnedAt: { type: Date, default: null },

    // Completion-deadline enforcement (see runDeadlineSweep in
    // mwasalatProgram.service.js) — only ever touched when
    // program.expectedCompletionDays is set.
    // Internal + program.isMandatory: set once when the supervisor is
    // notified of a missed deadline, so the daily sweep doesn't re-notify.
    supervisorNotifiedAt: { type: Date, default: null },
    // External: set once the 10-day grace warning is sent to the learner.
    overdueWarnedAt: { type: Date, default: null },
    // External: set when access is locked (10 + 5 days past deadline, still
    // incomplete) — drives status becoming LOCKED. Cleared on reactivation.
    lockedAt: { type: Date, default: null },
    // Snapshot of `status` immediately before locking (always 'enrolled' or
    // 'in_progress' — completed enrollments are never swept), restored by
    // reactivateFromPaidSession instead of hardcoding back to 'enrolled'.
    preLockStatus: { type: String, default: null },
    // Set when a locked enrollment is reactivated via payment — resets the
    // deadline clock (computeDueAt anchors on this over purchasedAt/approvedAt)
    // and is what lets the learner be warned/locked again on a future cycle.
    reactivatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

mwasalatEnrollmentSchema.index({ learner: 1, program: 1 }, { unique: true });
mwasalatEnrollmentSchema.index({ program: 1 });
mwasalatEnrollmentSchema.index({ program: 1, status: 1 });
mwasalatEnrollmentSchema.index({ program: 1, riskLevel: 1 });

const MwasalatEnrollment = mongoose.model('MwasalatEnrollment', mwasalatEnrollmentSchema);
export default MwasalatEnrollment;
