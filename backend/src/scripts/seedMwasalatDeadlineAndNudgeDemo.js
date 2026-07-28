import 'dotenv/config';
import crypto from 'crypto';
import mongoose from 'mongoose';
import MwasalatProgram from '../modules/mwasalatProgram/mwasalatProgram.model.js';
import MwasalatUser from '../modules/mwasalatUser/mwasalatUser.model.js';
import MwasalatEnrollment from '../modules/mwasalatProgram/mwasalatEnrollment.model.js';
import MwasalatTransaction from '../modules/mwasalatPayment/mwasalatTransaction.model.js';
import MwasalatNotification from '../modules/mwasalatNotification/mwasalatNotification.model.js';
import { mwasalatProgramService } from '../modules/mwasalatProgram/mwasalatProgram.service.js';

// Demo data for two features that had nothing to show yet:
//  1. Inactivity nudge — no new data needed; many already-seeded incomplete
//     enrollments are naturally stale enough (backdated Feb-Jun). Just needs
//     the real computeEngagementAndNudge() actually run once (it's cron-only,
//     3:00 AM daily, and no server has been up through that with this data
//     in place).
//  2. Deadline warn/lock — genuinely missing: no external-visible program had
//     expectedCompletionDays set, so computeDueAt() always returned null and
//     runDeadlineSweep() had nothing to act on. Adds it to 2 programs plus 3
//     purchase-style enrollments precisely dated to land in the "not yet
//     due" / "warned" / "locked" windows (WARN_DAYS=10, LOCK_DAYS=5, i.e.
//     lock at 15+ days past due — see runDeadlineSweep in
//     mwasalatProgram.service.js).
// Per your call: skipping the internal-learner/supervisor branch entirely
// (frontend supervisor UI is hidden for this demo) — external learners only.
//
// Also works around a real bug found while reading the code: runDeadlineSweep's
// notifyUsers() calls for external learners use type 'overdue_warning' /
// 'overdue_lock', but neither value is in MwasalatNotification's schema enum
// (mwasalatNotification.model.js) — so that create() throws a validation
// error. It's caught per-enrollment inside runDeadlineSweep, so the actual
// lock/status change still saves correctly, but no notification document
// gets created, meaning nothing would show in the bell. Not something to
// silently paper over — flagged in the final summary — but for the demo to
// actually show a notification, this script inserts the equivalent
// notification directly (raw driver, bypassing the enum) after confirming
// the real sweep's own attempt failed.
// Run with:
//   npm run seed:mwasalat-deadline-nudge-demo   (from backend/)

async function purchaseProgram(learner, program, date) {
  const existing = await MwasalatEnrollment.findOne({ learner: learner._id, program: program._id });
  if (existing) return null;

  const enrollment = await MwasalatEnrollment.create({ learner: learner._id, program: program._id, status: 'enrolled' });
  const transaction = await MwasalatTransaction.create({
    learner: learner._id, program: program._id, amount: program.price, currency: 'OMR',
    stripeSessionId: `cs_test_seed_${crypto.randomBytes(16).toString('hex')}`, status: 'paid', type: 'enrollment',
  });
  await MwasalatEnrollment.collection.updateOne(
    { _id: enrollment._id },
    { $set: { purchasedAt: date, createdAt: date, updatedAt: date, lastActivityAt: date, lastActiveDate: date.toISOString().slice(0, 10) } }
  );
  await MwasalatTransaction.collection.updateOne({ _id: transaction._id }, { $set: { paidAt: date, createdAt: date, updatedAt: date } });
  return enrollment;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // ── 1. Give two external-visible programs a completion deadline ──
  const trafficLaw = await MwasalatProgram.findOne({ title: 'Traffic Law & Regulatory Updates (Oman)' });
  const newSystems = await MwasalatProgram.findOne({ title: 'New Systems & Digital Tools for External Partners' });
  if (!trafficLaw || !newSystems) throw new Error('Expected programs not found');

  await MwasalatProgram.collection.updateOne({ _id: trafficLaw._id }, { $set: { expectedCompletionDays: 7 } });
  await MwasalatProgram.collection.updateOne({ _id: newSystems._id }, { $set: { expectedCompletionDays: 7 } });
  console.log('Set expectedCompletionDays: 7 on Traffic Law & New Systems & Digital Tools');

  // ── 2. Three fresh purchases, precisely dated ──
  const learnerByEmail = async (email) => MwasalatUser.findOne({ email });
  const munira = await learnerByEmail('munira.alfarsi@gmail.com');
  const latifa = await learnerByEmail('latifa.alsiyabi@gmail.com');
  const khalifa = await learnerByEmail('khalifa.almaskari@outlook.com');

  const notYetDue = await purchaseProgram(munira, trafficLaw, new Date('2026-07-25T10:00:00'));
  const warned = await purchaseProgram(latifa, trafficLaw, new Date('2026-07-09T12:00:00'));
  const locked = await purchaseProgram(khalifa, newSystems, new Date('2026-07-03T12:00:00'));
  console.log('Created:', {
    notYetDue: notYetDue ? `${munira.name} -> Traffic Law (purchased 2026-07-25, due 2026-08-01)` : 'skipped (already enrolled)',
    warned: warned ? `${latifa.name} -> Traffic Law (purchased 2026-07-09, due 2026-07-16)` : 'skipped (already enrolled)',
    locked: locked ? `${khalifa.name} -> New Systems (purchased 2026-07-03, due 2026-07-10)` : 'skipped (already enrolled)',
  });

  // ── 3. Run the real deadline sweep ──
  const sweepResult = await mwasalatProgramService.runDeadlineSweep();
  console.log('runDeadlineSweep result:', sweepResult);

  // Confirm whether the real notification write actually landed (it won't —
  // see the header comment) and patch it in directly if not, so the demo's
  // notification bell has something to show. Checked precisely against
  // {recipients, type} — not "does this learner have any notification at
  // all", which would false-positive on unrelated ones.
  for (const [enrollment, expectedType, title, message] of [
    [warned, 'overdue_warning', 'Course completion overdue', `"Traffic Law & Regulatory Updates (Oman)" was due on ${new Date('2026-07-16T12:00:00').toDateString()} and is still incomplete. You have 5 more days before access is locked.`],
    [locked, 'overdue_lock', 'Course access locked', '"New Systems & Digital Tools for External Partners" has been locked because it wasn\'t completed in time. Pay half the course price to reactivate it.'],
  ]) {
    if (!enrollment) continue; // eslint-disable-line no-continue
    const alreadyExists = await MwasalatNotification.collection.findOne({ recipients: enrollment.learner, type: expectedType });
    if (alreadyExists) { console.log(`  ${expectedType} notification already exists for this learner — skipping.`); continue; } // eslint-disable-line no-continue

    console.log(`  Confirmed: no notification document was created for the ${expectedType} event (schema enum gap) — inserting the equivalent directly.`);
    const program = await MwasalatProgram.findById(enrollment.program, 'instructor');
    await MwasalatNotification.collection.insertOne({
      title, message, createdBy: program.instructor, recipients: [enrollment.learner], readBy: [], roles: [],
      type: expectedType, // not in the schema enum — inserted via raw driver, matches the real (buggy) intent of runDeadlineSweep
      createdAt: new Date(), updatedAt: new Date(),
    });
  }

  // ── 4. Run the real inactivity-nudge sweep (no new data needed for this one) ──
  const nudgeResult = await mwasalatProgramService.computeEngagementAndNudge();
  console.log('computeEngagementAndNudge result:', nudgeResult);

  await mongoose.disconnect();
  console.log('\nDone.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
