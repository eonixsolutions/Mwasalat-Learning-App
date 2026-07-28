import MwasalatAssignment from './mwasalatAssignment.model.js';
import MwasalatAssignmentSubmission from './mwasalatAssignmentSubmission.model.js';
import MwasalatProgram from '../mwasalatProgram/mwasalatProgram.model.js';
import MwasalatEnrollment from '../mwasalatProgram/mwasalatEnrollment.model.js';
import MwasalatUser from '../mwasalatUser/mwasalatUser.model.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';
import { AppError } from '../../utils/AppError.js';
import { uploadBuffer } from '../../config/cloudinary.js';
import { mwasalatProgramService } from '../mwasalatProgram/mwasalatProgram.service.js';
import { mwasalatNotificationService } from '../mwasalatNotification/mwasalatNotification.service.js';

const POINTS_PER_PASS = 100;

const assertOwnership = async (programId, requesterId, requesterRole) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  if (requesterRole !== MWASALAT_ROLES.SUPER_ADMIN && String(program.instructor) !== String(requesterId)) {
    throw new AppError('You do not have permission to modify this course', 403);
  }
  return program;
};

const upsertAssignment = async (requesterId, requesterRole, programId, { title, instructions, instructionsAr, maxScore }, moduleId = null, lessonId = null) => {
  await assertOwnership(programId, requesterId, requesterRole);

  if (!title?.trim()) throw new AppError('Assignment title is required', 400);
  if (!instructions?.trim()) throw new AppError('Assignment instructions are required', 400);

  return MwasalatAssignment.findOneAndUpdate(
    { program: programId, moduleId, lessonId },
    { program: programId, moduleId, lessonId, title: title.trim(), instructions: instructions.trim(), instructionsAr: instructionsAr?.trim(), maxScore: maxScore ?? 100 },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const getAssignmentForInstructor = async (requesterId, requesterRole, programId, moduleId = null, lessonId = null) => {
  await assertOwnership(programId, requesterId, requesterRole);
  return MwasalatAssignment.findOne({ program: programId, moduleId, lessonId });
};

const getAssignmentForLearner = async (programId, moduleId = null, lessonId = null) => {
  return MwasalatAssignment.findOne({ program: programId, moduleId, lessonId });
};

// One submission per call — resubmitting (before or after grading) simply
// creates a new row; the most recent one is what the certificate gate and
// the learner-facing status both look at, same unlimited-retake model as quizzes.
const submitAssignment = async (learnerId, programId, file, moduleId = null, lessonId = null) => {
  if (!file) throw new AppError('An assignment file is required', 400);

  const [enrollment, program] = await Promise.all([
    MwasalatEnrollment.findOne({ learner: learnerId, program: programId }),
    MwasalatProgram.findById(programId),
  ]);
  if (!enrollment) throw new AppError('You must be enrolled in this course to submit an assignment', 403);
  mwasalatProgramService.assertHasAccess(enrollment);

  if (moduleId) {
    if (!mwasalatProgramService.isModuleContentOpened(program, enrollment, moduleId)) {
      throw new AppError('Finish this module\'s content before submitting your assignment', 403);
    }
  } else if (!enrollment.contentOpenedAt) {
    throw new AppError('Finish viewing the course content before submitting your assignment', 403);
  }

  const assignment = await MwasalatAssignment.findOne({ program: programId, moduleId, lessonId });
  if (!assignment) throw new AppError('This course has no assignment', 404);

  const ext = file.originalname.slice(file.originalname.lastIndexOf('.')) || '';
  const uploaded = await uploadBuffer(file.buffer, {
    public_id: `mwasalat/assignment-submissions/${programId}-${learnerId}-${Date.now()}${ext}`,
    resource_type: 'raw',
  });

  await mwasalatProgramService.registerActivity(programId, enrollment);

  return MwasalatAssignmentSubmission.create({
    learner: learnerId,
    program: programId,
    moduleId,
    lessonId,
    fileUrl: uploaded.secure_url,
    fileName: file.originalname,
    filePublicId: uploaded.public_id,
  });
};

const getMySubmissions = async (learnerId, programId, moduleId = null, lessonId = null) => {
  return MwasalatAssignmentSubmission.find({ learner: learnerId, program: programId, moduleId, lessonId }).sort({ submittedAt: -1 });
};

// Ungraded-first, newest-first — so an instructor opening the grading list
// sees what needs attention before already-graded history.
const listSubmissionsForInstructor = async (requesterId, requesterRole, programId, moduleId = null, lessonId = null) => {
  await assertOwnership(programId, requesterId, requesterRole);

  const submissions = await MwasalatAssignmentSubmission.find({ program: programId, moduleId, lessonId })
    .populate('learner', 'name email')
    .sort({ status: 1, submittedAt: -1 });

  // One row per learner — their most recent submission only, since that's the
  // one grading actually applies to (mirrors the certificate gate's own logic).
  const latestByLearner = new Map();
  submissions.forEach((s) => {
    const key = s.learner?._id?.toString();
    if (key && !latestByLearner.has(key)) latestByLearner.set(key, s);
  });

  return Array.from(latestByLearner.values());
};

const gradeSubmission = async (requesterId, requesterRole, submissionId, { score, passed, feedback }) => {
  if (typeof passed !== 'boolean') throw new AppError('You must mark the submission as passed or not passed', 400);

  const submission = await MwasalatAssignmentSubmission.findById(submissionId);
  if (!submission) throw new AppError('Submission not found', 404);

  await assertOwnership(submission.program, requesterId, requesterRole);

  // Scoped to this exact assignment lesson (moduleId+lessonId, both null for a
  // legacy course-level assignment) — a modular course can have several
  // assignment lessons, and passing one shouldn't be mistaken for a repeat
  // pass of another.
  const wasAlreadyPassed = await MwasalatAssignmentSubmission.findOne({
    learner: submission.learner, program: submission.program,
    moduleId: submission.moduleId, lessonId: submission.lessonId, passed: true,
  });

  submission.status = 'graded';
  submission.score = score ?? null;
  submission.passed = passed;
  submission.feedback = feedback?.trim() ?? '';
  submission.gradedAt = new Date();
  submission.gradedBy = requesterId;
  await submission.save();

  if (passed && !wasAlreadyPassed) {
    await MwasalatUser.findByIdAndUpdate(submission.learner, { $inc: { points: POINTS_PER_PASS } });
  }

  if (passed) {
    if (submission.moduleId) {
      // Reuses the same module-completion recompute as marking any other
      // lesson opened — sets moduleProgress.completedAt once this module's
      // content+quiz+assignments are all satisfied, and checks whole-course completion.
      await mwasalatProgramService.markLessonOpened(submission.learner, submission.program, submission.moduleId, submission.lessonId);
    } else {
      await mwasalatProgramService.maybeCompleteEnrollment(submission.learner, submission.program);
    }
  }

  const program = await MwasalatProgram.findById(submission.program, 'title');
  await mwasalatNotificationService.notifyUsers(requesterId, [submission.learner], {
    title: 'Assignment graded',
    message: `Your assignment for "${program?.title ?? 'your course'}" was graded: ${passed ? 'Passed' : 'Not passed'}.`,
    type: 'assignment_graded',
  });

  return submission;
};

export const mwasalatAssignmentService = {
  upsertAssignment, getAssignmentForInstructor, getAssignmentForLearner,
  submitAssignment, getMySubmissions, listSubmissionsForInstructor, gradeSubmission,
};
