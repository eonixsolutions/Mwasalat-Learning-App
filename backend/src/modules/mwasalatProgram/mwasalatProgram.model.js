import mongoose from 'mongoose';
import { CONTENT_TYPES, PROGRAM_STATUS, PROGRAM_AUDIENCE, LESSON_TYPES } from './mwasalatProgram.constants.js';

// A single piece of content inside a module. type-specific fields are left
// unset for every type they don't apply to (mirrors the top-level program's
// own "populated depending on which contentTypes are selected" convention).
// 'assignment'/'quiz' lessons carry no content fields here — they key into
// the separate MwasalatAssignment/MwasalatQuiz collections via
// {program, moduleId, lessonId (assignment only)}, same pattern the
// top-level course-level Quiz/Assignment already use, just module-scoped.
const lessonSchema = new mongoose.Schema(
  {
    type: { type: String, enum: Object.values(LESSON_TYPES), required: true },
    title: { type: String, required: true, trim: true },
    titleAr: { type: String, trim: true },
    order: { type: Number, required: true },
    // intro
    content: { type: String, trim: true },
    contentAr: { type: String, trim: true },
    // video — paste-a-link OR upload, same either/or convention as the
    // top-level recordingLink/recordingVideoPublicId fields
    videoLink: { type: String, trim: true },
    videoPublicId: { type: String, trim: true },
    videoDurationSeconds: { type: Number },
    // pdf / ppt
    fileUrl: { type: String, trim: true },
    fileName: { type: String, trim: true },
    filePublicId: { type: String, trim: true },
    // audio
    audioPublicId: { type: String, trim: true },
    audioDurationSeconds: { type: Number },
    // external link
    externalUrl: { type: String, trim: true },
  },
  { timestamps: true }
);

const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    titleAr: { type: String, trim: true },
    order: { type: Number, required: true },
    lessons: { type: [lessonSchema], default: [] },
  },
  { timestamps: true }
);

const mwasalatProgramSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    titleAr: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    categoryAr: { type: String, trim: true },
    subCategory: { type: String, trim: true },
    subCategoryAr: { type: String, trim: true },
    description: { type: String, trim: true },
    descriptionAr: { type: String, trim: true },
    contentTypes: {
      type: [{ type: String, enum: Object.values(CONTENT_TYPES) }],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Select at least one content type',
      },
    },
    // Populated depending on which contentTypes are selected
    pdfUrl: { type: String, trim: true },
    // Full set of uploaded PDF materials for this course (pdfUrl above always mirrors
    // documents[0] for courses created after multi-document support shipped — kept
    // separately so the day-tracking progress mechanic, which is keyed off a single
    // "pdf" content type rather than per-document, doesn't need to change).
    documents: {
      type: [{ url: { type: String, trim: true }, name: { type: String, trim: true }, publicId: { type: String, trim: true } }],
      default: [],
    },
    // Optional day count for PDF content — when set, the learner's PDF progress
    // increments by 1/N for each distinct calendar day they open it (see
    // markContentOpened) instead of jumping straight to done on first open.
    pdfDurationDays: { type: Number, min: 1 },
    // Self-paced "super course" content — only meaningful when contentTypes
    // includes 'modular'. Ordered top-to-bottom by each subdocument's `order`.
    // See mwasalatProgram.service.js computeModuleStatus for how progression
    // through this array is gated (module i unlocks only once module i-1 is
    // complete: every non-quiz lesson opened + its quiz, if any, passed).
    modules: { type: [moduleSchema], default: [] },
    recordingLink: { type: String, trim: true },
    // Set when the instructor uploads a video directly instead of pasting a link. The
    // Cloudinary asset itself is stored as 'authenticated' (no permanent public URL) —
    // a fresh signed URL is generated per-request (see getVideoUrl), so exposing this
    // id alone isn't enough to access the file without the server-side signature.
    recordingVideoPublicId: { type: String, trim: true },
    recordingVideoDurationSeconds: { type: Number },
    liveScheduledAt: { type: Date },
    liveMeetingLink: { type: String, trim: true },
    // Set when the link above was generated through the Zoom integration
    // instead of pasted manually (see backend/src/integrations/zoom.js).
    liveMeetingProvider: { type: String, trim: true },
    // Host-only Zoom URL — authenticates as the meeting host without a
    // separate Zoom login. Never sent to learners; getById strips it for
    // anyone but the course's own instructor/admin (see mwasalatProgram.service.js).
    liveMeetingStartUrl: { type: String, trim: true, select: false },
    iltVenue: { type: String, trim: true },
    iltScheduledAt: { type: Date },
    // Set by the instructor via completeClass() once the live session has actually
    // run — distinct from a learner clicking "Join" (markContentOpened), which only
    // proves they showed up and can fire before the session even starts. Gates the
    // course-level quiz (see isClassSessionCompleted in mwasalatProgram.service.js).
    liveClassCompletedAt: { type: Date },
    // Same idea for in-person sessions — distinct from the QR/manual attendance
    // check-in, which only proves the learner showed up.
    iltClassCompletedAt: { type: Date },
    // Seat limit for session-based delivery (live/ILT) — irrelevant for
    // self-paced pdf/recording content, so left unset there.
    capacity: { type: Number, min: 1 },
    // When true, new enrollments land as 'pending_approval' instead of 'enrolled' —
    // the instructor/admin must approve before the learner gets content access.
    requiresApproval: { type: Boolean, default: false },
    // When true, enroll() rejects new sign-ups outright — independent of
    // `status`, so instructor-facing views (roster/stats/listMine) keep
    // showing the course normally. Auto-set by remove() while a deletion is
    // scheduled (see mwasalatProgram.service.js).
    enrollmentClosed: { type: Boolean, default: false },
    duration: { type: String, trim: true },
    durationAr: { type: String, trim: true },
    // Who this course is for — set at creation, immutable afterward (see
    // EDITABLE_FIELDS in mwasalatProgram.service.js). 'all' is the default so
    // every pre-existing course keeps behaving exactly as before this field
    // existed (visible to every learner type, no migration needed).
    audience: { type: String, enum: Object.values(PROGRAM_AUDIENCE), default: PROGRAM_AUDIENCE.ALL },
    // Only meaningful when audience includes internal learners — restricts
    // catalog visibility to learners in one of these departments. Empty
    // (default) means "no restriction, visible to every department" UNLESS
    // targetGroups below is set, in which case only targetGroups restricts.
    departments: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatDepartment' }],
      default: [],
    },
    // Ad-hoc, cross-department targeting via MwasalatGroup cohorts (e.g. "Q1
    // 2026 New Hires") — additive to `departments`, not a further narrowing:
    // an internal learner is eligible if they match EITHER the department
    // restriction OR are a member of one of these cohorts. If both this and
    // `departments` are empty, the course is open to every internal learner
    // (unchanged default). See learnerCanAccessProgram/getMandatoryTargetLearnerIds
    // in mwasalatProgram.service.js for the exact matching logic.
    targetGroups: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatGroup' }],
      default: [],
    },
    // Only meaningful when audience includes external learners — internal
    // learners are always free regardless of this value (see enroll() /
    // createCheckoutSession()), and it's force-reset to 0 whenever audience
    // is internal_only (create() and update() both re-assert this).
    price: { type: Number, default: 0 },
    expiryDate: { type: Date },
    // Some certifications (e.g. safety/compliance training) must be renewed periodically.
    // When set, a learner's certificate for this course expires this many months after
    // issuance; left unset, the certificate is valid for life.
    certificateValidityMonths: { type: Number, min: 1 },
    // When true (and certificateValidityMonths is set), the daily cron silently
    // extends a learner's certificate before it expires. When false, the learner
    // must retake and pass the assessment to have it reissued (see
    // reissueCertificateFromRetest) — for certifications that require a real check.
    autoRenewCertificate: { type: Boolean, default: false },
    // Optional deadline, in days from enrollment (or approval/reactivation —
    // see computeDueAt in mwasalatProgram.service.js), to finish this course.
    // Left unset (default), no deadline enforcement ever applies.
    expectedCompletionDays: { type: Number, min: 1 },
    // Internal-learner-only concept: when true and expectedCompletionDays is
    // set, an internal learner still incomplete past the deadline gets their
    // supervisor notified (see runDeadlineSweep). Meaningless — and force-reset
    // to false — for an external_only course, since external enforcement
    // (warn/lock) is unconditional whenever a deadline is set at all.
    isMandatory: { type: Boolean, default: false },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    // Learners must complete this other course (have a MwasalatEnrollment with
    // completedAt set) before they're allowed to enroll in this one.
    prerequisiteProgram: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatProgram', default: null },
    status: {
      type: String,
      enum: Object.values(PROGRAM_STATUS),
      default: PROGRAM_STATUS.ACTIVE,
    },
    // Set by remove() to the grace-period deadline once no active enrollments
    // remain; the scheduled-deletion cron sweep (runScheduledDeletions) archives
    // the course once this passes. Null means no deletion is pending.
    deletionScheduledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

mwasalatProgramSchema.index({ instructor: 1 });
mwasalatProgramSchema.index({ status: 1 });
mwasalatProgramSchema.index({ departments: 1 });
mwasalatProgramSchema.index({ targetGroups: 1 });
mwasalatProgramSchema.index({ deletionScheduledAt: 1 });

const MwasalatProgram = mongoose.model('MwasalatProgram', mwasalatProgramSchema);
export default MwasalatProgram;
