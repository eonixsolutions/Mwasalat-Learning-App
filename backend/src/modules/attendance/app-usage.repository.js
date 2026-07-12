import AppUsage from './app-usage.model.js';

const MINUTES_PER_HEARTBEAT = 5;

const toDay = (d) => {
  const date = new Date(d || Date.now());
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// Called on every heartbeat — upsert and increment activeMinutes
const recordHeartbeat = (studentId) => {
  const day = toDay(new Date());
  return AppUsage.findOneAndUpdate(
    { student: studentId, date: day },
    {
      $inc: { activeMinutes: MINUTES_PER_HEARTBEAT },
      $set: { lastHeartbeat: new Date() },
    },
    { upsert: true, new: true }
  );
};

// Student's own usage for today
const getTodayUsage = (studentId) =>
  AppUsage.findOne({ student: studentId, date: toDay(new Date()) });

// All students' usage for a given date (coordinator view)
const getUsageByDate = (date) =>
  AppUsage.find({ date: toDay(date) }).populate('student', 'user batch');

// Usage for a single student across a date range
const getUsageByStudentAndRange = (studentId, startDate, endDate) =>
  AppUsage.find({
    student: studentId,
    date: { $gte: toDay(startDate), $lte: toDay(endDate) },
  }).sort({ date: 1 });

export const appUsageRepository = {
  recordHeartbeat,
  getTodayUsage,
  getUsageByDate,
  getUsageByStudentAndRange,
};
