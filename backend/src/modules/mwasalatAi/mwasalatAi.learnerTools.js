import { Type } from '@google/genai';
import { mwasalatProgramService } from '../mwasalatProgram/mwasalatProgram.service.js';
import { mwasalatQuizService } from '../mwasalatQuiz/mwasalatQuiz.service.js';
import { AppError } from '../../utils/AppError.js';
import { MAX_LIST_RESULTS } from './mwasalatAi.constants.js';
import { RENDER_TOOL_DECLARATIONS } from './mwasalatAi.renderTools.js';

// Every tool here is scoped to the requesting learner's own data —
// learnerId always comes from the authenticated actor, never from a
// model-supplied argument, so a learner's assistant structurally cannot be
// tricked into returning another learner's data.

export const buildLearnerToolExecutors = (actor) => {
  const learnerId = actor._id;

  const getMyEnrollments = async () => {
    const enrollments = await mwasalatProgramService.listMyEnrollments(learnerId);
    const capped = enrollments.slice(0, MAX_LIST_RESULTS);
    return {
      total: enrollments.length,
      enrollments: capped.map((e) => ({
        programId: e.program?._id,
        program: e.program?.title,
        category: e.program?.category,
        status: e.status,
        currentStreak: e.currentStreak,
        longestStreak: e.longestStreak,
        purchasedAt: e.purchasedAt,
        completedAt: e.completedAt,
      })),
    };
  };

  const getMyProgress = async ({ programId } = {}) => {
    if (!programId) throw new AppError('programId is required', 400);
    return mwasalatProgramService.getCompletionStatus(learnerId, programId);
  };

  const getMyAchievements = async () => {
    const achievements = await mwasalatProgramService.getAchievements(learnerId);
    return {
      points: achievements.points,
      totalCourses: achievements.totalCourses,
      totalCertificates: achievements.totalCertificates,
      totalAttempts: achievements.totalAttempts,
      enrollments: achievements.enrollments.slice(0, MAX_LIST_RESULTS).map((e) => ({
        program: e.program?.title, status: e.status, purchasedAt: e.purchasedAt, completedAt: e.completedAt,
      })),
      certificates: achievements.certificates.slice(0, MAX_LIST_RESULTS).map((c) => ({
        program: c.program?.title, issuedAt: c.issuedAt, expiresAt: c.expiresAt, isExpired: c.isExpired,
      })),
    };
  };

  const getMyCertificate = async ({ programId } = {}) => {
    if (!programId) throw new AppError('programId is required', 400);
    return mwasalatProgramService.getMyCertificate(learnerId, programId);
  };

  const getMyQuizBestAttempt = async ({ programId } = {}) => {
    if (!programId) throw new AppError('programId is required', 400);
    return mwasalatQuizService.getMyBestAttempt(learnerId, programId);
  };

  const browseAvailablePrograms = async ({ category, limit } = {}) => {
    const all = await mwasalatProgramService.listPublic();
    const filtered = category ? all.filter((p) => p.category?.toLowerCase() === category.toLowerCase()) : all;
    const cap = Math.min(Number(limit) || 20, MAX_LIST_RESULTS);
    const capped = filtered.slice(0, cap);
    return {
      total: filtered.length,
      returned: capped.length,
      programs: capped.map((p) => ({
        title: p.title, category: p.category, price: p.price, duration: p.duration, contentTypes: p.contentTypes,
      })),
    };
  };

  return {
    getMyEnrollments,
    getMyProgress,
    getMyAchievements,
    getMyCertificate,
    getMyQuizBestAttempt,
    browseAvailablePrograms,
  };
};

const LEARNER_DATA_TOOL_DECLARATIONS = [
  {
    name: 'getMyEnrollments',
    description: 'List of all courses the learner is enrolled in, with status and streak info.',
  },
  {
    name: 'getMyProgress',
    description: 'Detailed progress for one of the enrolled courses: content opened, PDF/video progress, streak, quiz status, feedback status, certificate status.',
    parameters: {
      type: Type.OBJECT,
      properties: { programId: { type: Type.STRING, description: 'The program id to check progress for (from getMyEnrollments)' } },
      required: ['programId'],
    },
  },
  {
    name: 'getMyAchievements',
    description: "The learner's points, total courses, certificates, and quiz attempts, plus lists of their enrollments and certificates.",
  },
  {
    name: 'getMyCertificate',
    description: 'Certificate details (number, issue/expiry date) for a specific completed course.',
    parameters: {
      type: Type.OBJECT,
      properties: { programId: { type: Type.STRING, description: 'The program id to get the certificate for' } },
      required: ['programId'],
    },
  },
  {
    name: 'getMyQuizBestAttempt',
    description: "The learner's best quiz attempt (score, pass/fail) for a specific course.",
    parameters: {
      type: Type.OBJECT,
      properties: { programId: { type: Type.STRING, description: 'The program id to get the best quiz attempt for' } },
      required: ['programId'],
    },
  },
  {
    name: 'browseAvailablePrograms',
    description: 'List currently available (active, published) courses on the platform the learner could enroll in, optionally filtered by category.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, description: 'Filter by category name' },
        limit: { type: Type.INTEGER, description: `Max rows to return (default 20, max ${MAX_LIST_RESULTS})` },
      },
    },
  },
];

export const LEARNER_TOOL_DECLARATIONS = [...LEARNER_DATA_TOOL_DECLARATIONS, ...RENDER_TOOL_DECLARATIONS];
