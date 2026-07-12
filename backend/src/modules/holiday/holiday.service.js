import { holidayRepository } from './holiday.repository.js';
import { AppError } from '../../utils/AppError.js';

const getHolidays = (branchId = null) => {
  const filter = branchId
    ? { $or: [{ branch: null }, { branch: branchId }] }
    : {};
  return holidayRepository.findHolidays(filter);
};

const createHoliday = async (data, userId) => {
  const holiday = await holidayRepository.createHoliday({ ...data, createdBy: userId });
  // Cancel any review slots that fall on this date (fire-and-forget)
  const { cancelSlotsOnDate } = await import('../review/review.service.js');
  cancelSlotsOnDate(holiday.date, holiday.name).catch(() => {});
  return holiday;
};

const deleteHoliday = async (id) => {
  const holiday = await holidayRepository.deleteHolidayById(id);
  if (!holiday) throw new AppError('Holiday not found', 404);
};

export const holidayService = { getHolidays, createHoliday, deleteHoliday };
