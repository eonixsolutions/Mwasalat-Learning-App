import MwasalatQuiz from './mwasalatQuiz.model.js';
import MwasalatQuizAttempt from './mwasalatQuizAttempt.model.js';
import MwasalatProgram from '../mwasalatProgram/mwasalatProgram.model.js';
import MwasalatEnrollment from '../mwasalatProgram/mwasalatEnrollment.model.js';
import MwasalatUser from '../mwasalatUser/mwasalatUser.model.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';
import { AppError } from '../../utils/AppError.js';
import { mwasalatProgramService } from '../mwasalatProgram/mwasalatProgram.service.js';

const POINTS_PER_PASS = 100;

const assertOwnership = async (programId, requesterId, requesterRole) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  if (requesterRole !== MWASALAT_ROLES.SUPER_ADMIN && String(program.instructor) !== String(requesterId)) {
    throw new AppError('You do not have permission to modify this course', 403);
  }
  return program;
};

const upsertQuiz = async (requesterId, requesterRole, programId, { questions, passPercentage }) => {
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
    { program: programId },
    { program: programId, questions, passPercentage: passPercentage ?? 70 },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const getQuizForInstructor = async (requesterId, requesterRole, programId) => {
  await assertOwnership(programId, requesterId, requesterRole);
  return MwasalatQuiz.findOne({ program: programId });
};

const getQuizForLearner = async (programId) => {
  const quiz = await MwasalatQuiz.findOne({ program: programId });
  if (!quiz) return null;
  return {
    _id: quiz._id,
    program: quiz.program,
    passPercentage: quiz.passPercentage,
    questions: quiz.questions.map((q) => ({ text: q.text, options: q.options })),
  };
};

const submitAttempt = async (learnerId, programId, answers) => {
  const enrollment = await MwasalatEnrollment.findOne({ learner: learnerId, program: programId });
  if (!enrollment) throw new AppError('You must be enrolled in this course to take the quiz', 403);
  if (!enrollment.contentOpenedAt) {
    throw new AppError('Finish viewing the course content before taking the assessment', 403);
  }

  const quiz = await MwasalatQuiz.findOne({ program: programId });
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

  const alreadyPassed = await MwasalatQuizAttempt.findOne({ learner: learnerId, program: programId, passed: true });
  const priorAttemptCount = await MwasalatQuizAttempt.countDocuments({ learner: learnerId, program: programId });

  const attempt = await MwasalatQuizAttempt.create({ learner: learnerId, program: programId, score, passed });

  if (passed && !alreadyPassed) {
    await MwasalatUser.findByIdAndUpdate(learnerId, { $inc: { points: POINTS_PER_PASS } });
    await mwasalatProgramService.maybeCompleteEnrollment(learnerId, programId);
  }

  return {
    score, passed, passPercentage: quiz.passPercentage, review,
    pointsAwarded: passed && !alreadyPassed ? POINTS_PER_PASS : 0,
    attemptNumber: priorAttemptCount + 1,
    attemptedAt: attempt.attemptedAt,
  };
};

const getMyBestAttempt = async (learnerId, programId) => {
  return MwasalatQuizAttempt.findOne({ learner: learnerId, program: programId }).sort({ score: -1 });
};

// Platform-wide quiz performance for the admin Quiz Results page: per-program
// aggregates (avg score / pass rate / attempt count) plus a flat, most-recent-first
// attempt list for the detail table.
const getAdminResults = async () => {
  const attempts = await MwasalatQuizAttempt.find({})
    .populate('learner', 'name email')
    .populate('program', 'title category')
    .sort({ attemptedAt: -1 })
    .limit(200);

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
  };
};

export const mwasalatQuizService = {
  upsertQuiz, getQuizForInstructor, getQuizForLearner, submitAttempt, getMyBestAttempt, getAdminResults,
};
