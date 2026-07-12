export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  BRANCH_ADMIN: 'branch_admin',
  BRANCH_COORDINATOR: 'branch_coordinator',
  TECHNICAL_MENTOR: 'technical_mentor',
  COMMUNICATION_MENTOR: 'communication_mentor',
  STUDENT: 'student',
};

export const ROLE_DASHBOARD = {
  super_admin: '/admin/dashboard',
  branch_admin: '/branch-admin/dashboard',
  branch_coordinator: '/coordinator/dashboard',
  technical_mentor: '/mentor/dashboard',
  communication_mentor: '/comm-mentor/dashboard',
  student: '/student/dashboard',
};

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  branch_admin: 'Branch Admin',
  branch_coordinator: 'Coordinator',
  technical_mentor: 'Technical Mentor',
  communication_mentor: 'Comm. Mentor',
  student: 'Student',
};

export const ROLE_LOGIN = {
  super_admin: '/admin/login',
  branch_admin: '/branch-admin/login',
  branch_coordinator: '/coordinator/login',
  technical_mentor: '/mentor/login',
  communication_mentor: '/comm-mentor/login',
  student: '/login',
};

export const STAFF_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.BRANCH_ADMIN,
  ROLES.BRANCH_COORDINATOR,
  ROLES.TECHNICAL_MENTOR,
  ROLES.COMMUNICATION_MENTOR,
];
