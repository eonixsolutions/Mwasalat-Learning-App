import 'dotenv/config';
import mongoose from 'mongoose';
import MwasalatUser from '../modules/mwasalatUser/mwasalatUser.model.js';
import MwasalatDepartment from '../modules/mwasalatDepartment/mwasalatDepartment.model.js';
import { MWASALAT_ROLES } from '../modules/mwasalatUser/mwasalatUser.constants.js';

// One-off seed: one department_admin per department (see seedMwasalatDepartments.js).
// Shared demo password for all of them. createdAt is backdated to a few days
// after each department's own createdAt, so it reads as "admin was assigned
// shortly after the department was set up" instead of everything landing today.
// Run with:
//   npm run seed:mwasalat-department-admins   (from backend/)
const DEMO_PASSWORD = 'dAdmin@1234';

const SEED_ADMINS = [
  { department: 'Operations', name: 'Khalid Al-Rawahi', email: 'khalid.alrawahi@mwasalat.om', createdAt: '2026-02-10T10:12:00' },
  { department: 'Fleet & Maintenance', name: 'Yousuf Al-Habsi', email: 'yousuf.alhabsi@mwasalat.om', createdAt: '2026-02-11T09:45:00' },
  { department: 'Human Resources', name: 'Aisha Al-Farsi', email: 'aisha.alfarsi@mwasalat.om', createdAt: '2026-02-18T13:20:00' },
  { department: 'Finance', name: 'Salim Al-Maskari', email: 'salim.almaskari@mwasalat.om', createdAt: '2026-02-25T11:05:00' },
  { department: 'Information Technology', name: 'Noor Al-Siyabi', email: 'noor.alsiyabi@mwasalat.om', createdAt: '2026-03-13T15:40:00' },
  { department: 'Customer Experience', name: 'Huda Al-Busaidi', email: 'huda.albusaidi@mwasalat.om', createdAt: '2026-03-31T10:22:00' },
  { department: 'Health, Safety & Environment', name: 'Rashid Al-Amri', email: 'rashid.alamri@mwasalat.om', createdAt: '2026-04-22T09:15:00' },
  { department: 'Legal & Compliance', name: 'Zainab Al-Lawati', email: 'zainab.allawati@mwasalat.om', createdAt: '2026-05-09T14:05:00' },
  { department: 'Marketing & Communications', name: 'Omar Al-Riyami', email: 'omar.alriyami@mwasalat.om', createdAt: '2026-06-02T11:50:00' },
  { department: 'Training & Development', name: 'Layla Al-Mahrouqi', email: 'layla.almahrouqi@mwasalat.om', createdAt: '2026-06-24T16:10:00' },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const created = [];

  for (const admin of SEED_ADMINS) {
    const dept = await MwasalatDepartment.findOne({ name: admin.department });
    if (!dept) {
      console.log(`Skipped (department not found): ${admin.department}`);
      continue; // eslint-disable-line no-continue
    }

    const existing = await MwasalatUser.findOne({ email: admin.email });
    if (existing) {
      console.log(`Skipped (already exists): ${admin.email}`);
      created.push({ ...admin, skipped: true });
      continue; // eslint-disable-line no-continue
    }

    const doc = await MwasalatUser.create({
      name: admin.name,
      email: admin.email,
      password: DEMO_PASSWORD,
      role: MWASALAT_ROLES.DEPARTMENT_ADMIN,
      department: dept._id,
      isActive: true,
      passwordSet: true,
    });

    const backdate = new Date(admin.createdAt);
    // Mongoose marks createdAt as immutable (via the timestamps plugin), so
    // Model.updateOne() silently drops changes to it — use the raw
    // collection driver, which bypasses Mongoose schema casting.
    await MwasalatUser.collection.updateOne(
      { _id: doc._id },
      { $set: { createdAt: backdate, updatedAt: backdate, passwordChangedAt: backdate } }
    );

    created.push(admin);
    console.log(`Created: ${admin.email} → ${admin.department} (backdated to ${backdate.toISOString().slice(0, 10)})`);
  }

  await mongoose.disconnect();

  console.log('\nDepartment Admin Credentials');
  console.log('='.repeat(70));
  for (const a of SEED_ADMINS) {
    console.log(`${a.department.padEnd(30)} | ${a.email.padEnd(30)} | ${DEMO_PASSWORD}`);
  }
  console.log('='.repeat(70));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
