import 'dotenv/config';
import mongoose from 'mongoose';
import MwasalatUser from '../modules/mwasalatUser/mwasalatUser.model.js';
import MwasalatDepartment from '../modules/mwasalatDepartment/mwasalatDepartment.model.js';
import { MWASALAT_ROLES } from '../modules/mwasalatUser/mwasalatUser.constants.js';

// One-off seed: 4 internal learners per department (role LEARNER — the
// schema comment on mwasalatUser.model.js distinguishes it from
// EXTERNAL_LEARNER precisely for "internal staff-learner" vs
// "external/contractor learner" reporting). Mirrors what bulkImport() does
// (mwasalatUser.service.js) — department set from the importing admin — and
// links each learner to that department's supervisor (see
// seedMwasalatSupervisors.js) via the `supervisor` field used for
// enrollment/completion approvals.
// createdAt is staggered per learner and scaled to how long that
// department's supervisor has existed, so headcount grows organically
// instead of everyone joining on the day this script ran. Run with:
//   npm run seed:mwasalat-internal-learners   (from backend/)
const DEMO_PASSWORD = 'Learner@1234';

const MALE_FIRST_NAMES = ['Hamed', 'Nasser', 'Said', 'Waleed', 'Faisal', 'Tariq', 'Adel', 'Majid', 'Saud', 'Hilal', 'Turki', 'Ali', 'Hamdan', 'Yaqoub', 'Bader', 'Fahad', 'Isa', 'Jamal', 'Khalfan', 'Mansoor'];
const FEMALE_FIRST_NAMES = ['Amal', 'Salma', 'Reem', 'Maha', 'Muna', 'Shatha', 'Wafa', 'Asma', 'Buthaina', 'Ghalia', 'Hind', 'Rahma', 'Yasmin', 'Sara', 'Alya', 'Nadia', 'Ibtisam', 'Jamila', 'Karima', 'Lubna'];
const FAMILY_NAMES = ['Al-Balushi', 'Al-Zadjali', 'Al-Harthy', 'Al-Kindi', 'Al-Rawahi', 'Al-Habsi', 'Al-Farsi', 'Al-Maskari', 'Al-Siyabi', 'Al-Busaidi', 'Al-Amri', 'Al-Lawati', 'Al-Riyami', 'Al-Mahrouqi', 'Al-Hinai', 'Al-Abri', 'Al-Saadi', 'Al-Wahaibi', 'Al-Ghafri', 'Al-Jabri', 'Al-Shukaili', 'Al-Kalbani', 'Al-Yahyai', 'Al-Hashmi', 'Al-Rashdi', 'Al-Rasbi', 'Al-Toobi', 'Al-Nabhani', 'Al-Azri', 'Al-Ghassani'];

const DEPARTMENTS = [
  'Operations', 'Fleet & Maintenance', 'Human Resources', 'Finance', 'Information Technology',
  'Customer Experience', 'Health, Safety & Environment', 'Legal & Compliance',
  'Marketing & Communications', 'Training & Development',
];

const LEARNERS_PER_DEPARTMENT = 4;
const OFFSET_DAYS = [10, 35, 65, 100]; // days after the department's supervisor joined
const MAX_OFFSET_DAYS = 100;
const MAX_DATE = new Date('2026-07-24T00:00:00'); // keep a visible gap before "today"

function scaledDate(baseDate, offsetDays, hour) {
  const availableDays = Math.max(Math.floor((MAX_DATE - baseDate) / 86400000), 5);
  const scale = Math.min(1, availableDays / MAX_OFFSET_DAYS);
  const actualOffset = Math.round(offsetDays * scale);
  const d = new Date(baseDate);
  d.setDate(d.getDate() + actualOffset);
  d.setHours(hour, (actualOffset * 11) % 60, 0, 0);
  return d;
}

let maleIdx = 0;
let femaleIdx = 0;
let familyIdx = 0;
let toggle = 0;
const usedFullNames = new Set();

function nextPerson() {
  toggle += 1;
  const first = toggle % 2 === 1
    ? MALE_FIRST_NAMES[maleIdx++ % MALE_FIRST_NAMES.length] // eslint-disable-line no-plusplus
    : FEMALE_FIRST_NAMES[femaleIdx++ % FEMALE_FIRST_NAMES.length]; // eslint-disable-line no-plusplus

  let family;
  let fullName;
  do {
    family = FAMILY_NAMES[familyIdx % FAMILY_NAMES.length];
    familyIdx += 1;
    fullName = `${first} ${family}`;
  } while (usedFullNames.has(fullName));
  usedFullNames.add(fullName);

  const email = `${first.toLowerCase()}.${family.toLowerCase().replace(/-/g, '')}@mwasalat.om`;
  return { name: fullName, email };
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const roster = [];

  for (const deptName of DEPARTMENTS) {
    const dept = await MwasalatDepartment.findOne({ name: deptName });
    if (!dept) {
      console.log(`Skipped (department not found): ${deptName}`);
      continue; // eslint-disable-line no-continue
    }

    const supervisor = await MwasalatUser.findOne({ role: MWASALAT_ROLES.SUPERVISOR, department: dept._id });
    if (!supervisor) {
      console.log(`Skipped (no supervisor found for): ${deptName}`);
      continue; // eslint-disable-line no-continue
    }

    for (let i = 0; i < LEARNERS_PER_DEPARTMENT; i += 1) {
      const person = nextPerson();
      const backdate = scaledDate(supervisor.createdAt, OFFSET_DAYS[i], 9 + i * 2);

      const existing = await MwasalatUser.findOne({ email: person.email });
      if (existing) {
        console.log(`Skipped (already exists): ${person.email}`);
        continue; // eslint-disable-line no-continue
      }

      const doc = await MwasalatUser.create({
        name: person.name,
        email: person.email,
        password: DEMO_PASSWORD,
        role: MWASALAT_ROLES.LEARNER,
        department: dept._id,
        supervisor: supervisor._id,
        isActive: true,
        passwordSet: true,
      });

      // Mongoose marks createdAt as immutable (via the timestamps plugin), so
      // Model.updateOne() silently drops changes to it — use the raw
      // collection driver, which bypasses Mongoose schema casting.
      await MwasalatUser.collection.updateOne(
        { _id: doc._id },
        { $set: { createdAt: backdate, updatedAt: backdate, passwordChangedAt: backdate } }
      );

      roster.push({ department: deptName, name: person.name, email: person.email, createdAt: backdate.toISOString().slice(0, 10) });
      console.log(`Created: ${person.email} → ${deptName} (backdated to ${backdate.toISOString().slice(0, 10)})`);
    }
  }

  await mongoose.disconnect();

  console.log('\nInternal Learner Credentials');
  console.log('='.repeat(100));
  let lastDept = null;
  for (const l of roster) {
    if (l.department !== lastDept) {
      console.log(`\n${l.department}`);
      lastDept = l.department;
    }
    console.log(`  ${l.name.padEnd(20)} | ${l.email.padEnd(30)} | ${DEMO_PASSWORD}`);
  }
  console.log(`\n${'='.repeat(100)}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
