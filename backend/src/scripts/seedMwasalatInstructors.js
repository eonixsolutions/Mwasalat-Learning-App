import 'dotenv/config';
import mongoose from 'mongoose';
import MwasalatUser from '../modules/mwasalatUser/mwasalatUser.model.js';
import { MWASALAT_ROLES } from '../modules/mwasalatUser/mwasalatUser.constants.js';

// One-off seed for platform-wide instructors — per mwasalatUser.routes.js,
// instructors are only ever created via POST /invite-instructor, which is
// platformAdminOnly, and inviteInstructor() never sets a `department` (same
// as super_admin/platform_admin). So instructors are common across the whole
// platform, not tied to any single department.
// createdAt is backdated and staggered (Jan-Jul 2026) so they don't all show
// up on the day this script ran. Run with:
//   npm run seed:mwasalat-instructors   (from backend/)
const DEMO_PASSWORD = 'Instructor@1234';

const SEED_INSTRUCTORS = [
  { name: 'Rami Al-Kharusi', email: 'rami.alkharusi@mwasalat.om', createdAt: '2026-01-20T09:30:00' },
  { name: 'Dana Al-Shibli', email: 'dana.alshibli@mwasalat.om', createdAt: '2026-02-05T10:15:00' },
  { name: 'Yasir Al-Ismaili', email: 'yasir.alismaili@mwasalat.om', createdAt: '2026-03-02T11:00:00' },
  { name: 'Farah Al-Kiyumi', email: 'farah.alkiyumi@mwasalat.om', createdAt: '2026-03-25T13:45:00' },
  { name: 'Anwar Al-Balushi', email: 'anwar.albalushi@mwasalat.om', createdAt: '2026-04-15T09:50:00' },
  { name: 'Samira Al-Zadjali', email: 'samira.alzadjali@mwasalat.om', createdAt: '2026-05-10T14:20:00' },
  { name: 'Firas Al-Mukhaini', email: 'firas.almukhaini@mwasalat.om', createdAt: '2026-06-08T10:40:00' },
  { name: 'Lamia Al-Ajmi', email: 'lamia.alajmi@mwasalat.om', createdAt: '2026-07-02T15:05:00' },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  for (const instructor of SEED_INSTRUCTORS) {
    const existing = await MwasalatUser.findOne({ email: instructor.email });
    if (existing) {
      console.log(`Skipped (already exists): ${instructor.email}`);
      continue; // eslint-disable-line no-continue
    }

    const doc = await MwasalatUser.create({
      name: instructor.name,
      email: instructor.email,
      password: DEMO_PASSWORD,
      role: MWASALAT_ROLES.INSTRUCTOR,
      isActive: true,
      passwordSet: true,
    });

    const backdate = new Date(instructor.createdAt);
    // Mongoose marks createdAt as immutable (via the timestamps plugin), so
    // Model.updateOne() silently drops changes to it — use the raw
    // collection driver, which bypasses Mongoose schema casting.
    await MwasalatUser.collection.updateOne(
      { _id: doc._id },
      { $set: { createdAt: backdate, updatedAt: backdate, passwordChangedAt: backdate } }
    );

    console.log(`Created: ${instructor.email} (backdated to ${backdate.toISOString().slice(0, 10)})`);
  }

  await mongoose.disconnect();

  console.log('\nInstructor Credentials');
  console.log('='.repeat(70));
  for (const i of SEED_INSTRUCTORS) {
    console.log(`${i.name.padEnd(20)} | ${i.email.padEnd(30)} | ${DEMO_PASSWORD}`);
  }
  console.log('='.repeat(70));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
