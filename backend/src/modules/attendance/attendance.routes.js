import { Router } from 'express';
import { attendanceController } from './attendance.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { ROLES } from '../../constants/index.js';
import {
  markAttendanceSchema,
  dateParamSchema,
  studentIdParamSchema,
  dateRangeQuerySchema,
} from './attendance.validation.js';

const router = Router();

const staffRoles = [
  ROLES.SUPER_ADMIN,
  ROLES.BRANCH_ADMIN,
  ROLES.BRANCH_COORDINATOR,
  ROLES.TECHNICAL_MENTOR,
  ROLES.COMMUNICATION_MENTOR,
];

// Student: view own attendance
router.get(
  '/me',
  authMiddleware.authenticate,
  authMiddleware.authorize(ROLES.STUDENT),
  validate(dateRangeQuerySchema),
  attendanceController.getMyAttendance
);

// Staff: roll call for a specific date
router.get(
  '/date/:date',
  authMiddleware.authenticate,
  authMiddleware.authorize(...staffRoles),
  validate(dateParamSchema),
  attendanceController.getAttendanceByDate
);

// Staff: get a specific student's attendance history
router.get(
  '/student/:studentId',
  authMiddleware.authenticate,
  authMiddleware.authorize(...staffRoles),
  validate([...studentIdParamSchema, ...dateRangeQuerySchema]),
  attendanceController.getStudentAttendance
);

// Staff: mark/update attendance for a student (manual override)
router.post(
  '/mark',
  authMiddleware.authenticate,
  authMiddleware.authorize(...staffRoles),
  validate(markAttendanceSchema),
  attendanceController.markAttendance
);

// Staff: delete manual override (revert to auto)
router.delete(
  '/override',
  authMiddleware.authenticate,
  authMiddleware.authorize(...staffRoles),
  attendanceController.deleteOverride
);

export default router;
