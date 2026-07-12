// Canonical TanStack Query keys for the whole app.
// Import from here — never write query key arrays inline.
// This file is the single source of truth; socket handlers and
// useQuery calls reference the same object, so a mismatch is impossible.

export const QK = {
  // ── Student enrollment ──────────────────────────────────────────────
  // courseService.getMyEnrollment — the student's current active enrollment
  ENROLLMENT: ['enrollment', 'my'],
  // studentService.getMyEnrollments — full enrollment history (all statuses)
  MY_ENROLLMENTS: ['my-enrollments'],

  // ── Student profile / progress ──────────────────────────────────────
  STUDENT_ME: ['student', 'me'],

  // ── Fees ────────────────────────────────────────────────────────────
  STUDENT_FEES: ['student', 'fees'],
  MY_FEE_ACCOUNT: ['my-fee-account'],
  FEE_ACCOUNT: (studentId) => ['fee-account', studentId],
  PENDING_INSTALLMENT_PAYMENTS: ['pending-installment-payments'],

  // ── Coordinator / admin lists ───────────────────────────────────────
  STUDENTS: ['students'],
  PAYMENTS: ['payments'],
  PAYMENTS_PENDING: ['payments', 'pending'],
  BATCHES: ['batches'],

  // ── Courses ──────────────────────────────────────────────────────────
  COURSES_ACTIVE: ['courses', 'active'],

  // ── Reviews / screenings ─────────────────────────────────────────────
  MY_REVIEWS: ['reviews', 'my'],      // all reviews for current enrollment (screenings + weekly)
  MY_SCREENINGS: ['my-screenings'],   // ScreeningPage — same endpoint, filtered by type client-side
  WEEK_REVIEWS: ['week-reviews', 'my'],

  // ── Leaves ──────────────────────────────────────────────────────────
  LEAVES_MY: ['leaves', 'my'],

  // ── LeetCode ────────────────────────────────────────────────────────
  LEETCODE_ME: ['leetcode', 'me'],

  // ── Staff ────────────────────────────────────────────────────────────
  STAFF_ME: ['staff', 'me'],
  STAFF_PENDING_COUNT: ['staff', 'pending-count'],
};
