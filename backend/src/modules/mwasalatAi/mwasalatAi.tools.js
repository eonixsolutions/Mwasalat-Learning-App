import { Type } from '@google/genai';
import { mwasalatProgramService } from '../mwasalatProgram/mwasalatProgram.service.js';
import { mwasalatPaymentService } from '../mwasalatPayment/mwasalatPayment.service.js';
import { mwasalatQuizService } from '../mwasalatQuiz/mwasalatQuiz.service.js';
import MwasalatTransaction from '../mwasalatPayment/mwasalatTransaction.model.js';
import MwasalatEnrollment from '../mwasalatProgram/mwasalatEnrollment.model.js';
import MwasalatUser from '../mwasalatUser/mwasalatUser.model.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';
import { ENROLLMENT_STATUS } from '../mwasalatProgram/mwasalatProgram.constants.js';
import { AppError } from '../../utils/AppError.js';
import { MAX_LIST_RESULTS } from './mwasalatAi.constants.js';
import { RENDER_TOOL_DECLARATIONS } from './mwasalatAi.renderTools.js';

// ─── Read-only data tools ─────────────────────────────────────────────────
// Every number the assistant states must come from one of these — never from
// the model's own reasoning. All reuse existing service logic where it
// already exists (mwasalatProgram/mwasalatPayment/mwasalatQuiz services).

const buildDateRangeFilter = ({ from, to } = {}) => {
  const filter = {};
  if (from || to) {
    filter.paidAt = {};
    if (from) filter.paidAt.$gte = new Date(`${from}T00:00:00.000Z`);
    if (to) filter.paidAt.$lte = new Date(`${to}T23:59:59.999Z`);
  }
  return filter;
};

const getPlatformOverview = async () => mwasalatProgramService.getAdminOverview();

const getRevenueSummary = async () => mwasalatPaymentService.getRevenueSummary();

const getSalesReport = async ({ from, to } = {}) => mwasalatPaymentService.getSalesReport({ from, to });

const listRecentTransactions = async ({ from, to, status, limit } = {}) => {
  const filter = buildDateRangeFilter({ from, to });
  if (status) filter.status = status;
  const cap = Math.min(Number(limit) || 20, MAX_LIST_RESULTS);

  const [transactions, total] = await Promise.all([
    MwasalatTransaction.find(filter)
      .populate('learner', 'name email')
      .populate('program', 'title titleAr')
      .sort({ paidAt: -1 })
      .limit(cap),
    MwasalatTransaction.countDocuments(filter),
  ]);

  return {
    total,
    returned: transactions.length,
    transactions: transactions.map((t) => ({
      learner: t.learner?.name ?? 'Unknown',
      program: t.program?.title ?? 'Unknown',
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      paidAt: t.paidAt,
    })),
  };
};

const listPrograms = async ({ status, category, limit } = {}) => {
  const all = await mwasalatProgramService.listAllForAdmin();
  let filtered = all;
  if (status) filtered = filtered.filter((p) => p.status === status);
  if (category) filtered = filtered.filter((p) => p.category?.toLowerCase() === category.toLowerCase());

  const cap = Math.min(Number(limit) || 20, MAX_LIST_RESULTS);
  const capped = filtered.slice(0, cap);

  return {
    total: filtered.length,
    returned: capped.length,
    programs: capped.map((p) => ({
      title: p.title,
      category: p.category,
      status: p.status,
      price: p.price,
      instructor: p.instructor?.name,
      avgRating: p.avgRating,
      feedbackCount: p.feedbackCount,
    })),
  };
};

const getInstructorSummaries = async () => {
  const summaries = await mwasalatProgramService.listInstructorSummaries();
  return { total: summaries.length, instructors: summaries.slice(0, MAX_LIST_RESULTS) };
};

// riskLevel is only recomputed for non-completed enrollments (see
// computeEngagementAndNudge in mwasalatProgram.service.js) — a completed
// enrollment can carry a stale at_risk/churned value from before it
// finished. This replicates the same display-time correction getLearners()
// applies, so the assistant doesn't overstate churn risk.
const getEnrollmentRiskBreakdown = async ({ programId } = {}) => {
  const filter = programId ? { program: programId } : {};
  const enrollments = await MwasalatEnrollment.find(filter, 'status riskLevel');

  const breakdown = { on_track: 0, at_risk: 0, inactive: 0, churned: 0 };
  enrollments.forEach((e) => {
    const level = e.status === ENROLLMENT_STATUS.COMPLETED ? 'on_track' : e.riskLevel;
    breakdown[level] = (breakdown[level] ?? 0) + 1;
  });

  return { total: enrollments.length, breakdown };
};

