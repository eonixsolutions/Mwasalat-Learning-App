import MwasalatQuiz from './mwasalatQuiz.model.js';
import MwasalatQuizAttempt from './mwasalatQuizAttempt.model.js';
import MwasalatProgram from '../mwasalatProgram/mwasalatProgram.model.js';
import MwasalatEnrollment from '../mwasalatProgram/mwasalatEnrollment.model.js';
import MwasalatCertificate from '../mwasalatProgram/mwasalatCertificate.model.js';
import MwasalatUser from '../mwasalatUser/mwasalatUser.model.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';
import { AppError } from '../../utils/AppError.js';
import { mwasalatProgramService } from '../mwasalatProgram/mwasalatProgram.service.js';
import { DEFAULT_QUIZ_QUESTIONS, MAX_QUIZ_QUESTIONS } from '../mwasalatAi/mwasalatAi.constants.js';

const POINTS_PER_PASS = 100;

const assertOwnership = async (programId, requesterId, requesterRole) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  if (requesterRole !== MWASALAT_ROLES.SUPER_ADMIN && String(program.instructor) !== String(requesterId)) {
    throw new AppError('You do not have permission to modify this course', 403);
  }
  return program;
};

const upsertQuiz = async (requesterId, requesterRole, programId, { questions, passPercentage }, moduleId = null) => {
  await assertOwnership(programId, requesterId, requesterRole);

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new AppError('At least one question is required', 400);
  }
  for (const q of questions) {
    if (!q.text?.trim() || !Array.isArray(q.options) || q.options.length < 2) {
      throw new AppError('Each question needs text and at least 2 options', 400);
    }
    if (q.correctIndex == null || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
      throw new AppError('Each question needs a valid correct answer', 400);
    }
  }

  return MwasalatQuiz.findOneAndUpdate(
    { program: programId, moduleId },
    { program: programId, moduleId, questions, passPercentage: passPercentage ?? 70 },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

// Draft-only — returns generated questions for the instructor to review/edit
// in the quiz builder, it does not save anything (saving still goes through
// the existing upsertQuiz endpoint). Dynamically imported, same reason as
// aiAutofill in mwasalatProgram.service.js: mwasalatAi's tool files import
// this service, so a static import here would create a module cycle.
const aiGenerateQuestions = async (requesterId, requesterRole, programId, numQuestions) => {
  const program = await assertOwnership(programId, requesterId, requesterRole);
  const count = Number.isInteger(numQuestions)
    ? Math.min(Math.max(numQuestions, 1), MAX_QUIZ_QUESTIONS)
    : DEFAULT_QUIZ_QUESTIONS;

  const { mwasalatAiService } = await import('../mwasalatAi/mwasalatAi.service.js');
  return mwasalatAiService.generateQuizQuestions(program.title, program.description, count);
};

const getQuizForInstructor = async (requesterId, requesterRole, programId, moduleId = null) => {
  await assertOwnership(programId, requesterId, requesterRole);
  return MwasalatQuiz.findOne({ program: programId, moduleId });
};

const getQuizForLearner = async (programId, moduleId = null) => {
  const quiz = await MwasalatQuiz.findOne({ program: programId, moduleId });
  if (!quiz) return null;
  return {
    _id: quiz._id,
    program: quiz.program,
    moduleId: quiz.moduleId,
    passPercentage: quiz.passPercentage,
    questions: quiz.questions.map((q) => ({ text: q.text, options: q.options })),
  };
};

const submitAttempt = async (learnerId, programId, answers, moduleId = null) => {
  const [enrollment, program] = await Promise.all([
    MwasalatEnrollment.findOne({ learner: learnerId, program: programId }),
    MwasalatProgram.findById(programId),
  ]);
  if (!enrollment) throw new AppError('You must be enrolled in this course to take the quiz', 403);
  mwasalatProgramService.assertHasAccess(enrollment);

  // Modular courses gate a module's quiz on that module's own content being
  // opened; legacy courses keep the whole-course contentOpenedAt gate.
  if (moduleId) {
    if (!mwasalatProgramService.isModuleContentOpened(program, enrollment, moduleId)) {
      throw new AppError('Finish this module\'s content before taking the assessment', 403);
    }
  } else if (!enrollment.contentOpenedAt) {
    throw new AppError('Finish viewing the course content before taking the assessment', 403);
  } else if (!mwasalatProgramService.isClassSessionCompleted(program)) {
    // Course-level live/ILT quiz — contentOpenedAt alone isn't enough proof the
    // session ran, since it's set the moment the learner clicks Join/checks in.
    throw new AppError('Wait for your instructor to mark the class as completed before taking this assessment', 403);
  }

  const quiz = await MwasalatQuiz.findOne({ program: programId, moduleId });
  if (!quiz) throw new AppError('This course has no quiz', 404);

  if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
    throw new AppError('Answers do not match the number of questions', 400);
  }

  let correctCount = 0;
  const review = quiz.questions.map((q, i) => {
    const isCorrect = answers[i] === q.correctIndex;
    if (isCorrect) correctCount++;
    return { text: q.text, options: q.options, correctIndex: q.correctIndex, selectedIndex: answers[i], isCorrect };
  });

  const score = Math.round((correctCount / quiz.questions.length) * 100);
  const passed = score >= quiz.passPercentage;

  await mwasalatProgramService.registerActivity(programId, enrollment);

  const alreadyPassed = await MwasalatQuizAttempt.findOne({ learner: learnerId, program: programId, moduleId, passed: true });
  const priorAttemptCount = await MwasalatQuizAttempt.countDocuments({ learner: learnerId, program: programId, moduleId });

  const attempt = await MwasalatQuizAttempt.create({ learner: learnerId, program: programId, moduleId, score, passed });

  if (passed && !alreadyPassed) {
    await MwasalatUser.findByIdAndUpdate(learnerId, { $inc: { points: POINTS_PER_PASS } });
  }

  if (moduleId && passed) {
    // A module quiz pass is also a lesson completion — this both records it
    // in moduleProgress.lessonsOpened-adjacent state and re-checks whether the
    // whole course (all modules + feedback) is now complete.
    const quizLesson = program.modules.id(moduleId)?.lessons.find((l) => l.type === 'quiz');
    if (quizLesson) await mwasalatProgramService.markLessonOpened(learnerId, programId, moduleId, quizLesson._id);
  } else if (!moduleId && passed && !alreadyPassed) {
    await mwasalatProgramService.maybeCompleteEnrollment(learnerId, programId);
  }

  // A learner who already has a certificate can retake the assessment once it's
  // close to expiring to have it reissued — no-ops for courses that auto-renew,
  // have no expiry, or aren't due for renewal yet.
  if (passed) {
    await mwasalatProgramService.reissueCertificateFromRetest(learnerId, programId);
  }

  return {
    score, passed, passPercentage: quiz.passPercentage, review,
    pointsAwarded: passed && !alreadyPassed ? POINTS_PER_PASS : 0,
    attemptNumber: priorAttemptCount + 1,
    attemptedAt: attempt.attemptedAt,
  };
};

