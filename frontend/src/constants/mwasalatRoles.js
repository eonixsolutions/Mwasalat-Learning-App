// Demo toggle — hides "supervisor" from admin-facing role pickers (Invite Staff
// dropdown, staff role filter, announcement audience targeting) without touching
// backend RBAC, routes, seeded accounts, or existing supervisor business logic.
// Set VITE_MWASALAT_HIDE_SUPERVISOR_ROLE=false (or unset) to restore it after the demo.
export const MWASALAT_HIDE_SUPERVISOR_ROLE = import.meta.env.VITE_MWASALAT_HIDE_SUPERVISOR_ROLE === 'true';

export const MWASALAT_ROLE_DASHBOARD = {
  super_admin: '/admin/dashboard',
  platform_admin: '/admin/dashboard',
  // Reuses the admin dashboard/pages — the backend scopes every query to the
  // account's own `department` (see mwasalatDepartmentScope.js) rather than a
  // separate frontend surface.
  department_admin: '/admin/dashboard',
  // Read-only "My Team" roster + enrollment/completion progress for direct
  // reports (via the `supervisor` field). Sign-off/approval gating on
  // enrollments is a separate, not-yet-built manager-approval workflow.
  supervisor: '/supervisor/dashboard',
  instructor: '/instructor/dashboard',
  // Narrow, read-only operational slice: own dashboard + activity logs.
  it_support: '/it-support/dashboard',
  learner: '/learner/dashboard',
  external_learner: '/learner/dashboard',
};

// All 6 staff roles, plus internal `learner` accounts (admin bulk-imported/
// invited exactly like staff — see ALLOWED_IMPORT_ROLES in
// mwasalatUser.service.js), share the single IP-restricted staff login page
// (see MwasalatStaffLogin.jsx). Only external_learner is self-registered and
// uses the public /login page.
export const MWASALAT_ROLE_LOGIN = {
  super_admin: '/staff/login',
  platform_admin: '/staff/login',
  department_admin: '/staff/login',
  supervisor: '/staff/login',
  instructor: '/staff/login',
  it_support: '/staff/login',
  learner: '/staff/login',
  external_learner: '/login',
};
