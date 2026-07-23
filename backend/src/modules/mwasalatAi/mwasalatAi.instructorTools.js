import { Type } from '@google/genai';
import { mwasalatProgramService } from '../mwasalatProgram/mwasalatProgram.service.js';
import { mwasalatQuizService } from '../mwasalatQuiz/mwasalatQuiz.service.js';
import MwasalatProgram from '../mwasalatProgram/mwasalatProgram.model.js';
import { AppError } from '../../utils/AppError.js';
import { MAX_LIST_RESULTS } from './mwasalatAi.constants.js';
import { RENDER_TOOL_DECLARATIONS } from './mwasalatAi.renderTools.js';

// Every tool here is scoped to the requesting instructor's own programs —
// instructorId always comes from the authenticated actor, never from a
// model-supplied argument, so an instructor's assistant structurally cannot
// be tricked into returning another instructor's data. Program-scoped tools
// (attendance/feedback/quiz results) additionally verify ownership before
// returning anything.

const assertOwnsProgram = async (instructorId, programId) => {
  const program = await MwasalatProgram.findById(programId, 'instructor title');
  if (!program) throw new AppError('Program not found', 404);
  if (String(program.instructor) !== String(instructorId)) {
    throw new AppError('This is not one of your programs', 403);
  }
  return program;
};

export const buildInstructorToolExecutors = (actor) => {
  const instructorId = actor._id;

  const getMyProgramsSummary = async () => {
    const detail = await mwasalatProgramService.getInstructorDetail(instructorId);
    return {
      totalPrograms: detail.totalPrograms,
      totalLearners: detail.totalLearners,
      avgRating: detail.avgRating,
      certificatesIssued: detail.certificatesIssued,
      programs: detail.programs.map((p) => ({
        programId: p._id,
        title: p.title,
        category: p.category,
        status: p.status,
        price: p.price,
        enrolledCount: p.enrolledCount,
        avgRating: p.avgRating,
        feedbackCount: p.feedbackCount,
      })),
    };
  };

  const getMyRosterOverview = async () => {
    const { allStudents, needsAttention } = await mwasalatProgramService.getMyRoster(instructorId);
    return {
      totalStudents: allStudents.length,
      needsAttentionCount: needsAttention.length,
      needsAttention: needsAttention.slice(0, MAX_LIST_RESULTS).map((s) => ({
        learner: s.learner?.name ?? 'Unknown',
        program: s.program?.title ?? 'Unknown',
        status: s.status,
        progress: s.progress,
        riskLevel: s.riskLevel,
        daysSinceActivity: s.daysSinceActivity,
        returned: s.returned,
      })),
    };
  };

  const findMyStudent = async ({ query } = {}) => {
    if (!query?.trim()) throw new AppError('query is required', 400);
    const needle = query.trim().toLowerCase();
    const { allStudents } = await mwasalatProgramService.getMyRoster(instructorId);
    const matches = allStudents.filter(
      (s) => s.learner?.name?.toLowerCase().includes(needle) || s.learner?.email?.toLowerCase().includes(needle)
    );
    const deduped = [...new Map(matches.map((s) => [String(s.learner?._id), s.learner])).values()];
    return { matches: deduped.slice(0, 5).map((l) => ({ learnerId: l?._id, name: l?.name, email: l?.email })) };
  };

  const getMyStudentDetail = async ({ learnerId } = {}) => {
    if (!learnerId) throw new AppError('learnerId is required', 400);
    const { allStudents } = await mwasalatProgramService.getMyRoster(instructorId);
    const records = allStudents.filter((s) => String(s.learner?._id) === String(learnerId));
    if (!records.length) throw new AppError('This learner is not enrolled in any of your programs', 404);

    return {
      learner: { name: records[0].learner?.name, email: records[0].learner?.email },
      enrollments: records.map((s) => ({
        program: s.program?.title,
        status: s.status,
        progress: s.progress,
        riskLevel: s.riskLevel,
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
        daysSinceActivity: s.daysSinceActivity,
        purchasedAt: s.purchasedAt,
        completedAt: s.completedAt,
      })),
    };
  };

  const getMyProgramAttendance = async ({ programId } = {}) => {
    if (!programId) throw new AppError('programId is required', 400);
    await assertOwnsProgram(instructorId, programId);
    const records = await mwasalatProgramService.getAttendance(programId);
    const capped = records.slice(0, MAX_LIST_RESULTS);
    return {
      total: records.length,
      returned: capped.length,
      records: capped.map((r) => ({ learner: r.learner?.name ?? 'Unknown', checkedInAt: r.checkedInAt })),
    };
  };

  const getMyProgramFeedback = async ({ programId } = {}) => {
    if (!programId) throw new AppError('programId is required', 400);
    await assertOwnsProgram(instructorId, programId);
    const feedback = await mwasalatProgramService.getFeedback(programId);
    const capped = feedback.slice(0, MAX_LIST_RESULTS);
    return {
      total: feedback.length,
      returned: capped.length,
      feedback: capped.map((f) => ({
        learner: f.learner?.name ?? 'Unknown', courseRating: f.courseRating, instructorRating: f.instructorRating, comment: f.comment,
      })),
    };
  };

  const getMyProgramQuizResults = async ({ programId } = {}) => {
    if (!programId) throw new AppError('programId is required', 400);
    await assertOwnsProgram(instructorId, programId);
    const { programResults, attempts } = await mwasalatQuizService.getAdminResults();
    const result = programResults.find((r) => String(r.program?._id) === String(programId));
    const filteredAttempts = attempts.filter((a) => String(a.program?._id) === String(programId)).slice(0, MAX_LIST_RESULTS);
    return {
      attempts: result?.attempts ?? 0,
      avgScore: result?.avgScore ?? null,
      passRate: result?.passRate ?? null,
      recentAttempts: filteredAttempts.map((a) => ({ learner: a.learner?.name, score: a.score, passed: a.passed, attemptedAt: a.attemptedAt })),
    };
  };

  return {
    getMyProgramsSummary,
    getMyRosterOverview,
    findMyStudent,
    getMyStudentDetail,
    getMyProgramAttendance,
    getMyProgramFeedback,
    getMyProgramQuizResults,
  };
};