const getAttendanceSummary = async ({ programId } = {}) => {
  if (!programId) throw new AppError('programId is required', 400);
  const records = await mwasalatProgramService.getAttendance(programId);
  const capped = records.slice(0, MAX_LIST_RESULTS);

  return {
    total: records.length,
    returned: capped.length,
    records: capped.map((r) => ({ learner: r.learner?.name ?? 'Unknown', checkedInAt: r.checkedInAt })),
  };
};

const getQuizResultsSummary = async ({ programId } = {}) => {
  const { programResults, attempts } = await mwasalatQuizService.getAdminResults();
  const results = programId
    ? programResults.filter((r) => String(r.program?._id) === String(programId))
    : programResults;
  const filteredAttempts = programId
    ? attempts.filter((a) => String(a.program?._id) === String(programId))
    : attempts;
  const capped = filteredAttempts.slice(0, MAX_LIST_RESULTS);

  return {
    programResults: results.map((r) => ({
      program: r.program?.title, attempts: r.attempts, avgScore: r.avgScore, passRate: r.passRate,
    })),
    totalAttempts: filteredAttempts.length,
    recentAttempts: capped.map((a) => ({
      learner: a.learner?.name, program: a.program?.title, score: a.score, passed: a.passed, attemptedAt: a.attemptedAt,
    })),
  };
};

const getCertificatesSummary = async ({ from, to } = {}) => {
  const all = await mwasalatProgramService.listAllCertificates();
  const fromDate = from ? new Date(`${from}T00:00:00.000Z`) : null;
  const toDate = to ? new Date(`${to}T23:59:59.999Z`) : null;

  const issuedInRange = all.filter((c) => {
    if (fromDate && c.issuedAt < fromDate) return false;
    if (toDate && c.issuedAt > toDate) return false;
    return true;
  });

  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const expiringSoon = all
    .filter((c) => c.expiresAt && !c.isExpired && c.expiresAt <= in30Days)
    .slice(0, MAX_LIST_RESULTS);

  return {
    totalIssued: all.length,
    issuedInRange: issuedInRange.length,
    expiringWithin30Days: expiringSoon.length,
    expiringSoon: expiringSoon.map((c) => ({ learner: c.learner?.name, program: c.program?.title, expiresAt: c.expiresAt })),
  };
};

const findLearner = async ({ query } = {}) => {
  if (!query?.trim()) throw new AppError('query is required', 400);
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'i');

  const matches = await MwasalatUser.find({
    role: MWASALAT_ROLES.LEARNER,
    $or: [{ name: regex }, { email: regex }],
  }).select('name email').limit(5);

  return { matches: matches.map((m) => ({ learnerId: m._id.toString(), name: m.name, email: m.email })) };
};

const getLearnerDetail = async ({ learnerId } = {}) => {
  if (!learnerId) throw new AppError('learnerId is required', 400);
  const achievements = await mwasalatProgramService.getAchievements(learnerId);
  if (!achievements.learner) throw new AppError('Learner not found', 404);

  return {
    learner: achievements.learner,
    points: achievements.points,
    totalCourses: achievements.totalCourses,
    totalCertificates: achievements.totalCertificates,
    totalAttempts: achievements.totalAttempts,
    enrollments: achievements.enrollments.slice(0, MAX_LIST_RESULTS).map((e) => ({
      program: e.program?.title, status: e.status, purchasedAt: e.purchasedAt, completedAt: e.completedAt,
    })),
  };
};

export const ADMIN_TOOL_EXECUTORS = {
  getPlatformOverview,
  getRevenueSummary,
  getSalesReport,
  listRecentTransactions,
  listPrograms,
  getInstructorSummaries,
  getEnrollmentRiskBreakdown,
  getAttendanceSummary,
  getQuizResultsSummary,
  getCertificatesSummary,
  findLearner,
  getLearnerDetail,
};

