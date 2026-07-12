import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { attendanceService } from './attendance.service.js';

const markAttendance = asyncHandler(async (req, res) => {
  const { studentId, date, status, note } = req.body;
  const record = await attendanceService.markAttendance({
    studentId,
    date,
    status,
    markedById: req.user._id,
    note,
  });
  successResponse(res, 'Attendance marked', record, 201);
});

const getMyAttendance = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const result = await attendanceService.getMyAttendance(req.user._id, { startDate, endDate });
  successResponse(res, 'Attendance fetched', result);
});

const getStudentAttendance = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const result = await attendanceService.getStudentAttendance(req.params.studentId, { startDate, endDate });
  successResponse(res, 'Attendance fetched', result);
});

const getAttendanceByDate = asyncHandler(async (req, res) => {
  const result = await attendanceService.getAttendanceByDate(req.params.date);
  successResponse(res, 'Attendance fetched', result);
});

const deleteOverride = asyncHandler(async (req, res) => {
  const { studentId, date } = req.query;
  await attendanceService.deleteOverride({ studentId, date });
  successResponse(res, 'Override removed — attendance reverted to auto');
});

export const attendanceController = {
  markAttendance,
  getMyAttendance,
  getStudentAttendance,
  getAttendanceByDate,
  deleteOverride,
};
