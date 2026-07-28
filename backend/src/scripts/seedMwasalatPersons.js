import 'dotenv/config';
import mongoose from 'mongoose';
import MwasalatUser from '../modules/mwasalatUser/mwasalatUser.model.js';
import MwasalatDepartment from '../modules/mwasalatDepartment/mwasalatDepartment.model.js';
import { MWASALAT_ROLES } from '../modules/mwasalatUser/mwasalatUser.constants.js';

// One-off seed: fills out each department with a realistic org structure on
// top of the department + department_admin already seeded (see
// seedMwasalatDepartments.js and seedMwasalatDepartmentAdmins.js) — per
// department: 1 supervisor, 1 instructor, 3 learners, 1 external_learner.
// Each learner/external_learner is linked to that department's supervisor
// (mwasalatUser.model.js `supervisor` field — used for enrollment/completion
// approvals). createdAt is staggered and scaled to how long the department
// has existed, so headcount grows organically instead of everyone joining on
// the day this script ran. Run with:
//   npm run seed:mwasalat-persons   (from backend/)

const PASSWORDS = {
  [MWASALAT_ROLES.SUPERVISOR]: 'Supervisor@1234',
  [MWASALAT_ROLES.INSTRUCTOR]: 'Instructor@1234',
  [MWASALAT_ROLES.LEARNER]: 'Learner@1234',
  [MWASALAT_ROLES.EXTERNAL_LEARNER]: 'Learner@1234',
};

// Excludes first names already used by platform/department admins so full
// names (and emails, which are derived from them) never collide.
const MALE_FIRST_NAMES = ['Hamed', 'Nasser', 'Said', 'Waleed', 'Faisal', 'Tariq', 'Adel', 'Majid', 'Saud', 'Hilal', 'Turki', 'Ali', 'Hamdan', 'Yaqoub', 'Marwan', 'Bader', 'Fahad', 'Isa', 'Jamal', 'Khalfan', 'Mansoor', 'Qasim', 'Zayed'];
const FEMALE_FIRST_NAMES = ['Amal', 'Salma', 'Reem', 'Maha', 'Muna', 'Shatha', 'Wafa', 'Asma', 'Buthaina', 'Ghalia', 'Hind', 'Rahma', 'Yasmin', 'Sara', 'Alya', 'Nadia', 'Ibtisam', 'Jamila', 'Karima', 'Lubna', 'Nawal', 'Rania', 'Suad'];
const FAMILY_NAMES = ['Al-Balushi', 'Al-Zadjali', 'Al-Harthy', 'Al-Kindi', 'Al-Rawahi', 'Al-Habsi', 'Al-Farsi', 'Al-Maskari', 'Al-Siyabi', 'Al-Busaidi', 'Al-Amri', 'Al-Lawati', 'Al-Riyami', 'Al-Mahrouqi', 'Al-Hinai', 'Al-Abri', 'Al-Saadi', 'Al-Wahaibi', 'Al-Ghafri', 'Al-Jabri', 'Al-Shukaili', 'Al-Kalbani', 'Al-Yahyai', 'Al-Hashmi', 'Al-Rashdi', 'Al-Rasbi', 'Al-Toobi', 'Al-Nabhani', 'Al-Azri', 'Al-Ghassani'];

// department_admin createdAt dates from seedMwasalatDepartmentAdmins.js —
// new hires for a department start showing up a few days after its admin.
const DEPARTMENTS = [
  { name: 'Operations', adminCreatedAt: '2026-02-10' },
  { name: 'Fleet & Maintenance', adminCreatedAt: '2026-02-11' },
  { name: 'Human Resources', adminCreatedAt: '2026-02-18' },
  { name: 'Finance', adminCreatedAt: '2026-02-25' },
  { name: 'Information Technology', adminCreatedAt: '2026-03-13' },
  { name: 'Customer Experience', adminCreatedAt: '2026-03-31' },
  { name: 'Health, Safety & Environment', adminCreatedAt: '2026-04-22' },
  { name: 'Legal & Compliance', adminCreatedAt: '2026-05-09' },
  { name: 'Marketing & Communications', adminCreatedAt: '2026-06-02' },
  { name: 'Training & Development', adminCreatedAt: '2026-06-24' },
];

