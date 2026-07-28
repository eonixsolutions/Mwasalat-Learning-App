import 'dotenv/config';
import mongoose from 'mongoose';
import MwasalatUser from '../modules/mwasalatUser/mwasalatUser.model.js';
import MwasalatDepartment from '../modules/mwasalatDepartment/mwasalatDepartment.model.js';
import { MWASALAT_ROLES } from '../modules/mwasalatUser/mwasalatUser.constants.js';

// One-off seed: 1 external learner per department (role EXTERNAL_LEARNER —
// same platform access as LEARNER, kept distinct per the schema comment on
// mwasalatUser.model.js purely so reporting/department-scoping can tell
// contractor learners apart from internal staff-learners, see
// seedMwasalatInternalLearners.js). Linked to that department's supervisor
// the same way internal learners are.
// createdAt is backdated to recent-but-staggered dates (mid-Jun to late-Jul
// 2026) — external/contractor learners tend to be brought on after a
// department's internal team is already staffed, so they land later in each
// department's timeline than the internal-learner batch, but still spread
// out rather than all landing on the day this script ran. Run with:
//   npm run seed:mwasalat-external-learners   (from backend/)
const DEMO_PASSWORD = 'eLearner@1234';

const SEED_EXTERNAL_LEARNERS = [
  { department: 'Operations', name: 'Nawaf Al-Habsi', email: 'nawaf.alhabsi@gmail.com', createdAt: '2026-06-15T10:10:00' },
  { department: 'Fleet & Maintenance', name: 'Munira Al-Farsi', email: 'munira.alfarsi@gmail.com', createdAt: '2026-06-20T11:25:00' },
  { department: 'Human Resources', name: 'Khalifa Al-Maskari', email: 'khalifa.almaskari@outlook.com', createdAt: '2026-06-25T09:40:00' },
  { department: 'Finance', name: 'Latifa Al-Siyabi', email: 'latifa.alsiyabi@gmail.com', createdAt: '2026-06-29T14:05:00' },
  { department: 'Information Technology', name: 'Marzooq Al-Busaidi', email: 'marzooq.albusaidi@outlook.com', createdAt: '2026-07-04T10:50:00' },
  { department: 'Customer Experience', name: 'Zahra Al-Amri', email: 'zahra.alamri@gmail.com', createdAt: '2026-07-09T13:15:00' },
  { department: 'Health, Safety & Environment', name: 'Abdullah Al-Lawati', email: 'abdullah.allawati@yahoo.com', createdAt: '2026-07-13T09:30:00' },
  { department: 'Legal & Compliance', name: 'Thuraya Al-Riyami', email: 'thuraya.alriyami@gmail.com', createdAt: '2026-07-17T15:00:00' },
  { department: 'Marketing & Communications', name: 'Juma Al-Mahrouqi', email: 'juma.almahrouqi@outlook.com', createdAt: '2026-07-20T11:45:00' },
  { department: 'Training & Development', name: 'Manal Al-Rawahi', email: 'manal.alrawahi@gmail.com', createdAt: '2026-07-24T10:20:00' },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const roster = [];

  for (const ext of SEED_EXTERNAL_LEARNERS) {
    const dept = await MwasalatDepartment.findOne({ name: ext.department });
    if (!dept) {
      console.log(`Skipped (department not found): ${ext.department}`);
      continue; // eslint-disable-line no-continue
    }

    const supervisor = await MwasalatUser.findOne({ role: MWASALAT_ROLES.SUPERVISOR, department: dept._id });

    const existing = await MwasalatUser.findOne({ email: ext.email });
    if (existing) {
      console.log(`Skipped (already exists): ${ext.email}`);
      continue; // eslint-disable-line no-continue
    }

    const doc = await MwasalatUser.create({
      name: ext.name,
      email: ext.email,
      password: DEMO_PASSWORD,
      role: MWASALAT_ROLES.EXTERNAL_LEARNER,
      department: dept._id,
      supervisor: supervisor?._id ?? null,
      isActive: true,
      passwordSet: true,
    });

    const backdate = new Date(ext.createdAt);
    // Mongoose marks createdAt as immutable (via the timestamps plugin), so
    // Model.updateOne() silently drops changes to it — use the raw
    // collection driver, which bypasses Mongoose schema casting.
    await MwasalatUser.collection.updateOne(
      { _id: doc._id },
      { $set: { createdAt: backdate, updatedAt: backdate, passwordChangedAt: backdate } }
    );

    roster.push({ department: ext.department, name: ext.name, email: ext.email, createdAt: backdate.toISOString().slice(0, 10) });
    console.log(`Created: ${ext.email} → ${ext.department} (backdated to ${backdate.toISOString().slice(0, 10)})`);
  }

  await mongoose.disconnect();

  console.log('\nExternal Learner Credentials');
  console.log('='.repeat(90));
  for (const e of roster) {
    console.log(`${e.department.padEnd(30)} | ${e.name.padEnd(20)} | ${e.email.padEnd(30)} | ${DEMO_PASSWORD}`);
  }
  console.log('='.repeat(90));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
