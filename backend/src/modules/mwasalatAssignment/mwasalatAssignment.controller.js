import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { mwasalatAssignmentService } from './mwasalatAssignment.service.js';

const upsertAssignment = asyncHandler(async (req, res) => {
  const assignment = await mwasalatAssignmentService.upsertAssignment(
    req.mwasalatUser._id, req.mwasalatUser.role, req.params.programId, req.body, req.params.moduleId, req.params.lessonId
  );
  successResponse(res, 'Assignment saved', assignment);
});

const getAssignmentForInstructor = asyncHandler(async (req, res) => {
  const assignment = await mwasalatAssignmentService.getAssignmentForInstructor(
    req.mwasalatUser._id, req.mwasalatUser.role, req.params.programId, req.params.moduleId, req.params.lessonId
  );
  successResponse(res, 'Assignment fetched', assignment);
});

const getAssignmentForLearner = asyncHandler(async (req, res) => {
  const assignment = await mwasalatAssignmentService.getAssignmentForLearner(
    req.params.programId, req.params.moduleId, req.params.lessonId
  );
  successResponse(res, 'Assignment fetched', assignment);
});

const submitAssignment = asyncHandler(async (req, res) => {
  const submission = await mwasalatAssignmentService.submitAssignment(
    req.mwasalatUser._id, req.params.programId, req.file, req.params.moduleId, req.params.lessonId
  );
  successResponse(res, 'Assignment submitted', submission, 201);
});

const getMySubmissions = asyncHandler(async (req, res) => {
  const submissions = await mwasalatAssignmentService.getMySubmissions(
    req.mwasalatUser._id, req.params.programId, req.params.moduleId, req.params.lessonId
  );
  successResponse(res, 'Submissions fetched', submissions);
});

const listSubmissionsForInstructor = asyncHandler(async (req, res) => {
  const submissions = await mwasalatAssignmentService.listSubmissionsForInstructor(
    req.mwasalatUser._id, req.mwasalatUser.role, req.params.programId, req.params.moduleId, req.params.lessonId
  );
  successResponse(res, 'Submissions fetched', submissions);
});

const gradeSubmission = asyncHandler(async (req, res) => {
  const submission = await mwasalatAssignmentService.gradeSubmission(
    req.mwasalatUser._id, req.mwasalatUser.role, req.params.submissionId, req.body
  );
  successResponse(res, 'Submission graded', submission);
});

export const mwasalatAssignmentController = {
  upsertAssignment, getAssignmentForInstructor, getAssignmentForLearner,
  submitAssignment, getMySubmissions, listSubmissionsForInstructor, gradeSubmission,
};