const getMyBestAttempt = async (learnerId, programId, moduleId = null) => {
  return MwasalatQuizAttempt.findOne({ learner: learnerId, program: programId, moduleId }).sort({ score: -1 });
};

// Platform-wide quiz performance for the admin Quiz Results page: per-program
// aggregates (avg score / pass rate / attempt count) plus a flat, most-recent-first
// attempt list for the detail table.
const getAdminResults = async () => {
  const now = new Date();
  const last30Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const prev30Start = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    attempts, totalQuizzes, totalAttempts, passedAttempts,
    attemptsLast30Days, attemptsPrevious30Days, totalCertificates,
  ] = await Promise.all([
    MwasalatQuizAttempt.find({})
      .populate('learner', 'name email')
      .populate('program', 'title category titleAr categoryAr')
      .sort({ attemptedAt: -1 })
      .limit(200),
    MwasalatQuiz.countDocuments({}),
    MwasalatQuizAttempt.countDocuments({}),
    MwasalatQuizAttempt.countDocuments({ passed: true }),
    MwasalatQuizAttempt.countDocuments({ attemptedAt: { $gte: last30Start } }),
    MwasalatQuizAttempt.countDocuments({ attemptedAt: { $gte: prev30Start, $lt: last30Start } }),
    MwasalatCertificate.countDocuments({}),
  ]);

  const byProgram = {};
  attempts.forEach((a) => {
    const key = a.program?._id?.toString();
    if (!key) return;
    if (!byProgram[key]) byProgram[key] = { program: a.program, scores: [], passed: 0, attempts: 0 };
    byProgram[key].scores.push(a.score);
    byProgram[key].attempts += 1;
    if (a.passed) byProgram[key].passed += 1;
  });

  const programResults = Object.values(byProgram).map(({ program, scores, passed, attempts: count }) => ({
    program,
    attempts: count,
    avgScore: Math.round(scores.reduce((sum, s) => sum + s, 0) / count),
    passRate: Math.round((passed / count) * 100),
  })).sort((a, b) => b.attempts - a.attempts);

  return {
    programResults,
    attempts: attempts.map((a) => ({
      _id: a._id,
      learner: a.learner,
      program: a.program,
      score: a.score,
      passed: a.passed,
      attemptedAt: a.attemptedAt,
    })),
    // Real, unrestricted-by-the-200-row-cap counts — the Quiz Results page's
    // summary banner needs true totals, not just what's in the displayed page.
    totalQuizzes,
    totalAttempts,
    passedAttempts,
    attemptsLast30Days,
    attemptsPrevious30Days,
    totalCertificates,
  };
};

export const mwasalatQuizService = {
  upsertQuiz, aiGenerateQuestions, getQuizForInstructor, getQuizForLearner, submitAttempt, getMyBestAttempt, getAdminResults,
};
