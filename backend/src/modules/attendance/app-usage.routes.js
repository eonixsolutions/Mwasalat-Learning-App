import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { appUsageRepository } from './app-usage.repository.js';
import Student from '../student/student.model.js';
import { ROLES } from '../../constants/index.js';

const router = Router();

router.use(authMiddleware.authenticate);

// Student: today's own usage
router.get('/today', asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id }, '_id');
  if (!student) return successResponse(res, 'No profile', { activeMinutes: 0 });
  const usage = await appUsageRepository.getTodayUsage(student._id);
  successResponse(res, 'OK', { activeMinutes: usage?.activeMinutes ?? 0 });
}));

// Student: own usage for a date range — returns array of { date, activeMinutes }
router.get('/me/range', asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id }, '_id');
  if (!student) return successResponse(res, 'No profile', []);
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end   = endDate   ? new Date(endDate)   : new Date();
  const records = await appUsageRepository.getUsageByStudentAndRange(student._id, start, end);
  successResponse(res, 'OK', records.map(r => ({ date: r.date, activeMinutes: r.activeMinutes })));
}));

// Staff: all students' usage for a date
router.get('/by-date', authMiddleware.authorize(
  ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.BRANCH_COORDINATOR, ROLES.TECHNICAL_MENTOR
), asyncHandler(async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  const records = await appUsageRepository.getUsageByDate(date);
  // Return map: studentId → activeMinutes
  const map = {};
  for (const r of records) {
    map[String(r.student?._id ?? r.student)] = r.activeMinutes;
  }
  successResponse(res, 'OK', map);
}));

export default router;
