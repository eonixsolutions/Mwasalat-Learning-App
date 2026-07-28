import 'dotenv/config';
import mongoose from 'mongoose';
import MwasalatUser from '../modules/mwasalatUser/mwasalatUser.model.js';
import MwasalatDepartment from '../modules/mwasalatDepartment/mwasalatDepartment.model.js';
import { MWASALAT_ROLES } from '../modules/mwasalatUser/mwasalatUser.constants.js';

// One-off seed: one supervisor per department (see seedMwasalatDepartments.js
// and seedMwasalatDepartmentAdmins.js). Unlike instructors, supervisors carry
// a `department` — they're the line manager whose learners list them as
// `supervisor` for enrollment/completion approvals (mwasalatUser.model.js),
// created via inviteStaff() same as department_admin/it_support (still
// platformAdminOnly — see mwasalatUser.routes.js).
// createdAt is backdated to a couple of weeks after each department admin,
// so it reads as "team lead assigned shortly after the department admin was
// set up" instead of everyone landing on the day this script ran. Run with:
//   npm run seed:mwasalat-supervisors   (from backend/)
const DEMO_PASSWORD = 'Supervisor@1234';

const SEED_SUPERVISORS = [
  { department: 'Operations', name: 'Marwan Al-Kindi', email: 'marwan.alkindi@mwasalat.om', createdAt: '2026-02-17T09:20:00' },
  { department: 'Fleet & Maintenance', name: 'Suha Al-Saadi', email: 'suha.alsaadi@mwasalat.om', createdAt: '2026-02-19T10:05:00' },
  { department: 'Human Resources', name: 'Bilal Al-Balushi', email: 'bilal.albalushi@mwasalat.om', createdAt: '2026-02-25T11:30:00' },
  { department: 'Finance', name: 'Widad Al-Zadjali', email: 'widad.alzadjali@mwasalat.om', createdAt: '2026-03-04T13:15:00' },
  { department: 'Information Technology', name: 'Ghassan Al-Harthy', email: 'ghassan.alharthy@mwasalat.om', createdAt: '2026-03-20T09:45:00' },
  { department: 'Customer Experience', name: 'Intisar Al-Shukaili', email: 'intisar.alshukaili@mwasalat.om', createdAt: '2026-04-07T14:00:00' },
  { department: 'Health, Safety & Environment', name: 'Saif Al-Rashdi', email: 'saif.alrashdi@mwasalat.om', createdAt: '2026-04-29T10:25:00' },
  { department: 'Legal & Compliance', name: 'Rawya Al-Ghafri', email: 'rawya.alghafri@mwasalat.om', createdAt: '2026-05-16T15:10:00' },
  { department: 'Marketing & Communications', name: 'Nabil Al-Jabri', email: 'nabil.aljabri@mwasalat.om', createdAt: '2026-06-09T11:40:00' },
  { department: 'Training & Development', name: 'Iman Al-Kalbani', email: 'iman.alkalbani@mwasalat.om', createdAt: '2026-07-01T10:50:00' },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  for (const sup of SEED_SUPERVISORS) {
    const dept = await MwasalatDepartment.findOne({ name: sup.department });
    if (!dept) {
      console.log(`Skipped (department not found): ${sup.department}`);
      continue; // eslint-disable-line no-continue
    }

    const existing = await MwasalatUser.findOne({ email: sup.email });
    if (existing) {
      console.log(`Skipped (already exists): ${sup.email}`);
      continue; // eslint-disable-line no-continue
    }

    const doc = await MwasalatUser.create({
      name: sup.name,
      email: sup.email,
      password: DEMO_PASSWORD,
      role: MWASALAT_ROLES.SUPERVISOR,
      department: dept._id,
      isActive: true,
      passwordSet: true,
    });

    const backdate = new Date(sup.createdAt);
    // Mongoose marks createdAt as immutable (via the timestamps plugin), so
    // Model.updateOne() silently drops changes to it — use the raw
    // collection driver, which bypasses Mongoose schema casting.
    await MwasalatUser.collection.updateOne(
      { _id: doc._id },
      { $set: { createdAt: backdate, updatedAt: backdate, passwordChangedAt: backdate } }
    );

    console.log(`Created: ${sup.email} → ${sup.department} (backdated to ${backdate.toISOString().slice(0, 10)})`);
  }

  await mongoose.disconnect();

  console.log('\nSupervisor Credentials');
  console.log('='.repeat(90));
  for (const s of SEED_SUPERVISORS) {
    console.log(`${s.department.padEnd(30)} | ${s.name.padEnd(20)} | ${s.email.padEnd(30)} | ${DEMO_PASSWORD}`);
  }
  console.log('='.repeat(90));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
