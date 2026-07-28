import 'dotenv/config';
import mongoose from 'mongoose';
import MwasalatProgram from '../modules/mwasalatProgram/mwasalatProgram.model.js';
import MwasalatUser from '../modules/mwasalatUser/mwasalatUser.model.js';
import MwasalatEnrollment from '../modules/mwasalatProgram/mwasalatEnrollment.model.js';
import { mwasalatProgramService } from '../modules/mwasalatProgram/mwasalatProgram.service.js';
import { MWASALAT_ROLES } from '../modules/mwasalatUser/mwasalatUser.constants.js';

// Stage 1 of 3 (see plan: seed learner activity — enrollments, purchases,
// quiz passes, certificates). Uses the REAL, already-exported service
// functions (enroll, syncMandatoryEnrollmentsForLearners) so every gating
// rule (audience/department access, capacity/waitlist, requiresApproval,
// mandatory auto-targeting) is computed exactly as the live app would —
// nothing here is hand-faked.
//
// Only the LEARNER/EXTERNAL_LEARNER roles can ever hold an enrollment (see
// the authorize(...MWASALAT_LEARNER_ROLES) guard on POST /:id/enroll) — even
// for course titles like "... for Supervisors", the actual enrollee must be
// role 'learner', never role 'supervisor'.
//
// Every enroll() call stamps purchasedAt/createdAt as "now" — this script
// backdates each resulting enrollment afterward via the raw collection
// driver (createdAt is immutable under Mongoose's timestamps plugin, so
// Model.updateOne() silently drops changes to it — same fix used everywhere
// else this session).
// Run with:
//   npm run seed:mwasalat-enrollments   (from backend/)

const TODAY = new Date('2026-07-27T00:00:00');
const MAX_DATE = new Date('2026-07-25T00:00:00'); // never backdate to within 2 days of "today"

function enrollDate(learnerCreatedAt, programCreatedAt, offsetDays) {
  const base = new Date(Math.max(new Date(learnerCreatedAt).getTime(), new Date(programCreatedAt).getTime()));
  const target = new Date(base);
  target.setDate(target.getDate() + offsetDays);
  target.setHours(9 + (offsetDays % 6), (offsetDays * 13) % 60, 0, 0);
  if (target <= MAX_DATE) return target;

  // The normal offset would land past our "keep a gap before today" cutoff —
  // but never return a date before `base` (would place the enrollment
  // before the learner's own account, or the program, even existed). Land
  // shortly after base instead; for a genuinely-just-created account this
  // correctly stays recent rather than fabricating an impossible past.
  const shortlyAfterBase = new Date(base.getTime() + 3 * 60 * 60 * 1000);
  return shortlyAfterBase < MAX_DATE ? MAX_DATE : shortlyAfterBase;
}

async function backdateEnrollment(enrollmentId, date) {
  await MwasalatEnrollment.collection.updateOne(
    { _id: enrollmentId },
    { $set: { purchasedAt: date, createdAt: date, updatedAt: date, lastActivityAt: date, lastActiveDate: date.toISOString().slice(0, 10) } }
  );
}

// The 7 courses seeded with isMandatory: true — auto-synced via the real
// business rule (mwasalatProgram.service.js#syncMandatoryEnrollmentsForProgram),
// not hand-picked learners.
const MANDATORY_TITLES = [
  'Defensive Driving & Road Safety Fundamentals',
  'Fire Safety & Evacuation Procedures',
  'Vehicle Inspection & Pre-Trip Checks',
  'First Aid & Emergency Response Basics',
  'Anti-Corruption & Code of Conduct',
  'Data Protection & Confidentiality Essentials',
  'New Employee Induction & Onboarding Journey',
];

