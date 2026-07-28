import 'dotenv/config';
import mongoose from 'mongoose';
import MwasalatProgram from '../modules/mwasalatProgram/mwasalatProgram.model.js';
import MwasalatUser from '../modules/mwasalatUser/mwasalatUser.model.js';
import MwasalatEnrollment from '../modules/mwasalatProgram/mwasalatEnrollment.model.js';
import MwasalatQuiz from '../modules/mwasalatQuiz/mwasalatQuiz.model.js';
import MwasalatQuizAttempt from '../modules/mwasalatQuiz/mwasalatQuizAttempt.model.js';
import MwasalatAssignmentSubmission from '../modules/mwasalatAssignment/mwasalatAssignmentSubmission.model.js';
import MwasalatFeedback from '../modules/mwasalatProgram/mwasalatFeedback.model.js';
import MwasalatCertificate from '../modules/mwasalatProgram/mwasalatCertificate.model.js';
import { mwasalatProgramService } from '../modules/mwasalatProgram/mwasalatProgram.service.js';
import { mwasalatQuizService } from '../modules/mwasalatQuiz/mwasalatQuiz.service.js';
import { mwasalatAssignmentService } from '../modules/mwasalatAssignment/mwasalatAssignment.service.js';
import { MWASALAT_ROLES } from '../modules/mwasalatUser/mwasalatUser.constants.js';
import { ENROLLMENT_STATUS, LESSON_TYPES } from '../modules/mwasalatProgram/mwasalatProgram.constants.js';

// Stage 3 of 3 (see plan: seed learner activity — enrollments, purchases,
// quiz passes, certificates). Drives roughly half of the enrollments from
// stages 1-2 to full completion using the REAL, already-exported service
// functions (markContentOpened/markLessonOpened, submitAttempt,
// gradeSubmission, completeClass, submitFeedback -> maybeCompleteEnrollment)
// so every gating rule (module unlock, live/ilt class-completed gate,
// certificate requiring feedback) is computed exactly as the live app
// would. The other half is left at whatever earlier stage stage 1/2 left it
// (just enrolled, or pending_approval) for realistic variety.
//
// Two accounts the user created by hand while testing (not part of any seed
// script) are deliberately excluded — this script only touches its own
// seeded roster.
//
// Every real call stamps "now" — backdated afterward via the raw collection
// driver per document (createdAt is immutable under Mongoose's timestamps
// plugin). Each step is staggered a few days after the enrollment's own
// (already-backdated) purchasedAt, capped before today.
// Run with:
//   npm run seed:mwasalat-engagement   (from backend/)

const EXCLUDED_EMAILS = ['gopikadeepakcse@gmail.com', 'gopikanath45@gmail.com'];
const MAX_DATE = new Date('2026-07-26T00:00:00');

function stepDate(purchasedAt, offsetDays, seed) {
  const base = new Date(purchasedAt);
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(9 + (seed % 8), (seed * 11) % 60, 0, 0);
  if (d < base) return new Date(base.getTime() + 60 * 60 * 1000);
  return d > MAX_DATE ? MAX_DATE : d;
}