// Never backdate to within a few days of "today" — keeps a visible recent gap.
const MAX_DATE = new Date('2026-07-23T00:00:00');
const MAX_OFFSET_DAYS = 130;

// Role slots created per department, in join order, with an unscaled target
// offset (days after the department admin) and a fixed hour so timestamps
// within a day don't collide.
const ROLE_SLOTS = [
  { role: MWASALAT_ROLES.SUPERVISOR, offsetDays: 6, hour: 9 },
  { role: MWASALAT_ROLES.INSTRUCTOR, offsetDays: 13, hour: 10 },
  { role: MWASALAT_ROLES.LEARNER, offsetDays: 25, hour: 11 },
  { role: MWASALAT_ROLES.LEARNER, offsetDays: 55, hour: 13 },
  { role: MWASALAT_ROLES.LEARNER, offsetDays: 90, hour: 15 },
  { role: MWASALAT_ROLES.EXTERNAL_LEARNER, offsetDays: 130, hour: 16 },
];

// Scales the whole offset schedule down for departments that haven't existed
// long enough to naturally spread 130 days of hiring before MAX_DATE — a
// department admin created a month ago still gets a full, organic-looking
// headcount ramp, just compressed into the days it's actually had.
function scaledDate(adminCreatedAt, offsetDays, hour) {
  const base = new Date(`${adminCreatedAt}T00:00:00`);
  const availableDays = Math.max(Math.floor((MAX_DATE - base) / 86400000), 10);
  const scale = Math.min(1, availableDays / MAX_OFFSET_DAYS);
  const actualOffset = Math.round(offsetDays * scale);
  const d = new Date(base);
  d.setDate(d.getDate() + actualOffset);
  d.setHours(hour, (actualOffset * 7) % 60, 0, 0);
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

  for (const dept of DEPARTMENTS) {
    const deptDoc = await MwasalatDepartment.findOne({ name: dept.name });
    if (!deptDoc) {
      console.log(`Skipped (department not found): ${dept.name}`);
      continue; // eslint-disable-line no-continue
    }

    let supervisorId = null;

    for (const slot of ROLE_SLOTS) {
      const person = nextPerson();
      const isLearner = slot.role === MWASALAT_ROLES.LEARNER || slot.role === MWASALAT_ROLES.EXTERNAL_LEARNER;
      const backdate = scaledDate(dept.adminCreatedAt, slot.offsetDays, slot.hour);

      const existing = await MwasalatUser.findOne({ email: person.email });
      if (existing) {
        console.log(`Skipped (already exists): ${person.email}`);
        if (slot.role === MWASALAT_ROLES.SUPERVISOR) supervisorId = existing._id;
        continue; // eslint-disable-line no-continue
      }

      const doc = await MwasalatUser.create({
        name: person.name,
        email: person.email,
        password: PASSWORDS[slot.role],
        role: slot.role,
        department: deptDoc._id,
        supervisor: isLearner ? supervisorId : null,
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

      if (slot.role === MWASALAT_ROLES.SUPERVISOR) supervisorId = doc._id;

      roster.push({
        department: dept.name,
        role: slot.role,
        name: person.name,
        email: person.email,
        password: PASSWORDS[slot.role],
        createdAt: backdate.toISOString().slice(0, 10),
      });
      console.log(`Created: ${person.email} → ${dept.name} (${slot.role}, backdated to ${backdate.toISOString().slice(0, 10)})`);
    }
  }

  await mongoose.disconnect();

  console.log('\nPerson Credentials');
  console.log('='.repeat(115));
  let lastDept = null;
  for (const p of roster) {
    if (p.department !== lastDept) {
      console.log(`\n${p.department}`);
      lastDept = p.department;
    }
    console.log(`  ${p.role.padEnd(18)} | ${p.name.padEnd(20)} | ${p.email.padEnd(30)} | ${p.password}`);
  }
  console.log(`\n${'='.repeat(115)}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
