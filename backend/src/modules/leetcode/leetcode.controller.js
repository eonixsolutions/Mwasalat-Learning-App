import { leetcodeService } from './leetcode.service.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';

// ── Admin ─────────────────────────────────────────────────────────────────────

const listProblems = asyncHandler(async (req, res) => {
  const data = await leetcodeService.getAllProblems();
  successResponse(res, 'Problems fetched', data);
});

const createProblem = asyncHandler(async (req, res) => {
  const data = await leetcodeService.createProblem(req.body, req.user._id);
  successResponse(res, 'Problem created', data, 201);
});

const updateProblem = asyncHandler(async (req, res) => {
  const data = await leetcodeService.updateProblem(req.params.id, req.body);
  successResponse(res, 'Problem updated', data);
});

const deleteProblem = asyncHandler(async (req, res) => {
  await leetcodeService.deleteProblem(req.params.id);
  successResponse(res, 'Problem deleted', null);
});

// ── Student ───────────────────────────────────────────────────────────────────

const getMyProgress = asyncHandler(async (req, res) => {
  const data = await leetcodeService.getMyProgress(req.user._id);
  successResponse(res, 'LeetCode progress fetched', data);
});

const submitSolution = asyncHandler(async (req, res) => {
  const { problemId } = req.body;
  const data = await leetcodeService.submitSolution(req.user._id, problemId);
  successResponse(res, 'Marked as done!', data, 201);
});

const setLeetcodeUsername = asyncHandler(async (req, res) => {
  const data = await leetcodeService.setLeetcodeUsername(req.user._id, req.body.leetcodeUsername);
  successResponse(res, 'LeetCode username saved', data);
});

// ── Staff ─────────────────────────────────────────────────────────────────────

const getStudentProgress = asyncHandler(async (req, res) => {
  const data = await leetcodeService.getStudentProgress(req.params.studentId);
  successResponse(res, 'Student LeetCode progress fetched', data);
});

const getBatchProgress = asyncHandler(async (req, res) => {
  const data = await leetcodeService.getBatchProgress(req.params.batchId, req.user._id);
  successResponse(res, 'Batch LeetCode progress fetched', data);
});

const toggleHold = asyncHandler(async (req, res) => {
  const data = await leetcodeService.toggleHold(req.params.studentId);
  successResponse(res, `LeetCode hold ${data.leetcodeHold ? 'activated' : 'removed'}`, data);
});

const switchStudentList = asyncHandler(async (req, res) => {
  const data = await leetcodeService.switchStudentToJavaScript(req.params.studentId);
  successResponse(res, 'Student switched to JavaScript list', data);
});

export const leetcodeController = {
  listProblems,
  createProblem,
  updateProblem,
  deleteProblem,
  getMyProgress,
  submitSolution,
  setLeetcodeUsername,
  getStudentProgress,
  getBatchProgress,
  switchStudentList,
  toggleHold,
};
