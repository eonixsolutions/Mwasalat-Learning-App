export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  BRANCH_ADMIN: 'branch_admin',
  BRANCH_COORDINATOR: 'branch_coordinator',
  TECHNICAL_MENTOR: 'technical_mentor',
  COMMUNICATION_MENTOR: 'communication_mentor',
  STUDENT: 'student',
});

// Roles that belong to staff (not students)
export const STAFF_ROLES = Object.freeze([
  ROLES.SUPER_ADMIN,
  ROLES.BRANCH_ADMIN,
  ROLES.BRANCH_COORDINATOR,
  ROLES.TECHNICAL_MENTOR,
  ROLES.COMMUNICATION_MENTOR,
]);

export const STUDENT_STATUS = Object.freeze({
  ACTIVE: 'active',
  DROPPED: 'dropped',
  GRADUATED: 'graduated',
});

// Access control outcomes (from PRD Section 4.1)
export const ACCESS_RESTRICTION = Object.freeze({
  FULL: 'full',                  // Normal access
  FEE_EXPIRED: 'fee_expired',    // Fee unpaid + validity expired → dashboard + payment only
  FEE_PENDING: 'fee_pending',    // Fee pending within validity → full access + daily modal
  LEETCODE_HOLD: 'leetcode_hold', // LeetCode hold active → limited to completed content
  DROPPED: 'dropped',            // No access at all
});

export const APPLICATION_STATUS = Object.freeze({
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ENROLLED: 'enrolled',
});

export const PAYMENT_TYPES = Object.freeze({
  REGISTRATION_FEE: 'registration_fee',
  COURSE_FEE: 'course_fee',
  INSTALLMENT: 'installment',
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

export const FEE_STATUS = Object.freeze({
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
  EXPIRED: 'expired',
});

export const NOTIFICATION_TYPES = Object.freeze({
  FEE_REMINDER: 'fee_reminder',
  APPLICATION_UPDATE: 'application_update',
  ANNOUNCEMENT: 'announcement',
  COURSE_UPDATE: 'course_update',
  ASSIGNMENT: 'assignment',
  REVIEW_SCHEDULED: 'review_scheduled',
  REVIEW_RESULT: 'review_result',
  LEETCODE_HOLD: 'leetcode_hold',
  ACCESS_RESTRICTION: 'access_restriction',
  CONTACT_INQUIRY: 'contact_inquiry',
  STUDENT_REGISTRATION: 'student_registration',
  ACCOUNT_ACTIVATED: 'account_activated',
  DAY_SUBMITTED: 'day_submitted',
  SCREENING_TRIGGERED: 'screening_triggered',
  SCREENING_RESCHEDULED: 'screening_rescheduled',
  LEAVE_REQUESTED: 'leave_requested',
  LEAVE_APPROVED: 'leave_approved',
  FEE_PAYMENT_SUBMITTED: 'fee_payment_submitted',
  FEE_PAYMENT_APPROVED: 'fee_payment_approved',
  FEE_PAYMENT_REJECTED: 'fee_payment_rejected',
  TASK_SHEET_PROVISIONED:   'task_sheet_provisioned',
  COURSE_COMPLETED:         'course_completed',
  ENROLLMENT_REQUESTED:     'enrollment_requested',
});

export const ATTENDANCE_STATUS = Object.freeze({
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
});
