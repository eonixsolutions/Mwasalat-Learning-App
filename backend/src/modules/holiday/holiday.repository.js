import Holiday from './holiday.model.js';

const findHolidays = (filter = {}) =>
  Holiday.find(filter).populate('createdBy', 'name').sort({ date: 1 });

const findHolidaysInRange = (startDate, endDate, branchId = null) =>
  Holiday.find({
    date: { $gte: startDate, $lte: endDate },
    $or: [{ branch: null }, { branch: branchId }],
  }).select('date');

const createHoliday = (data) => Holiday.create(data);

const deleteHolidayById = (id) => Holiday.findByIdAndDelete(id);

const findHolidayById = (id) => Holiday.findById(id);

// Returns any holiday (any branch) that falls on the given calendar day (UTC)
const findHolidayOnDate = (date) => {
  const dayStart = new Date(date); dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd   = new Date(date); dayEnd.setUTCHours(23, 59, 59, 999);
  return Holiday.findOne({ date: { $gte: dayStart, $lte: dayEnd } });
};

export const holidayRepository = {
  findHolidays,
  findHolidaysInRange,
  createHoliday,
  deleteHolidayById,
  findHolidayById,
  findHolidayOnDate,
};
