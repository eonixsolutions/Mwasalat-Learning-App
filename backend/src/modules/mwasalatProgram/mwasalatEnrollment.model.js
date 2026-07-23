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
  },
  { timestamps: true }
);

mwasalatEnrollmentSchema.index({ learner: 1, program: 1 }, { unique: true });
mwasalatEnrollmentSchema.index({ program: 1 });
mwasalatEnrollmentSchema.index({ program: 1, riskLevel: 1 });

const MwasalatEnrollment = mongoose.model('MwasalatEnrollment', mwasalatEnrollmentSchema);
export default MwasalatEnrollment;
