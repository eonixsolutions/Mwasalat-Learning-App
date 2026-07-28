export const CONTENT_TYPES = Object.freeze({
  PDF: 'pdf',
  RECORDING: 'recording',
  LIVE: 'live',
  ILT: 'ilt',
  // Self-paced "super course" — content lives in program.modules[] instead of
  // the flat pdfUrl/recordingLink fields above. See mwasalatProgram.model.js.
  MODULAR: 'modular',
});

// Lesson types available inside a modular course's modules[].lessons[].
// 'quiz' is special: at most one per module, and it's the module's gate —
// see computeModuleStatus in mwasalatProgram.service.js.
export const LESSON_TYPES = Object.freeze({
  INTRO: 'intro',
  VIDEO: 'video',
  PDF: 'pdf',
  PPT: 'ppt',
  AUDIO: 'audio',
  LINK: 'link',
  ASSIGNMENT: 'assignment',
  QUIZ: 'quiz',
});

export const PROGRAM_STATUS = Object.freeze({
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
});

// Who a course is for — set at creation and immutable afterward (see
// EDITABLE_FIELDS in mwasalatProgram.service.js). Drives whether price applies
// (external audiences only — internal learners are always free) and whether a
// department restriction is meaningful (internal audiences only).
export const PROGRAM_AUDIENCE = Object.freeze({
  ALL: 'all',
  INTERNAL_ONLY: 'internal_only',
  EXTERNAL_ONLY: 'external_only',
});

export const ENROLLMENT_STATUS = Object.freeze({
  PENDING_APPROVAL: 'pending_approval',
  WAITLISTED: 'waitlisted',
  REJECTED: 'rejected',
  ENROLLED: 'enrolled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  // External learner missed the course's completion deadline plus both grace
  // periods — access revoked until they pay to reactivate (see
  // reactivateFromPaidSession in mwasalatPayment.service.js). Never applies to
  // internal learners, who have no deadline-lock concept.
  LOCKED: 'locked',
});

// Statuses that hold (or are trying to hold) a seat against program.capacity —
// waitlisted/rejected enrollments explicitly don't count against it. A locked
// enrollment hasn't been rejected — it's paid and pending reactivation — so it
// still holds its seat.
export const SEAT_CONSUMING_STATUSES = [
  ENROLLMENT_STATUS.PENDING_APPROVAL,
  ENROLLMENT_STATUS.ENROLLED,
  ENROLLMENT_STATUS.IN_PROGRESS,
  ENROLLMENT_STATUS.COMPLETED,
  ENROLLMENT_STATUS.LOCKED,
];

// Statuses where the learner has actually been granted access to course content —
// pending/waitlisted/rejected enrollments exist as a record but grant nothing yet.
export const ACCESS_GRANTED_STATUSES = [
  ENROLLMENT_STATUS.ENROLLED,
  ENROLLMENT_STATUS.IN_PROGRESS,
  ENROLLMENT_STATUS.COMPLETED,
];

// Statuses that represent a learner with an unresolved, ongoing stake in the
// program — everything except a terminal completed/rejected outcome. Deleting
// a course is blocked while any enrollment is in one of these states (see
// remove() in mwasalatProgram.service.js).
export const ACTIVE_ENROLLMENT_STATUSES = [
  ENROLLMENT_STATUS.PENDING_APPROVAL,
  ENROLLMENT_STATUS.WAITLISTED,
  ENROLLMENT_STATUS.ENROLLED,
  ENROLLMENT_STATUS.IN_PROGRESS,
  ENROLLMENT_STATUS.LOCKED,
];

// How many days after an instructor requests deletion (once no active
// enrollments remain) before the scheduled-deletion cron sweep actually
// archives the course — see runScheduledDeletions() in mwasalatProgram.service.js.
export const COURSE_DELETION_GRACE_DAYS = 5;
