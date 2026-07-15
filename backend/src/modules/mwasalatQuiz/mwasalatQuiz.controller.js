import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { mwasalatQuizService } from './mwasalatQuiz.service.js';

const upsertQuiz = asyncHandler(async (req, res) => {
  const quiz = await mwasalatQuizService.upsertQuiz(req.mwasalatUser._id, req.mwasalatUser.role, req.params.programId, req.body);
  successResponse(res, 'Quiz saved', quiz);
});

const getQuizForInstructor = asyncHandler(async (req, res) => {
  const quiz = await mwasalatQuizService.getQuizForInstructor(req.mwasalatUser._id, req.mwasalatUser.role, req.params.programId);
  successResponse(res, 'Quiz fetched', quiz);
});

const getQuizForLearner = asyncHandler(async (req, res) => {
  const quiz = await mwasalatQuizService.getQuizForLearner(req.params.programId);
  successResponse(res, 'Quiz fetched', quiz);
});

const submitAttempt = asyncHandler(async (req, res) => {
  const result = await mwasalatQuizService.submitAttempt(req.mwasalatUser._id, req.params.programId, req.body.answers);
  successResponse(res, 'Quiz submitted', result);
});

const getMyBestAttempt = asyncHandler(async (req, res) => {
  const attempt = await mwasalatQuizService.getMyBestAttempt(req.mwasalatUser._id, req.params.programId);
  successResponse(res, 'Attempt fetched', attempt);
});

const getAdminResults = asyncHandler(async (req, res) => {
  const results = await mwasalatQuizService.getAdminResults();
  successResponse(res, 'Quiz results fetched', results);
});

export const mwasalatQuizController = {
  upsertQuiz, getQuizForInstructor, getQuizForLearner, submitAttempt, getMyBestAttempt, getAdminResults,
};