const INSTRUCTOR_DATA_TOOL_DECLARATIONS = [
  {
    name: 'getMyProgramsSummary',
    description: "Overview of the instructor's own courses: total programs, total learners, average rating, certificates issued, and a list of every program with enrollment/rating stats.",
  },
  {
    name: 'getMyRosterOverview',
    description: "Count of the instructor's total students and a list of students needing attention across all their programs (at-risk, inactive, churned, or recently returned).",
  },
  {
    name: 'findMyStudent',
    description: "Search for one of the instructor's own students by name or email fragment. Call this first when a question names a specific student, then pass the returned learnerId to getMyStudentDetail.",
    parameters: {
      type: Type.OBJECT,
      properties: { query: { type: Type.STRING, description: 'Name or email fragment to search for' } },
      required: ['query'],
    },
  },
  {
    name: 'getMyStudentDetail',
    description: "Progress, risk level, and streak for one student across every program of the instructor's they're enrolled in. Requires a learnerId from findMyStudent — only works for students actually enrolled in one of the instructor's own programs.",
    parameters: {
      type: Type.OBJECT,
      properties: { learnerId: { type: Type.STRING, description: 'The learner id returned by findMyStudent' } },
      required: ['learnerId'],
    },
  },
  {
    name: 'getMyProgramAttendance',
    description: "In-person (ILT) attendance check-ins for one of the instructor's own programs.",
    parameters: {
      type: Type.OBJECT,
      properties: { programId: { type: Type.STRING, description: "The program id (must be one of the instructor's own)" } },
      required: ['programId'],
    },
  },
  {
    name: 'getMyProgramFeedback',
    description: "Student feedback and ratings for one of the instructor's own programs.",
    parameters: {
      type: Type.OBJECT,
      properties: { programId: { type: Type.STRING, description: "The program id (must be one of the instructor's own)" } },
      required: ['programId'],
    },
  },
  {
    name: 'getMyProgramQuizResults',
    description: "Quiz performance (attempts, average score, pass rate, recent attempts) for one of the instructor's own programs.",
    parameters: {
      type: Type.OBJECT,
      properties: { programId: { type: Type.STRING, description: "The program id (must be one of the instructor's own)" } },
      required: ['programId'],
    },
  },
];

export const INSTRUCTOR_TOOL_DECLARATIONS = [...INSTRUCTOR_DATA_TOOL_DECLARATIONS, ...RENDER_TOOL_DECLARATIONS];
