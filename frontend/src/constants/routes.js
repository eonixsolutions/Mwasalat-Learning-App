export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email/:token',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',

  STUDENT: {
    DASHBOARD: '/student/dashboard',
    PROFILE: '/student/profile',
    COURSES: '/student/courses',
    VIDEO_CLASSES: '/student/video-classes',
    TASK_SHEETS: '/student/task-sheets',
    ATTENDANCE: '/student/attendance',
    FEES: '/student/fees',
    NOTIFICATIONS: '/student/notifications',
  },

  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    STUDENTS: '/admin/students',
    MENTORS: '/admin/mentors',
    COURSES: '/admin/courses',
    APPLICATIONS: '/admin/applications',
    FEES: '/admin/fees',
    NOTIFICATIONS: '/admin/notifications',
    SETTINGS: '/admin/settings',
  },

  MENTOR: {
    DASHBOARD: '/mentor/dashboard',
    STUDENTS: '/mentor/students',
    COURSES: '/mentor/courses',
    ASSIGNMENTS: '/mentor/assignments',
    ATTENDANCE: '/mentor/attendance',
  },
};
