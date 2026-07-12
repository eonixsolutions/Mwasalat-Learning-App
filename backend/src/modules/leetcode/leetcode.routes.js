import { Router } from 'express';
import { leetcodeController } from './leetcode.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { ROLES } from '../../constants/index.js';
import {
  createProblemSchema,
  updateProblemSchema,
  submitSolutionSchema,
  setUsernameSchema,
} from './leetcode.validation.js';

const router = Router();

const adminOnly  = [ROLES.SUPER_ADMIN];
const staffRoles = [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.BRANCH_COORDINATOR, ROLES.TECHNICAL_MENTOR];

// ── Public (authenticated) problem list ──────────────────────────────────────
router.get(
  '/problems',
  authMiddleware.authenticate,
  leetcodeController.listProblems
);

// ── Admin: problem management ────────────────────────────────────────────────
router.post(
  '/problems',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate(createProblemSchema),
  leetcodeController.createProblem
);

router.patch(
  '/problems/:id',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  validate(updateProblemSchema),
  leetcodeController.updateProblem
);

router.delete(
  '/problems/:id',
  authMiddleware.authenticate,
  authMiddleware.authorize(...adminOnly),
  leetcodeController.deleteProblem
);

// ── Student ──────────────────────────────────────────────────────────────────
router.get(
  '/me',
  authMiddleware.authenticate,
  authMiddleware.authorize(ROLES.STUDENT),
  leetcodeController.getMyProgress
);

router.patch(
  '/username',
  authMiddleware.authenticate,
  authMiddleware.authorize(ROLES.STUDENT),
  validate(setUsernameSchema),
  leetcodeController.setLeetcodeUsername
);

router.post(
  '/submit',
  authMiddleware.authenticate,
  authMiddleware.authorize(ROLES.STUDENT),
  validate(submitSolutionSchema),
  leetcodeController.submitSolution
);

// ── Staff: student & batch views ─────────────────────────────────────────────
router.get(
  '/students/:studentId',
  authMiddleware.authenticate,
  authMiddleware.authorize(...staffRoles),
  leetcodeController.getStudentProgress
);

router.get(
  '/batch/:batchId',
  authMiddleware.authenticate,
  authMiddleware.authorize(...staffRoles),
  leetcodeController.getBatchProgress
);

router.patch(
  '/students/:studentId/hold',
  authMiddleware.authenticate,
  authMiddleware.authorize(...staffRoles),
  leetcodeController.toggleHold
);

router.patch(
  '/students/:studentId/switch-list',
  authMiddleware.authenticate,
  authMiddleware.authorize(...staffRoles),
  leetcodeController.switchStudentList
);

export default router;