// Non-mandatory internal_only courses — 2 representative learners each.
// { title, department: dept name to pull learners from, or null for
// company-wide electives (pulls from a rotating spread of departments) }
const ELECTIVE_INTERNAL_TITLES = [
  { title: 'Time Management for Supervisors', department: null },
  { title: 'Vehicle Mechanical Systems Fundamentals', department: 'Fleet & Maintenance' },
  { title: 'MS Office & Digital Literacy Essentials', department: 'Information Technology' },
  { title: 'Public Transport Operator Licensing Renewal', department: 'Operations' },
  { title: 'Workshop Safety Procedures', department: 'Fleet & Maintenance' },
  { title: 'Supervisory & Team Leadership Skills', department: null },
  { title: 'Cybersecurity Awareness Fundamentals', department: 'Information Technology' },
  { title: 'HR Policies & Procedures Refresher', department: 'Human Resources' },
  { title: 'CPD Tracked Professional Development', department: null },
  { title: 'Business Continuity Planning Workshop', department: null },
];

// Free (price 0), audience 'all' courses — 3 external learners each, direct
// enroll() (no payment needed since price is 0).
const FREE_ALL_AUDIENCE_TITLES = [
  'Emergency Evacuation Drill Briefing',
  'Road Safety Awareness — Public Webinar',
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const allDepartments = await mongoose.connection.db.collection('mwasalatdepartments').find({}).sort({ name: 1 }).toArray();
  const allInternalLearners = await MwasalatUser.find({ role: MWASALAT_ROLES.LEARNER, isActive: true }).sort({ name: 1 });
  const allExternalLearners = await MwasalatUser.find({ role: MWASALAT_ROLES.EXTERNAL_LEARNER, isActive: true }).sort({ name: 1 });

  const results = { mandatory: 0, elective: 0, free: 0, skipped: 0 };

  // ── 1. Mandatory courses: real auto-sync (per department), then backdate
  // whatever it created. syncMandatoryEnrollmentsForProgram is internal-only
  // (called from create()/update()) — syncMandatoryEnrollmentsForLearners is
  // the exported, learner-side equivalent used for exactly this "backfill
  // existing learners against existing mandatory courses" case.
  console.log('\n--- Mandatory courses (auto-sync by department) ---');
  const mandatoryPrograms = await MwasalatProgram.find({ title: { $in: MANDATORY_TITLES } }, '_id');
  const mandatoryProgramIds = mandatoryPrograms.map((p) => p._id);

  for (const dept of allDepartments) {
    const deptLearners = allInternalLearners.filter((l) => String(l.department) === String(dept._id));
    if (!deptLearners.length) continue; // eslint-disable-line no-continue

    const before = await MwasalatEnrollment.find({ program: { $in: mandatoryProgramIds } }, '_id');
    const beforeIds = new Set(before.map((e) => String(e._id)));

    await mwasalatProgramService.syncMandatoryEnrollmentsForLearners(
      deptLearners.map((l) => l._id),
      { departmentId: dept._id }
    );

    const after = await MwasalatEnrollment.find({ program: { $in: mandatoryProgramIds } })
      .populate('learner', 'name createdAt')
      .populate('program', 'createdAt title');
    const newlyCreated = after.filter((e) => !beforeIds.has(String(e._id)));

    let i = 0;
    for (const enrollment of newlyCreated) {
      const date = enrollDate(enrollment.learner.createdAt, enrollment.program.createdAt, 5 + i * 3);
      await backdateEnrollment(enrollment._id, date);
      i += 1;
      results.mandatory += 1;
    }
    console.log(`${dept.name}: ${newlyCreated.length} mandatory enrollment(s) for ${deptLearners.length} learner(s)`);
  }

  // ── 2. Elective internal courses: 2 representative learners each ──
  console.log('\n--- Elective internal courses ---');
  let rotatingDeptIndex = 0;
  for (const { title, department } of ELECTIVE_INTERNAL_TITLES) {
    const program = await MwasalatProgram.findOne({ title });
    if (!program) { console.log(`Skipped (program not found): ${title}`); continue; } // eslint-disable-line no-continue

    let candidates;
    if (department) {
      const dept = allDepartments.find((d) => d.name === department);
      candidates = allInternalLearners.filter((l) => String(l.department) === String(dept?._id)).slice(0, 2);
    } else {
      // Company-wide elective — spread across two different departments
      // rather than clustering in one, rotating which departments each time.
      const deptA = allDepartments[rotatingDeptIndex % allDepartments.length];
      const deptB = allDepartments[(rotatingDeptIndex + 1) % allDepartments.length];
      rotatingDeptIndex += 2;
      candidates = [
        allInternalLearners.find((l) => String(l.department) === String(deptA._id)),
        allInternalLearners.find((l) => String(l.department) === String(deptB._id)),
      ].filter(Boolean);
    }

    let i = 0;
    for (const learner of candidates) {
      const existing = await MwasalatEnrollment.findOne({ learner: learner._id, program: program._id });
      if (existing) { results.skipped += 1; continue; } // eslint-disable-line no-continue
      try {
        const enrollment = await mwasalatProgramService.enroll(learner._id, MWASALAT_ROLES.LEARNER, program._id, learner.department);
        const date = enrollDate(learner.createdAt, program.createdAt, 8 + i * 4);
        await backdateEnrollment(enrollment._id, date);
        results.elective += 1;
        i += 1;
      } catch (err) {
        console.log(`  Could not enroll ${learner.name} in "${title}": ${err.message}`);
      }
    }
    console.log(`${title}: ${candidates.length} learner(s) targeted`);
  }

  // ── 3. Free 'all'-audience courses: 3 external learners each ──
  console.log('\n--- Free external-visible courses ---');
  for (const title of FREE_ALL_AUDIENCE_TITLES) {
    const program = await MwasalatProgram.findOne({ title });
    if (!program) { console.log(`Skipped (program not found): ${title}`); continue; } // eslint-disable-line no-continue

    const candidates = allExternalLearners.slice(0, 3);
    let i = 0;
    for (const learner of candidates) {
      const existing = await MwasalatEnrollment.findOne({ learner: learner._id, program: program._id });
      if (existing) { results.skipped += 1; continue; } // eslint-disable-line no-continue
      try {
        const enrollment = await mwasalatProgramService.enroll(learner._id, MWASALAT_ROLES.EXTERNAL_LEARNER, program._id, null);
        const date = enrollDate(learner.createdAt, program.createdAt, 6 + i * 3);
        await backdateEnrollment(enrollment._id, date);
        results.free += 1;
        i += 1;
      } catch (err) {
        console.log(`  Could not enroll ${learner.name} in "${title}": ${err.message}`);
      }
    }
    console.log(`${title}: ${candidates.length} external learner(s) enrolled`);
  }

  // ── Safety net: catch any enrollment this script touched that still shows
  // a today-ish createdAt — e.g. autoEnrollMandatoryLearners' insertMany can
  // outrun an immediate re-query on some connections, which left a handful
  // un-backdated on the first run of this script. Re-checking actual DB
  // state (rather than trusting the before/after diff alone) catches that
  // regardless of the exact cause.
  const allTouchedProgramIds = [
    ...mandatoryProgramIds,
    ...(await MwasalatProgram.find({ title: { $in: [...ELECTIVE_INTERNAL_TITLES.map((e) => e.title), ...FREE_ALL_AUDIENCE_TITLES] } }, '_id')).map((p) => p._id),
  ];
  const stragglers = await MwasalatEnrollment.find({
    program: { $in: allTouchedProgramIds },
    createdAt: { $gte: new Date('2026-07-27T00:00:00') },
  }).populate('learner', 'name createdAt').populate('program', 'createdAt title');

  if (stragglers.length) {
    console.log(`\n--- Safety net: backdating ${stragglers.length} straggler(s) missed above ---`);
    let i = 0;
    for (const enrollment of stragglers) {
      const date = enrollDate(enrollment.learner.createdAt, enrollment.program.createdAt, 5 + i * 3);
      await backdateEnrollment(enrollment._id, date);
      console.log(`  Fixed: ${enrollment.learner.name} -> ${enrollment.program.title} -> ${date.toISOString().slice(0, 10)}`);
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
