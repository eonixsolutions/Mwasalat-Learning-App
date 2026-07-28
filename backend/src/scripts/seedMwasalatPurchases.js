import 'dotenv/config';
import crypto from 'crypto';
import mongoose from 'mongoose';
import MwasalatProgram from '../modules/mwasalatProgram/mwasalatProgram.model.js';
import MwasalatUser from '../modules/mwasalatUser/mwasalatUser.model.js';
import MwasalatEnrollment from '../modules/mwasalatProgram/mwasalatEnrollment.model.js';
import MwasalatTransaction from '../modules/mwasalatPayment/mwasalatTransaction.model.js';
import { MWASALAT_ROLES } from '../modules/mwasalatUser/mwasalatUser.constants.js';
import { ENROLLMENT_STATUS } from '../modules/mwasalatProgram/mwasalatProgram.constants.js';

// Stage 2 of 3 (see plan: seed learner activity — enrollments, purchases,
// quiz passes, certificates). Covers every priced, external-visible program
// (price > 0, audience 'all' or 'external_only') — 2 external learners buy
// each one.
//
// The function that actually creates an enrollment+transaction after a real
// Stripe payment (`enrollFromPaidSession` in mwasalatPayment.service.js) is
// NOT exported — it's only reachable via a real Stripe webhook/session,
// which needs an actual payment. This script replicates its exact logic by
// hand (read in full during planning): create MwasalatEnrollment (status
// 'pending_approval' if the program requires approval, else 'enrolled') +
// MwasalatTransaction (status 'paid', type 'enrollment', a synthetic
// stripeSessionId), same shape a real webhook-driven purchase would leave.
//
// Backdates paidAt/purchasedAt/createdAt afterward — same raw-collection-
// driver technique as every other script this session (createdAt is
// immutable under Mongoose's timestamps plugin).
// Run with:
//   npm run seed:mwasalat-purchases   (from backend/)

const TODAY = new Date('2026-07-27T00:00:00');
const MAX_DATE = new Date('2026-07-26T00:00:00');

function purchaseDate(learnerCreatedAt, programCreatedAt, offsetDays) {
  const base = new Date(Math.max(new Date(learnerCreatedAt).getTime(), new Date(programCreatedAt).getTime()));
  const target = new Date(base);
  target.setDate(target.getDate() + offsetDays);
  target.setHours(10 + (offsetDays % 5), (offsetDays * 17) % 60, 0, 0);
  if (target <= MAX_DATE) return target;

  const shortlyAfterBase = new Date(base.getTime() + 4 * 60 * 60 * 1000);
  return shortlyAfterBase < MAX_DATE ? MAX_DATE : shortlyAfterBase;
}

async function purchaseProgram(learner, program, date) {
  const existing = await MwasalatEnrollment.findOne({ learner: learner._id, program: program._id });
  if (existing && existing.status !== ENROLLMENT_STATUS.REJECTED) return null; // already has it — same guard enrollFromPaidSession uses

  const status = program.requiresApproval ? ENROLLMENT_STATUS.PENDING_APPROVAL : ENROLLMENT_STATUS.ENROLLED;
  const enrollment = await MwasalatEnrollment.create({ learner: learner._id, program: program._id, status });

  const stripeSessionId = `cs_test_seed_${crypto.randomBytes(16).toString('hex')}`;
  const transaction = await MwasalatTransaction.create({
    learner: learner._id,
    program: program._id,
    amount: program.price,
    currency: 'OMR',
    stripeSessionId,
    status: 'paid',
    type: 'enrollment',
  });

  await MwasalatEnrollment.collection.updateOne(
    { _id: enrollment._id },
    { $set: { purchasedAt: date, createdAt: date, updatedAt: date, lastActivityAt: date, lastActiveDate: date.toISOString().slice(0, 10) } }
  );
  await MwasalatTransaction.collection.updateOne(
    { _id: transaction._id },
    { $set: { paidAt: date, createdAt: date, updatedAt: date } }
  );

  return { enrollment, transaction };
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const pricedPrograms = await MwasalatProgram.find({
    price: { $gt: 0 },
    audience: { $in: ['all', 'external_only'] },
  }).sort({ createdAt: 1 });
  console.log(`Found ${pricedPrograms.length} priced, external-visible program(s)`);

  const externalLearners = await MwasalatUser.find({ role: MWASALAT_ROLES.EXTERNAL_LEARNER, isActive: true }).sort({ name: 1 });
  console.log(`Found ${externalLearners.length} external learner(s)`);

  const results = { purchased: 0, skipped: 0 };
  let rotatingIndex = 0;

  for (const program of pricedPrograms) {
    const buyers = [
      externalLearners[rotatingIndex % externalLearners.length],
      externalLearners[(rotatingIndex + 1) % externalLearners.length],
    ];
    rotatingIndex += 2;

    let i = 0;
    for (const learner of buyers) {
      const date = purchaseDate(learner.createdAt, program.createdAt, 10 + i * 6);
      const result = await purchaseProgram(learner, program, date);
      if (result) {
        results.purchased += 1;
        console.log(`Purchased: ${learner.name} -> ${program.title} (${program.price} OMR, backdated to ${date.toISOString().slice(0, 10)})`);
      } else {
        results.skipped += 1;
        console.log(`Skipped (already enrolled): ${learner.name} -> ${program.title}`);
      }
      i += 1;
    }
  }

  console.log('\nSummary:', results);
  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
