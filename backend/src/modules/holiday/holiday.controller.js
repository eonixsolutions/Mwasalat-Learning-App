import { holidayService } from './holiday.service.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';

const getHolidays = asyncHandler(async (req, res) => {
  const branchId = req.user.branch ?? null;
  const holidays = await holidayService.getHolidays(branchId);
  successResponse(res, 'Holidays fetched', holidays);
});

const createHoliday = asyncHandler(async (req, res) => {
  const holiday = await holidayService.createHoliday(
    { ...req.body, branch: req.user.branch ?? null },
    req.user._id
  );
  successResponse(res, 'Holiday created', holiday, 201);
});

const deleteHoliday = asyncHandler(async (req, res) => {
  await holidayService.deleteHoliday(req.params.id);
  successResponse(res, 'Holiday deleted', null);
});

export const holidayController = { getHolidays, createHoliday, deleteHoliday };
