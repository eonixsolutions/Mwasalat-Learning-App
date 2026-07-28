export const MWASALAT_ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  PLATFORM_ADMIN: 'platform_admin',
  // Scoped variant of platform_admin: same admin tooling, but every query the
  // service layer runs for this role is filtered to their own `department`
  // (see mwasalatDepartmentScope.js). Provisioned via inviteStaff, never self-registered.
  DEPARTMENT_ADMIN: 'department_admin',
  // Line-manager role: approves enrollments/completions for the learners who
  // list them as `supervisor` (see mwasalatUser.model.js) — no course-authoring
  // or people-admin rights of its own.
  SUPERVISOR: 'supervisor',
  INSTRUCTOR: 'instructor',
  LEARNER: 'learner',
  // Same platform access as LEARNER; kept as a distinct role only so reporting
  // and department-scoping can tell internal staff-learners apart from
  // external/contractor learners where that distinction matters to the org.
  EXTERNAL_LEARNER: 'external_learner',
  // Read-only operational role: activity logs, user status, system health —
  // no content authoring, no people-admin actions of its own.
  IT_SUPPORT: 'it_support',
});

export const MWASALAT_STAFF_ROLES = Object.freeze([
  MWASALAT_ROLES.SUPER_ADMIN,
  MWASALAT_ROLES.PLATFORM_ADMIN,
  MWASALAT_ROLES.DEPARTMENT_ADMIN,
  MWASALAT_ROLES.SUPERVISOR,
  MWASALAT_ROLES.INSTRUCTOR,
  MWASALAT_ROLES.IT_SUPPORT,
]);

export const MWASALAT_LEARNER_ROLES = Object.freeze([MWASALAT_ROLES.LEARNER, MWASALAT_ROLES.EXTERNAL_LEARNER]);