const DATE_PARAM = { type: Type.STRING, description: 'Date in YYYY-MM-DD format' };

const ADMIN_DATA_TOOL_DECLARATIONS = [
  {
    name: 'getPlatformOverview',
    description: 'Platform-wide totals: total learners, instructors, active programs, certificates issued, content-type breakdown, weekly new-learner signups (last 8 weeks), and the enrollment funnel (enrolled -> opened content -> completed).',
  },
  {
    name: 'getRevenueSummary',
    description: 'Total revenue, this-month revenue, total paid transaction count, a 6-month revenue trend, and the top 5 programs by revenue. All amounts in OMR.',
  },
  {
    name: 'getSalesReport',
    description: 'Revenue, sales count, average sale value, a trend chart, and top 5 programs by revenue for an optional date range. Omit from/to for an all-time report (trailing 12-month trend).',
    parameters: { type: Type.OBJECT, properties: { from: DATE_PARAM, to: DATE_PARAM } },
  },
  {
    name: 'listRecentTransactions',
    description: 'List individual payment transactions, optionally filtered by date range and status, newest first.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        from: DATE_PARAM,
        to: DATE_PARAM,
        status: { type: Type.STRING, enum: ['paid', 'refunded'], description: 'Filter by transaction status' },
        limit: { type: Type.INTEGER, description: `Max rows to return (default 20, max ${MAX_LIST_RESULTS})` },
      },
    },
  },
  {
    name: 'listPrograms',
    description: 'List courses/programs, optionally filtered by status or category, with rating and instructor info.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, enum: ['draft', 'active', 'archived', 'expired'], description: 'Filter by program status' },
        category: { type: Type.STRING, description: 'Filter by category name' },
        limit: { type: Type.INTEGER, description: `Max rows to return (default 20, max ${MAX_LIST_RESULTS})` },
      },
    },
  },
  {
    name: 'getInstructorSummaries',
    description: 'Per-instructor totals: number of programs taught and average rating, for every instructor on the platform.',
  },
  {
    name: 'getEnrollmentRiskBreakdown',
    description: 'Count of enrollments in each churn-risk bucket (on_track, at_risk, inactive, churned), optionally scoped to one program.',
    parameters: { type: Type.OBJECT, properties: { programId: { type: Type.STRING, description: 'Optional program id to scope the breakdown to one course' } } },
  },
  {
    name: 'getAttendanceSummary',
    description: 'In-person (ILT) attendance check-ins for a specific program.',
    parameters: {
      type: Type.OBJECT,
      properties: { programId: { type: Type.STRING, description: 'The program id to get attendance for' } },
      required: ['programId'],
    },
  },
  {
    name: 'getQuizResultsSummary',
    description: 'Quiz performance: attempts, average score, and pass rate per program, optionally scoped to one program, plus a list of recent individual attempts.',
    parameters: { type: Type.OBJECT, properties: { programId: { type: Type.STRING, description: 'Optional program id to scope results to one course' } } },
  },
  {
    name: 'getCertificatesSummary',
    description: 'Certificate counts: total issued, issued within an optional date range, and certificates expiring within the next 30 days.',
    parameters: { type: Type.OBJECT, properties: { from: DATE_PARAM, to: DATE_PARAM } },
  },
  {
    name: 'findLearner',
    description: 'Search for a learner by name or email fragment. Call this first when a question names a specific learner, then pass the returned learnerId to getLearnerDetail.',
    parameters: {
      type: Type.OBJECT,
      properties: { query: { type: Type.STRING, description: 'Name or email fragment to search for' } },
      required: ['query'],
    },
  },
  {
    name: 'getLearnerDetail',
    description: 'Full profile for one learner: points, enrollments, certificates, and quiz attempt totals. Requires a learnerId from findLearner.',
    parameters: {
      type: Type.OBJECT,
      properties: { learnerId: { type: Type.STRING, description: 'The learner id returned by findLearner' } },
      required: ['learnerId'],
    },
  },
];

export const ADMIN_TOOL_DECLARATIONS = [...ADMIN_DATA_TOOL_DECLARATIONS, ...RENDER_TOOL_DECLARATIONS];
