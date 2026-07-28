import Stripe from 'stripe';
import MwasalatProgram from '../mwasalatProgram/mwasalatProgram.model.js';
import MwasalatEnrollment from '../mwasalatProgram/mwasalatEnrollment.model.js';
import MwasalatTransaction from './mwasalatTransaction.model.js';
import { AppError } from '../../utils/AppError.js';
import logger from '../../utils/logger.js';
import { ENROLLMENT_STATUS, SEAT_CONSUMING_STATUSES, PROGRAM_AUDIENCE } from '../mwasalatProgram/mwasalatProgram.constants.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';
import { getOrgTimezone, formatDateKeyInTimezone, localDayStartUtc, localDayEndUtc } from '../../utils/orgTimezone.js';

const addDaysToDateKey = (dateKey, days) => {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
};

const addMonthsToDateKey = (dateKey, months) => {
  const [y, m] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + months, 1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-01`;
};

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new AppError('Payments are not configured yet. Contact support.', 503);
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

// OMR has 3 decimal places (baisa) — Stripe wants the smallest unit
const toBaisa = (omr) => Math.round(omr * 1000);

const createCheckoutSession = async (learnerId, learnerRole, programId) => {
  // Internal learners are free regardless of price (see enroll() in
  // mwasalatProgram.service.js) — checkout is only for the paying external
  // learner audience.
  if (learnerRole !== MWASALAT_ROLES.EXTERNAL_LEARNER) {
    throw new AppError('Internal learners enroll for free — no payment required', 400);
  }

  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  // Belt-and-suspenders alongside the price-forced-to-0 guard in
  // mwasalatProgram.service.js (create/update) — a clearer error than the
  // generic free-course message below if this is ever reached directly.
  if (program.audience === PROGRAM_AUDIENCE.INTERNAL_ONLY) {
    throw new AppError('This course is not available to external learners', 403);
  }
  if (!program.price || program.price <= 0) throw new AppError('This program is free — enroll directly instead', 400);

  const existing = await MwasalatEnrollment.findOne({ learner: learnerId, program: programId });
  if (existing && existing.status !== ENROLLMENT_STATUS.REJECTED) {
    throw new AppError('You are already enrolled in this program', 409);
  }

  if (program.capacity) {
    const seatsTaken = await MwasalatEnrollment.countDocuments({
      program: programId, status: { $in: SEAT_CONSUMING_STATUSES },
    });
    if (seatsTaken >= program.capacity) throw new AppError('This session is full', 409);
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'omr',
        unit_amount: toBaisa(program.price),
        product_data: { name: program.title, description: program.description || undefined },
      },
      quantity: 1,
    }],
    metadata: { learnerId: String(learnerId), programId: String(programId) },
    success_url: `${process.env.CLIENT_URL}/learner/dashboard?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/learner/dashboard?purchase=cancelled`,
  });

  return { url: session.url };
};

// Half-price checkout to unlock a deadline-locked enrollment (see
// runDeadlineSweep in mwasalatProgram.service.js) — only ever reachable for
// an external learner's own LOCKED enrollment. `learnerId` is included in
// metadata alongside `enrollmentId` so the shared confirmSession ownership
// check below works unmodified for this session type too.
const createReactivationCheckoutSession = async (learnerId, learnerRole, enrollmentId) => {
  if (learnerRole !== MWASALAT_ROLES.EXTERNAL_LEARNER) {
    throw new AppError('Only external learners can be locked out of a course', 400);
  }

  const enrollment = await MwasalatEnrollment.findById(enrollmentId);
  if (!enrollment || String(enrollment.learner) !== String(learnerId)) {
    throw new AppError('Enrollment not found', 404);
  }
  if (enrollment.status !== ENROLLMENT_STATUS.LOCKED) {
    throw new AppError('This course is not locked', 400);
  }

  const program = await MwasalatProgram.findById(enrollment.program);
  if (!program) throw new AppError('Program not found', 404);

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'omr',
        unit_amount: toBaisa(program.price / 2),
        product_data: { name: `${program.title} — Reactivation`, description: 'Restores access to a course locked after missing its completion deadline.' },
      },
      quantity: 1,
    }],
    metadata: {
      kind: 'reactivation', learnerId: String(learnerId), enrollmentId: String(enrollmentId), programId: String(program._id),
    },
    success_url: `${process.env.CLIENT_URL}/learner/dashboard?reactivate=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/learner/dashboard?reactivate=cancelled`,
  });

  return { url: session.url };
};

// Shared by the webhook and the post-redirect confirm check, so an enrollment
// is created exactly once regardless of which path reaches it first.
const enrollFromPaidSession = async (session) => {
  const { learnerId, programId } = session.metadata ?? {};
  if (!learnerId || !programId) return null;

  const existing = await MwasalatEnrollment.findOne({ learner: learnerId, program: programId });
  if (existing && existing.status !== ENROLLMENT_STATUS.REJECTED) return existing;

  const program = await MwasalatProgram.findById(programId, 'requiresApproval');
  const status = program?.requiresApproval ? ENROLLMENT_STATUS.PENDING_APPROVAL : ENROLLMENT_STATUS.ENROLLED;

  // Payment already succeeded and the checkout-time capacity check reserved a
  // real seat — a previously-rejected re-purchase reuses that row instead of
  // hitting the unique {learner, program} index.
  if (existing) {
    existing.status = status;
    existing.purchasedAt = new Date();
    existing.rejectedAt = undefined;
    existing.rejectionReason = undefined;
    existing.approvedAt = undefined;
    existing.approvedBy = undefined;
    await existing.save();
    return existing;
  }

  let enrollment;
  try {
    enrollment = await MwasalatEnrollment.create({ learner: learnerId, program: programId, status });
    logger.info(`[mwasalat-payment] Enrolled learner ${learnerId} in program ${programId} after payment`);
  } catch (err) {
    // The webhook and the post-redirect confirm-session fallback can both pass the
    // findOne check above and race to create the same enrollment — the loser hits
    // the unique {learner, program} index. Treat that as success (the winner
    // already created it) instead of surfacing a raw duplicate-key error.
    if (err.code === 11000) {
      enrollment = await MwasalatEnrollment.findOne({ learner: learnerId, program: programId });
    } else {
      throw err;
    }
  }

  // Record the transaction too — idempotent on stripeSessionId in case both the
  // webhook and the post-redirect confirm check race to record the same session.
  try {
    await MwasalatTransaction.findOneAndUpdate(
      { stripeSessionId: session.id },
      {
        stripeSessionId: session.id,
        learner: learnerId,
        program: programId,
        amount: (session.amount_total ?? 0) / 1000,
        currency: (session.currency ?? 'omr').toUpperCase(),
        status: 'paid',
        type: 'enrollment',
        paidAt: new Date(),
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    logger.error(`[mwasalat-payment] Failed to record transaction for session ${session.id}: ${err.message}`);
  }

  return enrollment;
};

// Reactivates a deadline-locked enrollment after the half-price checkout
// above completes. Update-only (never creates an enrollment) — race-safe via
// the `status: LOCKED` guard on the final findOneAndUpdate: whichever of the
// webhook / confirmSession fallback gets there first flips the status away
// from LOCKED, so the loser's identical query matches nothing and safely no-ops
// instead of double-notifying or double-recording the payment.
const reactivateFromPaidSession = async (session) => {
  const { enrollmentId, learnerId, programId } = session.metadata ?? {};
  if (!enrollmentId) return null;

  const locked = await MwasalatEnrollment.findOne({ _id: enrollmentId, status: ENROLLMENT_STATUS.LOCKED });
  if (!locked) return null;

  const enrollment = await MwasalatEnrollment.findOneAndUpdate(
    { _id: enrollmentId, status: ENROLLMENT_STATUS.LOCKED },
    {
      $set: {
        status: locked.preLockStatus || ENROLLMENT_STATUS.ENROLLED,
        preLockStatus: null,
        lockedAt: null,
        overdueWarnedAt: null,
        reactivatedAt: new Date(),
      },
    },
    { new: true }
  );
  if (!enrollment) return null;

  logger.info(`[mwasalat-payment] Reactivated enrollment ${enrollmentId} after payment`);

  try {
    await MwasalatTransaction.findOneAndUpdate(
      { stripeSessionId: session.id },
      {
        stripeSessionId: session.id,
        learner: learnerId ?? enrollment.learner,
        program: programId ?? enrollment.program,
        amount: (session.amount_total ?? 0) / 1000,
        currency: (session.currency ?? 'omr').toUpperCase(),
        status: 'paid',
        type: 'reactivation',
        paidAt: new Date(),
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    logger.error(`[mwasalat-payment] Failed to record reactivation transaction for session ${session.id}: ${err.message}`);
  }

  return enrollment;
};

// Single dispatch point both the webhook and the confirmSession fallback
// funnel through, so a session's `metadata.kind` only has to be interpreted
// in one place.
const processCompletedSession = async (session) => (
  session.metadata?.kind === 'reactivation' ? reactivateFromPaidSession(session) : enrollFromPaidSession(session)
);

// Fallback for local/dev environments where the Stripe CLI isn't forwarding
// webhook events: verify the session directly with Stripe on the success
// redirect and enroll/reactivate immediately. Safe to call even after the
// webhook already handled it — processCompletedSession no-ops if so.
const confirmSession = async (learnerId, sessionId) => {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    throw new AppError('Payment not completed', 400);
  }
  if (String(session.metadata?.learnerId) !== String(learnerId)) {
    throw new AppError('This checkout session does not belong to you', 403);
  }

  const enrollment = await processCompletedSession(session);
  return { enrolled: !!enrollment };
};

const handleWebhook = async (rawBody, signature) => {
  const stripe = getStripe();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error(`[mwasalat-payment] Webhook signature verification failed: ${err.message}`);
    throw new AppError('Invalid webhook signature', 400);
  }

  if (event.type === 'checkout.session.completed') {
    await processCompletedSession(event.data.object);
  }

  return { received: true };
};

// Paginated transaction list for the admin Payments page, newest first.
const listTransactions = async ({ page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const [transactions, total] = await Promise.all([
    MwasalatTransaction.find({})
      .populate('learner', 'name email')
      .populate('program', 'title category titleAr categoryAr')
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(limit),
    MwasalatTransaction.countDocuments({}),
  ]);
  return { transactions, total, page, pages: Math.ceil(total / limit) || 1 };
};

// Revenue overview for the admin Payments page — total, this month, and a
// 6-month trend, computed the same "parallel queries + JS reduction" way the
// rest of the admin overview endpoints do.
const getRevenueSummary = async () => {
  const [allTransactions, totalTransactions] = await Promise.all([
    MwasalatTransaction.find({ status: 'paid' }, { amount: 1, paidAt: 1, program: 1 }),
    MwasalatTransaction.countDocuments({ status: 'paid' }),
  ]);

  const totalRevenue = allTransactions.reduce((sum, t) => sum + t.amount, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthRevenue = allTransactions
    .filter((t) => t.paidAt >= monthStart)
    .reduce((sum, t) => sum + t.amount, 0);

  const months = [];
  for (let i = 5; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    months.push({ label: start.toLocaleDateString('en-GB', { month: 'short' }), start, end });
  }
  const monthlyRevenue = months.map(({ label, start, end }) => {
    const monthTx = allTransactions.filter((t) => t.paidAt >= start && t.paidAt < end);
    return { label, value: monthTx.reduce((sum, t) => sum + t.amount, 0), count: monthTx.length };
  });

  // Top 5 programs by revenue — grouped from the same transaction fetch above,
  // then a single batch lookup for titles (no N+1).
  const revenueByProgram = {};
  allTransactions.forEach((t) => {
    const key = t.program?.toString();
    if (!key) return;
    revenueByProgram[key] = (revenueByProgram[key] ?? 0) + t.amount;
  });
  const topProgramIds = Object.entries(revenueByProgram)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => id);
  const topPrograms = await MwasalatProgram.find({ _id: { $in: topProgramIds } }, { title: 1, titleAr: 1 });
  const titleById = Object.fromEntries(topPrograms.map((p) => [p._id.toString(), { title: p.title, titleAr: p.titleAr }]));
  const topProgramsByRevenue = topProgramIds.map((id) => ({
    program: { _id: id, title: titleById[id]?.title ?? 'Untitled program', titleAr: titleById[id]?.titleAr },
    revenue: revenueByProgram[id],
  }));

  return { totalRevenue, thisMonthRevenue, totalTransactions, monthlyRevenue, topProgramsByRevenue };
};

// Optional YYYY-MM-DD from/to → Mongo paidAt filter. Shared by the sales report's
// summary and transaction-list queries so date bounds are interpreted identically.
// `from`/`to` are calendar days in the org's timezone (Settings → timezone), not UTC —
// otherwise "Today" would misbucket transactions near local midnight for anyone
// outside UTC.
const buildDateRangeFilter = async ({ from, to } = {}) => {
  const filter = {};
  if (from || to) {
    const timezone = await getOrgTimezone();
    filter.paidAt = {};
    if (from) filter.paidAt.$gte = localDayStartUtc(from, timezone);
    if (to) filter.paidAt.$lte = localDayEndUtc(to, timezone);
  }
  return filter;
};

// Daily buckets for ranges of a month or less (so short presets like "Today"/"This
// Week" don't collapse into one flat bar), monthly buckets otherwise. Bucket
// boundaries and labels are computed in the org's timezone, same reasoning as
// buildDateRangeFilter above.
const buildTrendBuckets = (start, end, timezone) => {
  const spanDays = (end - start) / (1000 * 60 * 60 * 24);
  const endKey = formatDateKeyInTimezone(end, timezone);
  const buckets = [];
  if (spanDays <= 31) {
    let cursorKey = formatDateKeyInTimezone(start, timezone);
    while (cursorKey <= endKey) {
      const bucketStart = localDayStartUtc(cursorKey, timezone);
      const bucketEnd = new Date(bucketStart.getTime() + 24 * 60 * 60 * 1000);
      buckets.push({
        label: bucketStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: timezone }),
        start: bucketStart,
        end: bucketEnd,
      });
      cursorKey = addDaysToDateKey(cursorKey, 1);
    }
  } else {
    let cursorKey = `${formatDateKeyInTimezone(start, timezone).slice(0, 7)}-01`;
    while (cursorKey <= endKey) {
      const bucketStart = localDayStartUtc(cursorKey, timezone);
      const nextMonthKey = addMonthsToDateKey(cursorKey, 1);
      buckets.push({
        label: bucketStart.toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: timezone }),
        start: bucketStart,
        end: localDayStartUtc(nextMonthKey, timezone),
      });
      cursorKey = nextMonthKey;
    }
  }
  return buckets;
};

// Sales report for the admin Sales Report page — same "parallel queries + JS
// reduction" idiom getRevenueSummary uses, but scoped to an optional date range so
// stat cards, trend chart, and top-programs chart all reflect the same window.
const getSalesReport = async ({ from, to } = {}) => {
  const timezone = await getOrgTimezone();
  const rangeTransactions = await MwasalatTransaction.find(
    await buildDateRangeFilter({ from, to }), { amount: 1, paidAt: 1, program: 1, status: 1 }
  );

  const paid = rangeTransactions.filter((t) => t.status === 'paid');
  const totalRevenue = paid.reduce((sum, t) => sum + t.amount, 0);
  const totalSales = paid.length;
  const averageSaleValue = totalSales ? totalRevenue / totalSales : 0;

  // "All Time" (no from/to) still needs a bounded window to plot a readable trend —
  // trailing 12 months, same fixed-window convention as getRevenueSummary's 6-month trend.
  const trendEnd = to ? localDayEndUtc(to, timezone) : new Date();
  const trendStart = from
    ? localDayStartUtc(from, timezone)
    : localDayStartUtc(addMonthsToDateKey(`${formatDateKeyInTimezone(trendEnd, timezone).slice(0, 7)}-01`, -11), timezone);
  const buckets = buildTrendBuckets(trendStart, trendEnd, timezone);
  const trend = buckets.map(({ label, start, end }) => {
    const bucketTx = paid.filter((t) => t.paidAt >= start && t.paidAt < end);
    return { label, value: bucketTx.reduce((sum, t) => sum + t.amount, 0), count: bucketTx.length };
  });

  // Top 5 programs by revenue in range — identical grouping to getRevenueSummary,
  // just fed from the range-filtered `paid` set instead of an all-time fetch.
  const revenueByProgram = {};
  paid.forEach((t) => {
    const key = t.program?.toString();
    if (!key) return;
    revenueByProgram[key] = (revenueByProgram[key] ?? 0) + t.amount;
  });
  const topProgramIds = Object.entries(revenueByProgram)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => id);
  const topPrograms = await MwasalatProgram.find({ _id: { $in: topProgramIds } }, { title: 1, titleAr: 1 });
  const titleById = Object.fromEntries(topPrograms.map((p) => [p._id.toString(), { title: p.title, titleAr: p.titleAr }]));
  const topProgramsByRevenue = topProgramIds.map((id) => ({
    program: { _id: id, title: titleById[id]?.title ?? 'Untitled program', titleAr: titleById[id]?.titleAr },
    revenue: revenueByProgram[id],
  }));

  // "vs previous period" comparison — the immediately preceding window of the
  // same length as the selected range, so "This Month" naturally compares
  // against last month, "Today" against yesterday, and a custom 7-day range
  // against the 7 days before it. Only skipped for "All Time" (no `from`
  // boundary to shift back from — there's no meaningful predecessor).
  let previousPeriod = null;
  if (from) {
    const rangeStart = localDayStartUtc(from, timezone);
    const rangeEnd = to ? localDayEndUtc(to, timezone) : new Date();
    const lengthMs = rangeEnd - rangeStart;
    const prevEnd = new Date(rangeStart.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - lengthMs);
    const prevTransactions = await MwasalatTransaction.find(
      { paidAt: { $gte: prevStart, $lte: prevEnd }, status: 'paid' }, { amount: 1 }
    );
    const prevRevenue = prevTransactions.reduce((sum, t) => sum + t.amount, 0);
    const prevSales = prevTransactions.length;
    previousPeriod = { totalRevenue: prevRevenue, totalSales: prevSales, averageSaleValue: prevSales ? prevRevenue / prevSales : 0 };
  }

  return { totalRevenue, totalSales, averageSaleValue, trend, topProgramsByRevenue, previousPeriod };
};

// Full (unpaginated) transaction list for the Sales Report's detail table, print
// view, and CSV export — unlike listTransactions this returns every row matching
// the range rather than a page, and nested-populates program.instructor so a
// report row can show who taught the course.
const listTransactionsForReport = async ({ from, to } = {}) => {
  const transactions = await MwasalatTransaction.find(await buildDateRangeFilter({ from, to }))
    .populate('learner', 'name email')
    .populate({ path: 'program', select: 'title category titleAr categoryAr instructor', populate: { path: 'instructor', select: 'name' } })
    .sort({ paidAt: -1 });
  return { transactions, total: transactions.length };
};

export const mwasalatPaymentService = {
  createCheckoutSession, createReactivationCheckoutSession, handleWebhook, confirmSession, listTransactions,
  getRevenueSummary, getSalesReport, listTransactionsForReport,
};