async function backdate(Model, filter, fields, date) {
  await Model.collection.updateOne(filter, { $set: Object.fromEntries(fields.map((f) => [f, date])) });
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const superAdmin = await MwasalatUser.findOne({ role: MWASALAT_ROLES.SUPER_ADMIN });
  if (!superAdmin) throw new Error('No super_admin account found');

  // Reused as the "submitted file" for every assignment submission — same
  // asset-reuse convention as the program catalog, avoids a real upload.
  const pdfSource = await MwasalatProgram.findOne({ pdfUrl: { $exists: true, $ne: null } }, 'pdfUrl documents');
  const assignmentFile = {
    fileUrl: pdfSource?.pdfUrl ?? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'assignment-submission.pdf',
    filePublicId: pdfSource?.documents?.[0]?.publicId,
  };

  const excludedLearners = await MwasalatUser.find({ email: { $in: EXCLUDED_EMAILS } }, '_id');
  const excludedIds = new Set(excludedLearners.map((l) => String(l._id)));

  const programs = await MwasalatProgram.find({});
  const enrollments = await MwasalatEnrollment.find({
    status: { $in: [ENROLLMENT_STATUS.ENROLLED, ENROLLMENT_STATUS.IN_PROGRESS, ENROLLMENT_STATUS.PENDING_APPROVAL] },
  }).sort({ _id: 1 });

  const byProgram = new Map();
  for (const e of enrollments) {
    if (excludedIds.has(String(e.learner))) continue; // eslint-disable-line no-continue
    const key = String(e.program);
    if (!byProgram.has(key)) byProgram.set(key, []);
    byProgram.get(key).push(e);
  }

  const toComplete = [];
  for (const [, list] of byProgram) {
    list.forEach((e, i) => { if (i % 2 === 0) toComplete.push(e); }); // deterministic ~half
  }
  console.log(`Driving ${toComplete.length} of ${enrollments.length} eligible enrollments to full completion`);

  const classCompletedPrograms = new Set(); // program-level live/ilt completeClass, once per program
  let failFirstBudget = 3; // a few realistic wrong-then-right quiz attempts
  const results = { completed: 0, certificates: 0, quizAttempts: 0, assignments: 0, errors: 0 };

  for (const enrollment of toComplete) {
    if (enrollment.status === ENROLLMENT_STATUS.COMPLETED) continue; // eslint-disable-line no-continue
    const program = programs.find((p) => String(p._id) === String(enrollment.program));
    const learner = await MwasalatUser.findById(enrollment.learner);
    if (!program || !learner) continue; // eslint-disable-line no-continue

    const learnerRole = learner.role;
    const purchasedAt = enrollment.purchasedAt;

    try {
      // Approve if it landed pending_approval — can't do anything else until then.
      if (enrollment.status === ENROLLMENT_STATUS.PENDING_APPROVAL) {
        await mwasalatProgramService.approveEnrollment(superAdmin._id, MWASALAT_ROLES.SUPER_ADMIN, program._id, learner._id);
        await backdate(MwasalatEnrollment, { _id: enrollment._id }, ['approvedAt'], stepDate(purchasedAt, 1, 1));
      }

      // Live/ILT: the instructor marks the session complete once, program-wide —
      // gates the quiz for every learner on this course, not just this one.
      // Checked against real DB state (not just the in-memory Set) so a
      // re-run after a partial failure never re-fires this and resets the
      // backdated class-completed date.
      if (program.contentTypes.includes('live') || program.contentTypes.includes('ilt')) {
        const contentType = program.contentTypes.includes('live') ? 'live' : 'ilt';
        const field = contentType === 'live' ? 'liveClassCompletedAt' : 'iltClassCompletedAt';
        if (!classCompletedPrograms.has(String(program._id))) {
          const current = await MwasalatProgram.findById(program._id, field);
          if (!current[field]) {
            await mwasalatProgramService.completeClass(superAdmin._id, MWASALAT_ROLES.SUPER_ADMIN, program._id, contentType, superAdmin);
            const classDate = stepDate(purchasedAt, 2, 2);
            await backdate(MwasalatProgram, { _id: program._id }, [field], classDate);
          }
          classCompletedPrograms.add(String(program._id));
        }
      }

      let stepOffset = 3;
      const touchedDates = [];

      if (program.contentTypes.includes('modular')) {
        const sortedModules = [...program.modules].sort((a, b) => a.order - b.order);
        for (const mod of sortedModules) {
          const sortedLessons = [...mod.lessons].sort((a, b) => a.order - b.order);
          for (const lesson of sortedLessons) {
            if (lesson.type === LESSON_TYPES.QUIZ) {
              const quiz = await MwasalatQuiz.findOne({ program: program._id, moduleId: mod._id });
              if (!quiz) continue; // eslint-disable-line no-continue

              // Re-run safety: unlimited retakes are allowed by design, so a
              // second submitAttempt call would create a genuine extra
              // passing attempt — skip if this learner already has one for
              // this module instead of piling up duplicates on a re-run.
              const alreadyPassed = await MwasalatQuizAttempt.findOne({ learner: learner._id, program: program._id, moduleId: mod._id, passed: true });
              if (alreadyPassed) { stepOffset += 1; continue; } // eslint-disable-line no-continue

              const correctAnswers = quiz.questions.map((q) => q.correctIndex);

              if (failFirstBudget > 0) {
                const wrongAnswers = quiz.questions.map((q) => (q.correctIndex + 1) % q.options.length);
                await mwasalatQuizService.submitAttempt(learner._id, program._id, wrongAnswers, mod._id);
                const failDate = stepDate(purchasedAt, stepOffset, stepOffset);
                await backdate(MwasalatQuizAttempt, { learner: learner._id, program: program._id, moduleId: mod._id, passed: false }, ['attemptedAt', 'createdAt', 'updatedAt'], failDate);
                results.quizAttempts += 1;
                failFirstBudget -= 1;
                stepOffset += 1;
              }

              await mwasalatQuizService.submitAttempt(learner._id, program._id, correctAnswers, mod._id);
              const passDate = stepDate(purchasedAt, stepOffset, stepOffset);
              await backdate(MwasalatQuizAttempt, { learner: learner._id, program: program._id, moduleId: mod._id, passed: true }, ['attemptedAt', 'createdAt', 'updatedAt'], passDate);
              results.quizAttempts += 1;
              touchedDates.push(passDate);
            } else if (lesson.type === LESSON_TYPES.ASSIGNMENT) {
              // Same re-run safety as the quiz branch above.
              const alreadyPassed = await MwasalatAssignmentSubmission.findOne({ learner: learner._id, program: program._id, moduleId: mod._id, lessonId: lesson._id, passed: true });
              if (alreadyPassed) { stepOffset += 1; continue; } // eslint-disable-line no-continue

              const submission = await MwasalatAssignmentSubmission.create({
                learner: learner._id, program: program._id, moduleId: mod._id, lessonId: lesson._id, ...assignmentFile,
              });
              const gradeDate = stepDate(purchasedAt, stepOffset, stepOffset);
              await backdate(MwasalatAssignmentSubmission, { _id: submission._id }, ['submittedAt', 'createdAt'], gradeDate);
              try {
                // gradeSubmission's own trailing notifyUsers() call isn't
                // wrapped in a .catch() (unlike completeClass's equivalent),
                // so it throws synchronously here when Socket.io isn't
                // initialized (this script runs standalone, no HTTP server).
                // The grading itself (submission.save(), points, cascading
                // markLessonOpened/maybeCompleteEnrollment) already happened
                // by the time that throw fires, so isolate it rather than
                // losing the rest of this enrollment's progress to it.
                await mwasalatAssignmentService.gradeSubmission(superAdmin._id, MWASALAT_ROLES.SUPER_ADMIN, submission._id, { score: 90, passed: true, feedback: 'Well done — clear and complete.' });
              } catch (notifyErr) {
                console.log(`    (non-fatal: gradeSubmission notification failed — grading itself still applied: ${notifyErr.message})`);
              }
              await backdate(MwasalatAssignmentSubmission, { _id: submission._id }, ['gradedAt', 'updatedAt'], gradeDate);
              results.assignments += 1;
              touchedDates.push(gradeDate);
            } else {
              await mwasalatProgramService.markLessonOpened(learner._id, program._id, mod._id, lesson._id);
            }
            stepOffset += 1;
          }
        }
      } else {
        for (const contentType of program.contentTypes) {
          await mwasalatProgramService.markContentOpened(learner._id, program._id, contentType);
        }
        touchedDates.push(stepDate(purchasedAt, stepOffset, stepOffset));
      }

      const feedbackDate = stepDate(purchasedAt, stepOffset + 2, stepOffset + 2);
      await mwasalatProgramService.submitFeedback(learner._id, program._id, {
        courseRating: 4 + (stepOffset % 2), instructorRating: 4 + ((stepOffset + 1) % 2), trainerClear: true,
        comment: 'Practical and easy to follow — learned exactly what I needed for my role.',
      });
      await backdate(MwasalatFeedback, { learner: learner._id, program: program._id }, ['createdAt', 'updatedAt'], feedbackDate);

      await backdate(
        MwasalatEnrollment, { _id: enrollment._id },
        ['contentOpenedAt', 'completedAt', 'lastActivityAt', 'updatedAt'],
        feedbackDate
      );
      await MwasalatEnrollment.collection.updateOne({ _id: enrollment._id }, { $set: { lastActiveDate: feedbackDate.toISOString().slice(0, 10), currentStreak: 1, longestStreak: Math.max(1, (touchedDates.length || 1)) } });

      const certificate = await MwasalatCertificate.findOne({ learner: learner._id, program: program._id });
      if (certificate) {
        await backdate(MwasalatCertificate, { _id: certificate._id }, ['issuedAt', 'createdAt', 'updatedAt'], feedbackDate);
        results.certificates += 1;
      }

      results.completed += 1;
      console.log(`Completed: ${learner.name} -> ${program.title} (${feedbackDate.toISOString().slice(0, 10)})${certificate ? ' [certificate]' : ''}`);
    } catch (err) {
      results.errors += 1;
      console.log(`  ERROR: ${learner.name} -> ${program.title}: ${err.message}`);
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
