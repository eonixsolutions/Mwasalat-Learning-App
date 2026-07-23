import mongoose from 'mongoose';
import MwasalatProgram from './mwasalatProgram.model.js';
import MwasalatEnrollment from './mwasalatEnrollment.model.js';
import MwasalatFeedback from './mwasalatFeedback.model.js';
import MwasalatAttendance from './mwasalatAttendance.model.js';
import MwasalatCertificate from './mwasalatCertificate.model.js';
import MwasalatQuiz from '../mwasalatQuiz/mwasalatQuiz.model.js';
import MwasalatQuizAttempt from '../mwasalatQuiz/mwasalatQuizAttempt.model.js';
import MwasalatUser from '../mwasalatUser/mwasalatUser.model.js';
import { AppError } from '../../utils/AppError.js';
import { ENROLLMENT_STATUS, PROGRAM_STATUS, CONTENT_TYPES } from './mwasalatProgram.constants.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';
import { suggestFromTitle } from './mwasalatProgram.suggestions.js';
import cloudinary, { uploadBuffer } from '../../config/cloudinary.js';
import { sendEmail } from '../../utils/mailer.js';
import { certificateIssuedTemplate, certificateExpiringTemplate, reengagementTemplate, instructorWeeklyDigestTemplate } from '../mwasalatUser/mwasalatEmailTemplates.js';
import logger from '../../utils/logger.js';
import { mwasalatActivityLogService } from '../mwasalatActivityLog/mwasalatActivityLog.service.js';
import { mwasalatNotificationService } from '../mwasalatNotification/mwasalatNotification.service.js';
import { createZoomMeeting } from '../../integrations/zoom.js';

const formatCertificateNumber = (certificateId) => `MWL-${certificateId.toString().slice(-8).toUpperCase()}`;

// Calendar-month addition (not a fixed 30-day offset), so a 12-month certificate issued
// on Jan 31 lands on Mar 3 the same way a bank statement or subscription renewal would,
// rather than drifting against day-of-month like naive millisecond math would.
const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

// Tries real Gemini-generated suggestions first (see mwasalatAiService.
// autofillCourseDetails), falling back to the keyword heuristic below if the
// AI isn't configured or the call fails for any reason — so this button never
// just breaks, it degrades. Dynamically imported (not a static top-level
// import) to avoid a module cycle: mwasalatAi's tool files import
// mwasalatProgramService themselves.
const aiAutofill = async (title) => {
  if (!title?.trim()) throw new AppError('Title is required for autofill', 400);
  const trimmed = title.trim();

  try {
    const { mwasalatAiService } = await import('../mwasalatAi/mwasalatAi.service.js');
    return await mwasalatAiService.autofillCourseDetails(trimmed);
  } catch (err) {
    logger.warn(`[mwasalat-program] AI autofill fell back to heuristic: ${err.message}`);
    return suggestFromTitle(trimmed);
  }
};

// Backs the "Create Zoom Meeting" button on the live-class fields — not tied
// to a saved program yet (the course may not exist as a DB row at the point
// the instructor clicks it), just a standalone meeting creation.
const createLiveMeeting = async ({ title, liveScheduledAt }) => {
  return createZoomMeeting({ topic: title, startTime: liveScheduledAt });
};

const create = async (instructorId, data, pdfFile, videoFile, actor) => {
  const {
    title, titleAr, category, categoryAr, subCategory, subCategoryAr,
    description, descriptionAr, duration, durationAr, price, expiryDate,
    recordingLink, liveScheduledAt, liveMeetingLink, liveMeetingProvider, liveMeetingStartUrl,
    iltVenue, iltScheduledAt, pdfDurationDays, certificateValidityMonths, capacity, prerequisiteProgram,
  } = data;

  const contentTypes = JSON.parse(data.contentTypes ?? '[]');
  if (!contentTypes.length) throw new AppError('Select at least one content type', 400);

  let pdfDays;
  if (contentTypes.includes(CONTENT_TYPES.PDF) && pdfDurationDays) {
    pdfDays = Number(pdfDurationDays);
    if (!Number.isInteger(pdfDays) || pdfDays < 1) {
      throw new AppError('Number of days must be a whole number of at least 1', 400);
    }
  }

  let certValidityMonths;
  if (certificateValidityMonths) {
    certValidityMonths = Number(certificateValidityMonths);
    if (!Number.isInteger(certValidityMonths) || certValidityMonths < 1) {
      throw new AppError('Certificate validity must be a whole number of months, at least 1', 400);
    }
  }

  let seatCapacity;
  if (capacity) {
    seatCapacity = Number(capacity);
    if (!Number.isInteger(seatCapacity) || seatCapacity < 1) {
      throw new AppError('Capacity must be a whole number of at least 1', 400);
    }
  }

  let prerequisiteProgramId;
  if (prerequisiteProgram) {
    const prereqExists = await MwasalatProgram.exists({ _id: prerequisiteProgram });
    if (!prereqExists) throw new AppError('Selected prerequisite course does not exist', 400);
    prerequisiteProgramId = prerequisiteProgram;
  }

  const duplicate = await MwasalatProgram.findOne({
    instructor: instructorId,
    title: { $regex: `^${title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    status: { $ne: PROGRAM_STATUS.ARCHIVED },
  });
  if (duplicate) throw new AppError('You already have a course with this title', 409);

  if (contentTypes.includes(CONTENT_TYPES.PDF) && !pdfFile) {
    throw new AppError('A PDF file is required for the PDF content type', 400);
  }
  if (contentTypes.includes(CONTENT_TYPES.RECORDING) && !recordingLink?.trim() && !videoFile) {
    throw new AppError('A recording link or an uploaded video is required for the Recording content type', 400);
  }
  if (contentTypes.includes(CONTENT_TYPES.LIVE) && (!liveScheduledAt || !liveMeetingLink?.trim())) {
    throw new AppError('A date/time and meeting link are required for the Live content type', 400);
  }
  if (contentTypes.includes(CONTENT_TYPES.ILT) && (!iltVenue?.trim() || !iltScheduledAt)) {
    throw new AppError('A venue and date/time are required for the Instructor-Led Training content type', 400);
  }

  let pdfUrl;
  if (pdfFile) {
    // `format` is ignored for resource_type 'raw' — the delivered URL only gets
    // a real .pdf extension if the public_id itself ends in .pdf. Without it,
    // Cloudinary serves the file as application/octet-stream with a forced
    // download disposition instead of an inline-viewable PDF.
    const uploaded = await uploadBuffer(pdfFile.buffer, {
      public_id: `mwasalat/course-pdfs/${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`,
      resource_type: 'raw',
      allowed_formats: ['pdf'],
    });
    pdfUrl = uploaded.secure_url;
  }

  let recordingVideoPublicId;
  let recordingVideoDurationSeconds;
  if (videoFile) {
    // 'authenticated' delivery means the asset has no permanent public URL — a
    // fresh signed URL is generated per-request (see getVideoUrl) instead.
    const uploaded = await uploadBuffer(videoFile.buffer, {
      public_id: `mwasalat/course-videos/${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      resource_type: 'video',
      type: 'authenticated',
    });
    recordingVideoPublicId = uploaded.public_id;
    recordingVideoDurationSeconds = uploaded.duration;
  }

  const program = await MwasalatProgram.create({
    title, titleAr, category, categoryAr, subCategory, subCategoryAr,
    description, descriptionAr, contentTypes, duration, durationAr, price,
    expiryDate: expiryDate || undefined,
    certificateValidityMonths: certValidityMonths,
    pdfUrl,
    pdfDurationDays: pdfDays,
    recordingLink: contentTypes.includes(CONTENT_TYPES.RECORDING) && !videoFile ? recordingLink : undefined,
    recordingVideoPublicId,
    recordingVideoDurationSeconds,
    liveScheduledAt: contentTypes.includes(CONTENT_TYPES.LIVE) ? liveScheduledAt : undefined,
    liveMeetingLink: contentTypes.includes(CONTENT_TYPES.LIVE) ? liveMeetingLink : undefined,
    liveMeetingProvider: contentTypes.includes(CONTENT_TYPES.LIVE) ? liveMeetingProvider : undefined,
    liveMeetingStartUrl: contentTypes.includes(CONTENT_TYPES.LIVE) ? liveMeetingStartUrl : undefined,
    iltVenue: contentTypes.includes(CONTENT_TYPES.ILT) ? iltVenue : undefined,
    iltScheduledAt: contentTypes.includes(CONTENT_TYPES.ILT) ? iltScheduledAt : undefined,
    capacity: (contentTypes.includes(CONTENT_TYPES.LIVE) || contentTypes.includes(CONTENT_TYPES.ILT)) ? seatCapacity : undefined,
    prerequisiteProgram: prerequisiteProgramId,
    instructor: instructorId,
  });

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'create_program', targetType: 'MwasalatProgram', targetId: program._id, metadata: { title: program.title },
  });

  return program;
};

const listMine = async (instructorId) => {
  return MwasalatProgram.find({ instructor: instructorId }).sort({ createdAt: -1 });
};

// Seats-remaining is only meaningful for session-based delivery (live/ILT) —
// self-paced pdf/recording courses never set a capacity, so they're returned
// as-is with no seatsRemaining field at all.
const listPublic = async () => {
  const now = new Date();
  const programs = await MwasalatProgram.find({
    status: PROGRAM_STATUS.ACTIVE,
    $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }],
  })
    .populate('instructor', 'name')
    .populate('prerequisiteProgram', 'title titleAr')
    .sort({ createdAt: -1 });

  const capacitated = programs.filter((p) => p.capacity);
  if (!capacitated.length) return programs;

  const counts = await MwasalatEnrollment.aggregate([
    { $match: { program: { $in: capacitated.map((p) => p._id) } } },
    { $group: { _id: '$program', count: { $sum: 1 } } },
  ]);
  const seatsTakenByProgram = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));

  return programs.map((p) => {
    if (!p.capacity) return p;
    const obj = p.toObject();
    obj.seatsRemaining = Math.max(0, p.capacity - (seatsTakenByProgram[p._id.toString()] ?? 0));
    return obj;
  });
};

const assertOwnership = (program, requesterId, requesterRole) => {
  if (requesterRole === MWASALAT_ROLES.SUPER_ADMIN) return;
  if (String(program.instructor) !== String(requesterId)) {
    throw new AppError('You do not have permission to modify this course', 403);
  }
};

const EDITABLE_FIELDS = [
  'title', 'titleAr', 'category', 'categoryAr', 'subCategory', 'subCategoryAr',
  'description', 'descriptionAr', 'duration', 'durationAr', 'price', 'expiryDate',
  'recordingLink', 'liveScheduledAt', 'liveMeetingLink', 'liveMeetingProvider', 'liveMeetingStartUrl',
  'iltVenue', 'iltScheduledAt',
];

const update = async (requesterId, requesterRole, programId, data, actor) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  assertOwnership(program, requesterId, requesterRole);

  for (const field of EDITABLE_FIELDS) {
    if (data[field] !== undefined) program[field] = data[field] || undefined;
  }

  if (data.pdfDurationDays !== undefined) {
    if (data.pdfDurationDays === '' || data.pdfDurationDays === null) {
      program.pdfDurationDays = undefined;
    } else {
      const pdfDays = Number(data.pdfDurationDays);
      if (!Number.isInteger(pdfDays) || pdfDays < 1) {
        throw new AppError('Number of days must be a whole number of at least 1', 400);
      }
      program.pdfDurationDays = pdfDays;
    }
  }

  if (data.certificateValidityMonths !== undefined) {
    if (data.certificateValidityMonths === '' || data.certificateValidityMonths === null) {
      program.certificateValidityMonths = undefined;
    } else {
      const months = Number(data.certificateValidityMonths);
      if (!Number.isInteger(months) || months < 1) {
        throw new AppError('Certificate validity must be a whole number of months, at least 1', 400);
      }
      program.certificateValidityMonths = months;
    }
  }

  if (data.capacity !== undefined) {
    if (data.capacity === '' || data.capacity === null) {
      program.capacity = undefined;
    } else {
      const seatCapacity = Number(data.capacity);
      if (!Number.isInteger(seatCapacity) || seatCapacity < 1) {
        throw new AppError('Capacity must be a whole number of at least 1', 400);
      }
      program.capacity = seatCapacity;
    }
  }

  if (data.prerequisiteProgram !== undefined) {
    if (data.prerequisiteProgram === '' || data.prerequisiteProgram === null) {
      program.prerequisiteProgram = undefined;
    } else {
      if (String(data.prerequisiteProgram) === String(program._id)) {
        throw new AppError('A course cannot be its own prerequisite', 400);
      }
      const prereqExists = await MwasalatProgram.exists({ _id: data.prerequisiteProgram });
      if (!prereqExists) throw new AppError('Selected prerequisite course does not exist', 400);
      program.prerequisiteProgram = data.prerequisiteProgram;
    }
  }

  await program.save();

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'update_program', targetType: 'MwasalatProgram', targetId: program._id, metadata: { title: program.title },
  });

  return program;
};

const remove = async (requesterId, requesterRole, programId, actor) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  assertOwnership(program, requesterId, requesterRole);

  program.status = PROGRAM_STATUS.ARCHIVED;
  await program.save();

  const enrollments = await MwasalatEnrollment.find({ program: programId }, 'learner');
  if (enrollments.length) {
    mwasalatNotificationService.notifyUsers(
      requesterId,
      enrollments.map((e) => e.learner),
      {
        title: 'Course discontinued',
        message: `"${program.title}" has been discontinued by its instructor. Your progress, certificate, and existing access remain available — it just won't appear in the catalog anymore.`,
      }
    ).catch((err) => logger.error(`[mwasalat-program] Failed to notify learners for archived program ${programId}: ${err.message}`));
  }

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'delete_program', targetType: 'MwasalatProgram', targetId: program._id, metadata: { title: program.title },
  });

  return program;
};

const archiveExpired = async () => {
  const now = new Date();
  const result = await MwasalatProgram.updateMany(
    { status: PROGRAM_STATUS.ACTIVE, expiryDate: { $lte: now } },
    { $set: { status: PROGRAM_STATUS.ARCHIVED } }
  );
  return result.modifiedCount;
};

const enroll = async (learnerId, programId) => {
  const program = await MwasalatProgram.findById(programId).populate('prerequisiteProgram', 'title titleAr');
  if (!program) throw new AppError('Program not found', 404);

  const existing = await MwasalatEnrollment.findOne({ learner: learnerId, program: programId });
  if (existing) throw new AppError('You are already enrolled in this program', 409);

  if (program.capacity) {
    const seatsTaken = await MwasalatEnrollment.countDocuments({ program: programId });
    if (seatsTaken >= program.capacity) throw new AppError('This session is full', 409);
  }

  if (program.prerequisiteProgram) {
    const prereqCompleted = await MwasalatEnrollment.findOne({
      learner: learnerId, program: program.prerequisiteProgram._id, completedAt: { $ne: null },
    });
    if (!prereqCompleted) {
      throw new AppError(`Complete "${program.prerequisiteProgram.title}" first to unlock this course`, 409);
    }
  }

  return MwasalatEnrollment.create({ learner: learnerId, program: programId });
};

const listMyEnrollments = async (learnerId) => {
  return MwasalatEnrollment.find({ learner: learnerId })
    .populate('program')
    .sort({ createdAt: -1 });
};

const toggleStar = async (learnerId, programId) => {
  const enrollment = await MwasalatEnrollment.findOne({ learner: learnerId, program: programId });
  if (!enrollment) throw new AppError('You are not enrolled in this course', 404);

  enrollment.isStarred = !enrollment.isStarred;
  await enrollment.save();
  return { isStarred: enrollment.isStarred };
};

const getById = async (id, requester) => {
  const program = await MwasalatProgram.findById(id)
    .select('+liveMeetingStartUrl')
    .populate('instructor', 'name email')
    .populate('prerequisiteProgram', 'title titleAr');
  if (!program) throw new AppError('Program not found', 404);

  const canSeeHostLink = requester && (
    requester.role === MWASALAT_ROLES.SUPER_ADMIN
    || (requester.role === MWASALAT_ROLES.INSTRUCTOR && String(program.instructor?._id) === String(requester._id))
  );
  const result = program.toObject();
  if (!canSeeHostLink) delete result.liveMeetingStartUrl;

  if (program.capacity) {
    const seatsTaken = await MwasalatEnrollment.countDocuments({ program: id });
    result.seatsRemaining = Math.max(0, program.capacity - seatsTaken);
  }

  if (program.prerequisiteProgram && requester?.role === MWASALAT_ROLES.LEARNER) {
    const prereqCompleted = await MwasalatEnrollment.findOne({
      learner: requester._id, program: program.prerequisiteProgram._id, completedAt: { $ne: null },
    });
    result.prerequisiteCompleted = Boolean(prereqCompleted);
  }

  return result;
};

// Server-side mirror of frontend/src/utils/mwasalatProgress.js stageProgress()
// — deliberately duplicated (frontend/backend don't share a module boundary
// here) so the instructor roster gets a real progress % without firing one
// getCompletionStatus request per learner.
const computeLearnerProgressPercent = (enrollment, program, quizPassed, feedbackSubmitted, hasQuiz) => {
  const contentTypes = program.contentTypes ?? [];
  const typeProgress = (type) => {
    if (type === CONTENT_TYPES.PDF && program.pdfDurationDays) {
      return Math.min(1, (enrollment.pdfOpenedDates?.length ?? 0) / program.pdfDurationDays);
    }
    if (type === CONTENT_TYPES.RECORDING && program.recordingVideoDurationSeconds) {
      return Math.min(1, (enrollment.videoFurthestSeconds ?? 0) / program.recordingVideoDurationSeconds);
    }
    return enrollment.openedContentTypes?.includes(type) ? 1 : 0;
  };
  const contentStep = contentTypes.length
    ? contentTypes.reduce((sum, t) => sum + typeProgress(t), 0) / contentTypes.length
    : (enrollment.contentOpenedAt ? 1 : 0);

  const steps = [contentStep, hasQuiz ? (quizPassed ? 1 : 0) : null, feedbackSubmitted ? 1 : 0].filter((s) => s !== null);
  const done = steps.reduce((sum, s) => sum + s, 0);
  return steps.length ? Math.round((done / steps.length) * 100) : 0;
};

// Enriches the roster with progress/streak/risk in one batched pass (one
// query per collection, joined in JS — same style as getInstructorDetail/
// listAllForAdmin below) and splits it into the full roster plus the subset
// that needs instructor attention, so the "Needs Attention" card doesn't
// have to re-fetch or re-score anything.
const getLearners = async (programId) => {
  const [program, enrollments, hasQuiz, passingAttempts, feedbackDocs] = await Promise.all([
    MwasalatProgram.findById(programId),
    MwasalatEnrollment.find({ program: programId }).populate('learner', 'name email').sort({ createdAt: -1 }),
    MwasalatQuiz.exists({ program: programId }),
    MwasalatQuizAttempt.find({ program: programId, passed: true }, 'learner'),
    MwasalatFeedback.find({ program: programId }, 'learner'),
  ]);
  if (!program) throw new AppError('Program not found', 404);

  const passedLearnerIds = new Set(passingAttempts.map((a) => a.learner.toString()));
  const feedbackLearnerIds = new Set(feedbackDocs.map((f) => f.learner.toString()));
  const returnedCutoff = Date.now() - 3 * DAY_MS;

  const allStudents = enrollments.map((e) => {
    const learnerId = e.learner?._id?.toString();
    const progress = computeLearnerProgressPercent(
      e, program, passedLearnerIds.has(learnerId), feedbackLearnerIds.has(learnerId), Boolean(hasQuiz)
    );
    const returned = Boolean(e.returnedAt) && new Date(e.returnedAt).getTime() >= returnedCutoff;
    const isCompleted = e.status === ENROLLMENT_STATUS.COMPLETED;
    return {
      _id: e._id,
      learner: e.learner,
      status: e.status,
      purchasedAt: e.purchasedAt,
      completedAt: e.completedAt,
      progress,
      currentStreak: e.currentStreak,
      longestStreak: e.longestStreak,
      lastActivityAt: e.lastActivityAt,
      daysSinceActivity: daysAgo(e.lastActivityAt ?? e.purchasedAt),
      riskLevel: isCompleted ? 'on_track' : e.riskLevel,
      returned,
    };
  });

  const needsAttention = allStudents.filter(
    (s) => (s.riskLevel !== 'on_track' && s.status !== ENROLLMENT_STATUS.COMPLETED) || s.returned
  );

  return { allStudents, needsAttention };
};

// Cross-course version of getLearners above — same enrichment (progress,
// streak, risk), just batched across every course this instructor teaches
// instead of one. One row per (learner, program) enrollment, so a learner
// taking two of the instructor's courses shows up twice, each with its own
// progress/risk — backs the "My Students" and "Needs Attention" sidebar pages.
const getMyRoster = async (instructorId) => {
  const programs = await MwasalatProgram.find({ instructor: instructorId });
  if (!programs.length) return { allStudents: [], needsAttention: [] };

  const programIds = programs.map((p) => p._id);
  const programById = new Map(programs.map((p) => [p._id.toString(), p]));

  const [enrollments, quizzes, passingAttempts, feedbackDocs] = await Promise.all([
    MwasalatEnrollment.find({ program: { $in: programIds } }).populate('learner', 'name email').sort({ createdAt: -1 }),
    MwasalatQuiz.find({ program: { $in: programIds } }, 'program'),
    MwasalatQuizAttempt.find({ program: { $in: programIds }, passed: true }, 'learner program'),
    MwasalatFeedback.find({ program: { $in: programIds } }, 'learner program'),
  ]);

  const programsWithQuiz = new Set(quizzes.map((q) => q.program.toString()));
  const passedKeys = new Set(passingAttempts.map((a) => `${a.learner}:${a.program}`));
  const feedbackKeys = new Set(feedbackDocs.map((f) => `${f.learner}:${f.program}`));
  const returnedCutoff = Date.now() - 3 * DAY_MS;

  const allStudents = enrollments.map((e) => {
    const programKey = e.program.toString();
    const program = programById.get(programKey);
    const learnerId = e.learner?._id?.toString();
    const key = `${learnerId}:${programKey}`;
    const progress = computeLearnerProgressPercent(
      e, program, passedKeys.has(key), feedbackKeys.has(key), programsWithQuiz.has(programKey)
    );
    const returned = Boolean(e.returnedAt) && new Date(e.returnedAt).getTime() >= returnedCutoff;
    const isCompleted = e.status === ENROLLMENT_STATUS.COMPLETED;
    return {
      _id: e._id,
      learner: e.learner,
      program: program ? { _id: program._id, title: program.title, titleAr: program.titleAr } : null,
      status: e.status,
      purchasedAt: e.purchasedAt,
      completedAt: e.completedAt,
      progress,
      currentStreak: e.currentStreak,
      longestStreak: e.longestStreak,
      lastActivityAt: e.lastActivityAt,
      daysSinceActivity: daysAgo(e.lastActivityAt ?? e.purchasedAt),
      riskLevel: isCompleted ? 'on_track' : e.riskLevel,
      returned,
    };
  });

  const needsAttention = allStudents.filter(
    (s) => (s.riskLevel !== 'on_track' && s.status !== ENROLLMENT_STATUS.COMPLETED) || s.returned
  );

  return { allStudents, needsAttention };
};

const getFeedback = async (programId) => {
  return MwasalatFeedback.find({ program: programId })
    .populate('learner', 'name email')
    .sort({ createdAt: -1 });
};

// Shared by the learner's own QR check-in and the instructor's manual
// "mark present" — both grant the exact same ILT content-credit + attendance
// record, just triggered from different sides.
const recordAttendance = async (learnerId, programId) => {
  await markContentOpened(learnerId, programId, CONTENT_TYPES.ILT);

  const existing = await MwasalatAttendance.findOne({ learner: learnerId, program: programId });
  if (existing) return existing;

  return MwasalatAttendance.create({ learner: learnerId, program: programId });
};

const checkIn = async (learnerId, programId) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  if (!program.contentTypes.includes(CONTENT_TYPES.ILT)) {
    throw new AppError('This course has no in-person session to check into', 400);
  }

  const enrollment = await MwasalatEnrollment.findOne({ learner: learnerId, program: programId });
  if (!enrollment) throw new AppError('You must be enrolled in this course to check in', 403);

  return recordAttendance(learnerId, programId);
};

// Instructor-initiated equivalent of checkIn — for learners who can't/didn't scan the QR.
const markAttendance = async (requesterId, requesterRole, programId, learnerId) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  assertOwnership(program, requesterId, requesterRole);
  if (!program.contentTypes.includes(CONTENT_TYPES.ILT)) {
    throw new AppError('This course has no in-person session', 400);
  }

  const enrollment = await MwasalatEnrollment.findOne({ learner: learnerId, program: programId });
  if (!enrollment) throw new AppError('This learner is not enrolled in the course', 404);

  return recordAttendance(learnerId, programId);
};

const getAttendance = async (programId) => {
  return MwasalatAttendance.find({ program: programId })
    .populate('learner', 'name email')
    .sort({ checkedInAt: -1 });
};

// ─── Engagement streak + risk tracking ───────────────────────────────────
// Day-keys are UTC (new Date().toISOString().slice(0,10)) — same convention
// as pdfOpenedDates elsewhere in this file. The engagement cron's
// Asia/Kolkata timezone only controls when it fires, not what "today" means
// here.
const STREAK_MILESTONES = [7, 30, 100];
const NUDGE_THRESHOLDS = [3, 7, 14];
const DAY_MS = 24 * 60 * 60 * 1000;

const dayKey = (date) => date.toISOString().slice(0, 10);
const daysAgo = (date) => (date ? Math.floor((Date.now() - new Date(date).getTime()) / DAY_MS) : null);

// Called at the end of every learner action that counts as "engaging with
// this course" — opening content, watching video, taking the quiz, leaving
// feedback. Updates the streak, and — only on a genuine new calendar day —
// checks whether this is a comeback (fires a welcome-back message) or a
// fresh streak milestone (7/30/100 days in a row).
const registerActivity = async (programId, enrollment) => {
  const todayKey = dayKey(new Date());
  let isNewDay = false;
  let justReturned = false;

  if (enrollment.lastActiveDate !== todayKey) {
    isNewDay = true;
    const yesterdayKey = dayKey(new Date(Date.now() - DAY_MS));
    enrollment.currentStreak = enrollment.lastActiveDate === yesterdayKey ? (enrollment.currentStreak || 0) + 1 : 1;
    enrollment.longestStreak = Math.max(enrollment.longestStreak || 0, enrollment.currentStreak);
    enrollment.lastActiveDate = todayKey;

    const days = new Set(enrollment.recentActiveDates || []);
    days.add(todayKey);
    enrollment.recentActiveDates = [...days].sort().slice(-14);

    if (enrollment.wasFlaggedInactive) {
      enrollment.wasFlaggedInactive = false;
      enrollment.lastNudgeThreshold = 0;
      enrollment.riskLevel = 'on_track';
      enrollment.returnedAt = new Date();
      justReturned = true;
    }
  }
  enrollment.lastActivityAt = new Date();
  await enrollment.save();

  if (isNewDay) {
    if (justReturned) {
      fireWelcomeBack(programId, enrollment).catch((err) => logger.error(`[mwasalat-program] Welcome-back notify failed: ${err.message}`));
    } else if (STREAK_MILESTONES.includes(enrollment.currentStreak)) {
      fireStreakMilestone(programId, enrollment).catch((err) => logger.error(`[mwasalat-program] Streak milestone notify failed: ${err.message}`));
    }
  }
};

const fireWelcomeBack = async (programId, enrollment) => {
  const program = await MwasalatProgram.findById(programId, 'title instructor');
  if (!program) return;
  await mwasalatNotificationService.notifyUsers(program.instructor, [enrollment.learner], {
    title: `Welcome back to ${program.title}!`,
    message: 'Great to see you again — your progress is saved and your streak has started fresh.',
  });
};

const fireStreakMilestone = async (programId, enrollment) => {
  const program = await MwasalatProgram.findById(programId, 'title instructor');
  if (!program) return;
  await mwasalatNotificationService.notifyUsers(program.instructor, [enrollment.learner], {
    title: `${enrollment.currentStreak}-day streak in ${program.title}!`,
    message: `You've engaged with this course ${enrollment.currentStreak} days in a row — keep it going.`,
  });
};

// Explainable heuristic (not ML): days since the last qualifying activity,
// falling back to purchasedAt for someone who never even started. Excluded
// entirely (never scored) if already completed — see computeEngagementAndNudge.
const scoreRisk = (enrollment, now) => {
  const referenceDate = enrollment.lastActivityAt ?? enrollment.purchasedAt;
  const daysSince = Math.floor((now - new Date(referenceDate).getTime()) / DAY_MS);
  const daysSincePurchase = Math.floor((now - new Date(enrollment.purchasedAt).getTime()) / DAY_MS);
  const neverOpened = !enrollment.contentOpenedAt && !enrollment.lastActivityAt;

  if (neverOpened && daysSincePurchase >= 3) return 'at_risk';
  if (daysSince <= 2) return 'on_track';
  if (daysSince <= 6) return 'at_risk';
  if (daysSince <= 13) return 'inactive';
  return 'churned';
};

const NUDGE_COPY = {
  3: (courseTitle) => ({
    title: `Missing you at ${courseTitle}`,
    message: `You haven't opened ${courseTitle} in a few days — pick up right where you left off.`,
  }),
  7: (courseTitle) => ({
    title: "We haven't seen you in a week",
    message: `It's been 7 days since your last activity in ${courseTitle}. A few minutes today keeps your progress moving.`,
  }),
  14: (courseTitle) => ({
    title: `We miss you at ${courseTitle}`,
    message: `It's been 2 weeks — your enrollment and progress in ${courseTitle} are still saved. Come back anytime.`,
  }),
};

// Run once a day by the scheduler (backend/src/services/scheduler.js). Two
// passes: (1) score every active-program, non-completed enrollment and cache
// the result so the instructor roster never computes risk per-request, then
// (2) nudge anyone who just crossed the 3/7/14-day inactivity line, deduped
// via lastNudgeThreshold so nobody is renotified at the same tier twice.
const computeEngagementAndNudge = async () => {
  const now = Date.now();
  const activePrograms = await MwasalatProgram.find({ status: PROGRAM_STATUS.ACTIVE }, 'title instructor');
  const programById = new Map(activePrograms.map((p) => [p._id.toString(), p]));
  if (!programById.size) return { scored: 0, nudged: 0 };

  const enrollments = await MwasalatEnrollment.find({
    program: { $in: [...programById.keys()] },
    status: { $ne: ENROLLMENT_STATUS.COMPLETED },
  });

  const riskOps = [];
  const toNudge = [];

  enrollments.forEach((enrollment) => {
    const riskLevel = scoreRisk(enrollment, now);
    riskOps.push({
      updateOne: {
        filter: { _id: enrollment._id },
        update: { $set: { riskLevel, riskComputedAt: new Date() } },
      },
    });

    const referenceDate = enrollment.lastActivityAt ?? enrollment.purchasedAt;
    const daysSince = Math.floor((now - new Date(referenceDate).getTime()) / DAY_MS);
    const crossedThreshold = [...NUDGE_THRESHOLDS].reverse().find((t) => daysSince >= t);
    if (crossedThreshold && crossedThreshold > (enrollment.lastNudgeThreshold || 0)) {
      toNudge.push({ enrollment, threshold: crossedThreshold });
    }
  });

  if (riskOps.length) await MwasalatEnrollment.bulkWrite(riskOps);

  let nudged = 0;
  const chunkSize = 25;
  for (let i = 0; i < toNudge.length; i += chunkSize) {
    const chunk = toNudge.slice(i, i + chunkSize);
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(chunk.map(async ({ enrollment, threshold }) => {
      try {
        const program = programById.get(enrollment.program.toString());
        if (!program) return;
        const { title, message } = NUDGE_COPY[threshold](program.title);
        await mwasalatNotificationService.notifyUsers(program.instructor, [enrollment.learner], { title, message });

        if (threshold === 14) {
          const learner = await MwasalatUser.findById(enrollment.learner, 'name email');
          if (learner?.email) {
            sendEmail({
              to: learner.email,
              subject: title,
              html: reengagementTemplate({
                name: learner.name,
                courseTitle: program.title,
                courseUrl: `${process.env.CLIENT_URL}/mwasalat/learner/programs/${program._id}`,
              }),
            }).catch((err) => logger.error(`[mwasalat-program] Re-engagement email failed for ${learner.email}: ${err.message}`));
          }
        }

        enrollment.lastNudgeThreshold = threshold;
        enrollment.wasFlaggedInactive = true;
        await enrollment.save();
        nudged += 1;
      } catch (err) {
        logger.error(`[mwasalat-program] Nudge failed for enrollment ${enrollment._id}: ${err.message}`);
      }
    }));
  }

  return { scored: enrollments.length, nudged };
};

const ENCOURAGEMENT_TEMPLATES = {
  checking_in: {
    title: 'Just checking in',
    message: "Hi! Just checking in — no rush, but we'd love to see you back in the course when you have a moment.",
  },
  almost_there: {
    title: "You're almost there",
    message: "You've made solid progress — a little more and you'll have this course completed. Keep going!",
  },
  we_miss_you: {
    title: 'We miss you in class',
    message: 'Your instructor noticed you\'ve been away and wanted to reach out personally — come back anytime, your spot is saved.',
  },
};

// One-click instructor-triggered version of the same nudge pipeline the
// automated cron uses — fixed canned messages (not free text) so it stays a
// genuine one-click action and can't become a spam vector.
const sendEncouragement = async (requesterId, requesterRole, programId, learnerId, templateKey) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  assertOwnership(program, requesterId, requesterRole);

  const enrollment = await MwasalatEnrollment.findOne({ learner: learnerId, program: programId });
  if (!enrollment) throw new AppError('This learner is not enrolled in the course', 404);

  const template = ENCOURAGEMENT_TEMPLATES[templateKey];
  if (!template) throw new AppError('Unknown encouragement template', 400);

  await mwasalatNotificationService.notifyUsers(requesterId, [learnerId], template);
  return { sent: true };
};

// Shared by quiz-pass and feedback-submit — issues a certificate once both are satisfied
const maybeCompleteEnrollment = async (learnerId, programId) => {
  const enrollment = await MwasalatEnrollment.findOne({ learner: learnerId, program: programId });
  if (!enrollment || enrollment.status === ENROLLMENT_STATUS.COMPLETED) return;

  const [hasQuiz, passingAttempt, feedback] = await Promise.all([
    MwasalatQuiz.exists({ program: programId }),
    MwasalatQuizAttempt.findOne({ learner: learnerId, program: programId, passed: true }),
    MwasalatFeedback.findOne({ learner: learnerId, program: programId }),
  ]);

  const quizSatisfied = hasQuiz ? Boolean(passingAttempt) : true;
  if (!quizSatisfied || !feedback) return;

  enrollment.status = ENROLLMENT_STATUS.COMPLETED;
  enrollment.completedAt = new Date();
  await enrollment.save();

  const existingCertificate = await MwasalatCertificate.findOne({ learner: learnerId, program: programId });
  if (existingCertificate) return;

  const [learner, program] = await Promise.all([
    MwasalatUser.findById(learnerId),
    MwasalatProgram.findById(programId),
  ]);

  const issuedAt = new Date();
  const expiresAt = program?.certificateValidityMonths ? addMonths(issuedAt, program.certificateValidityMonths) : undefined;
  const certificate = await MwasalatCertificate.create({ learner: learnerId, program: programId, issuedAt, expiresAt });

  if (learner?.email) {
    sendEmail({
      to: learner.email,
      subject: `You earned a certificate — ${program?.title}`,
      html: certificateIssuedTemplate({
        name: learner.name,
        courseTitle: program?.title,
        certificateNumber: formatCertificateNumber(certificate._id),
        issuedAt: certificate.issuedAt,
        expiresAt: certificate.expiresAt,
        certificateUrl: `${process.env.CLIENT_URL}/mwasalat/learner/programs/${programId}/certificate`,
      }),
    }).catch((err) => logger.error(`[mwasalat-program] Certificate email failed for ${learner.email}: ${err.message}`));
  }
};

const submitFeedback = async (learnerId, programId, data) => {
  const enrollment = await MwasalatEnrollment.findOne({ learner: learnerId, program: programId });
  if (!enrollment) throw new AppError('You must be enrolled in this course to leave feedback', 403);

  const existing = await MwasalatFeedback.findOne({ learner: learnerId, program: programId });
  if (existing) throw new AppError('You have already submitted feedback for this course', 409);

  const feedback = await MwasalatFeedback.create({
    learner: learnerId,
    program: programId,
    courseRating: data.courseRating,
    instructorRating: data.instructorRating,
    comment: data.comment,
  });

  await registerActivity(programId, enrollment);
  await maybeCompleteEnrollment(learnerId, programId);
  return feedback;
};

const getCompletionStatus = async (learnerId, programId) => {
  const [enrollment, program, hasQuiz, passingAttempt, feedback, certificate] = await Promise.all([
    MwasalatEnrollment.findOne({ learner: learnerId, program: programId }),
    MwasalatProgram.findById(programId, 'pdfDurationDays contentTypes recordingVideoDurationSeconds'),
    MwasalatQuiz.exists({ program: programId }),
    MwasalatQuizAttempt.findOne({ learner: learnerId, program: programId, passed: true }),
    MwasalatFeedback.findOne({ learner: learnerId, program: programId }),
    MwasalatCertificate.findOne({ learner: learnerId, program: programId }),
  ]);

  const quizAttemptNumber = passingAttempt
    ? await MwasalatQuizAttempt.countDocuments({
      learner: learnerId, program: programId, attemptedAt: { $lte: passingAttempt.attemptedAt },
    })
    : null;

  return {
    contentOpened: Boolean(enrollment?.contentOpenedAt),
    contentTypes: program?.contentTypes ?? [],
    openedContentTypes: enrollment?.openedContentTypes ?? [],
    pdfProgress: program?.pdfDurationDays
      ? {
        openedDays: enrollment?.pdfOpenedDates?.length ?? 0,
        totalDays: program.pdfDurationDays,
        openedToday: Boolean(enrollment?.pdfOpenedDates?.includes(new Date().toISOString().slice(0, 10))),
      }
      : null,
    // Only set for an uploaded video (has a known duration) — a pasted external
    // link has no way to report watch position, so it stays a plain open/not-open flag.
    videoProgress: program?.recordingVideoDurationSeconds
      ? { furthestSeconds: enrollment?.videoFurthestSeconds ?? 0, durationSeconds: program.recordingVideoDurationSeconds }
      : null,
    streak: {
      current: enrollment?.currentStreak ?? 0,
      longest: enrollment?.longestStreak ?? 0,
      lastActiveDate: enrollment?.lastActiveDate ?? null,
      recentActiveDates: enrollment?.recentActiveDates ?? [],
    },
    hasQuiz: Boolean(hasQuiz),
    quizPassed: hasQuiz ? Boolean(passingAttempt) : true,
    quizAttemptNumber,
    quizAttemptedAt: passingAttempt?.attemptedAt ?? null,
    feedbackSubmitted: Boolean(feedback),
    certificateIssued: Boolean(certificate),
  };
};

const getMyCertificate = async (learnerId, programId) => {
  const certificate = await MwasalatCertificate.findOne({ learner: learnerId, program: programId });
  if (!certificate) throw new AppError('No certificate found for this course', 404);

  const [learner, program] = await Promise.all([
    MwasalatUser.findById(learnerId),
    MwasalatProgram.findById(programId).populate('instructor', 'name'),
  ]);

  return {
    _id: certificate._id,
    certificateNumber: formatCertificateNumber(certificate._id),
    issuedAt: certificate.issuedAt,
    expiresAt: certificate.expiresAt,
    isExpired: Boolean(certificate.expiresAt && certificate.expiresAt <= new Date()),
    learnerName: learner?.name,
    courseTitle: program?.title,
    courseTitleAr: program?.titleAr,
    category: program?.category,
    categoryAr: program?.categoryAr,
    instructorName: program?.instructor?.name,
  };
};

// Public certificate lookup — no auth, backs the QR-code verification page.
// Deliberately returns only what a third party (employer, auditor) needs to
// confirm authenticity: no email, no internal ids beyond the certificate
// itself. An invalid/malformed id is treated the same as "not found" rather
// than a 400/500, since a scanner has no way to distinguish or act on that.
const verifyCertificate = async (certificateId) => {
  if (!mongoose.Types.ObjectId.isValid(certificateId)) {
    throw new AppError('Certificate not found', 404);
  }

  const certificate = await MwasalatCertificate.findById(certificateId)
    .populate('learner', 'name')
    .populate('program', 'title titleAr category categoryAr');
  if (!certificate) throw new AppError('Certificate not found', 404);

  return {
    valid: true,
    certificateNumber: formatCertificateNumber(certificate._id),
    learnerName: certificate.learner?.name,
    courseTitle: certificate.program?.title,
    courseTitleAr: certificate.program?.titleAr,
    category: certificate.program?.category,
    categoryAr: certificate.program?.categoryAr,
    issuedAt: certificate.issuedAt,
    expiresAt: certificate.expiresAt,
    isExpired: Boolean(certificate.expiresAt && certificate.expiresAt <= new Date()),
  };
};

// Full achievement history for one learner — used by both the learner's own
// "Achievements" page and the admin's learner-detail view. Attempt numbers are
// computed per-program (attempt #1, #2... for that specific course's quiz),
// not globally, so they match what the learner sees on their own quiz results.
const getAchievements = async (learnerId) => {
  const [user, enrollments, attempts, certificates] = await Promise.all([
    MwasalatUser.findById(learnerId).select('name email points'),
    MwasalatEnrollment.find({ learner: learnerId }).populate('program', 'title category titleAr categoryAr').sort({ purchasedAt: -1 }),
    MwasalatQuizAttempt.find({ learner: learnerId }).populate('program', 'title titleAr').sort({ attemptedAt: -1 }),
    MwasalatCertificate.find({ learner: learnerId }).populate('program', 'title category titleAr categoryAr').sort({ issuedAt: -1 }),
  ]);

  const attemptNumberById = {};
  const perProgramCount = {};
  [...attempts].sort((a, b) => a.attemptedAt - b.attemptedAt).forEach((a) => {
    const key = a.program?._id?.toString();
    perProgramCount[key] = (perProgramCount[key] ?? 0) + 1;
    attemptNumberById[a._id.toString()] = perProgramCount[key];
  });

  return {
    learner: user ? { name: user.name, email: user.email } : null,
    points: user?.points ?? 0,
    totalCourses: enrollments.length,
    totalCertificates: certificates.length,
    totalAttempts: attempts.length,
    enrollments: enrollments.map((e) => ({
      _id: e._id, program: e.program, status: e.status, purchasedAt: e.purchasedAt, completedAt: e.completedAt,
    })),
    attempts: attempts.map((a) => ({
      _id: a._id, program: a.program, score: a.score, passed: a.passed, attemptedAt: a.attemptedAt,
      attemptNumber: attemptNumberById[a._id.toString()],
    })),
    certificates: certificates.map((c) => ({
      _id: c._id, program: c.program, issuedAt: c.issuedAt, certificateNumber: formatCertificateNumber(c._id),
      expiresAt: c.expiresAt, isExpired: Boolean(c.expiresAt && c.expiresAt <= new Date()),
    })),
  };
};

const CONTENT_TYPE_LABELS = { pdf: 'PDF', recording: 'Recording', live: 'Live', ilt: 'ILT' };

// Real platform-wide stats for the super admin dashboard — replaces the old
// hardcoded/placeholder numbers with live counts and aggregates.
const getAdminOverview = async () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalLearners, totalInstructors, activePrograms, draftPrograms, totalCertificates,
    certificatesIssuedToday, certificatesIssuedThisMonth, newLearnersThisMonth, programs,
  ] = await Promise.all([
    MwasalatUser.countDocuments({ role: MWASALAT_ROLES.LEARNER }),
    MwasalatUser.countDocuments({ role: MWASALAT_ROLES.INSTRUCTOR }),
    MwasalatProgram.countDocuments({ status: PROGRAM_STATUS.ACTIVE }),
    MwasalatProgram.countDocuments({ status: PROGRAM_STATUS.DRAFT }),
    MwasalatCertificate.countDocuments({}),
    MwasalatCertificate.countDocuments({ issuedAt: { $gte: todayStart } }),
    MwasalatCertificate.countDocuments({ issuedAt: { $gte: monthStart } }),
    MwasalatUser.countDocuments({ role: MWASALAT_ROLES.LEARNER, createdAt: { $gte: monthStart } }),
    MwasalatProgram.find({ status: { $ne: PROGRAM_STATUS.ARCHIVED } }, { contentTypes: 1 }),
  ]);

  const typeCounts = {};
  programs.forEach((p) => {
    (p.contentTypes || []).forEach((t) => {
      typeCounts[t] = (typeCounts[t] ?? 0) + 1;
    });
  });
  const programsByType = Object.entries(typeCounts).map(([type, value]) => ({
    label: CONTENT_TYPE_LABELS[type] ?? type,
    value,
  }));

  // Weekly new-learner signups for the last 8 weeks, oldest first.
  const weeks = [];
  for (let i = 7; i >= 0; i -= 1) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (i * 7 + start.getDay()));
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    weeks.push({ start, end });
  }
  const weeklySignups = await Promise.all(
    weeks.map(({ start, end }) => MwasalatUser.countDocuments({
      role: MWASALAT_ROLES.LEARNER, createdAt: { $gte: start, $lt: end },
    }))
  );

  // Same 8-week windows, for the Certificates stat card's sparkline.
  const weeklyCertificates = await Promise.all(
    weeks.map(({ start, end }) => MwasalatCertificate.countDocuments({ issuedAt: { $gte: start, $lt: end } }))
  );

  // Platform-wide completion funnel — where learners drop off between enrolling
  // and finishing a course. Same three-stage shape regardless of whether a
  // program has a quiz, since "completed" already accounts for that per-enrollment.
  const [totalEnrolled, openedContent, completedEnrollments] = await Promise.all([
    MwasalatEnrollment.countDocuments({}),
    MwasalatEnrollment.countDocuments({ contentOpenedAt: { $ne: null } }),
    MwasalatEnrollment.countDocuments({ status: ENROLLMENT_STATUS.COMPLETED }),
  ]);
  const funnel = [
    { label: 'Enrolled', value: totalEnrolled },
    { label: 'Opened Content', value: openedContent },
    { label: 'Completed', value: completedEnrollments },
  ];

  return {
    totalLearners, totalInstructors, activePrograms, draftPrograms, totalCertificates,
    certificatesIssuedToday, certificatesIssuedThisMonth, newLearnersThisMonth,
    programsByType, weeklySignups, weeklyCertificates, funnel,
  };
};

// Top 5 courses ranked by completion rate (completed / total enrollments) —
// backs the admin dashboard's "Top Performing Courses" panel. Courses with no
// enrollments are excluded (an undefined rate isn't a ranking).
const getTopCoursesByCompletionRate = async () => {
  const enrollments = await MwasalatEnrollment.find({}, 'program status');

  const statsByProgram = {};
  enrollments.forEach((e) => {
    const key = e.program.toString();
    if (!statsByProgram[key]) statsByProgram[key] = { total: 0, completed: 0 };
    statsByProgram[key].total += 1;
    if (e.status === ENROLLMENT_STATUS.COMPLETED) statsByProgram[key].completed += 1;
  });

  const ranked = Object.entries(statsByProgram)
    .map(([programId, { total, completed }]) => ({
      programId, totalEnrolled: total, completionRate: Math.round((completed / total) * 100),
    }))
    .sort((a, b) => b.completionRate - a.completionRate || b.totalEnrolled - a.totalEnrolled)
    .slice(0, 5);

  const programs = await MwasalatProgram.find({ _id: { $in: ranked.map((r) => r.programId) } }, 'title titleAr');
  const titleById = Object.fromEntries(programs.map((p) => [p._id.toString(), { title: p.title, titleAr: p.titleAr }]));

  return ranked.map((r) => ({
    programId: r.programId,
    title: titleById[r.programId]?.title ?? 'Untitled program',
    titleAr: titleById[r.programId]?.titleAr,
    completionRate: r.completionRate,
    totalEnrolled: r.totalEnrolled,
  }));
};

// Next few scheduled live/ILT sessions across the platform, soonest first —
// backs the admin dashboard's "Upcoming Classes" panel.
const getUpcomingClasses = async () => {
  const now = new Date();
  const programs = await MwasalatProgram.find({
    status: { $ne: PROGRAM_STATUS.ARCHIVED },
    $or: [
      { contentTypes: CONTENT_TYPES.LIVE, liveScheduledAt: { $gte: now } },
      { contentTypes: CONTENT_TYPES.ILT, iltScheduledAt: { $gte: now } },
    ],
  }).populate('instructor', 'name').limit(30);

  const sessions = programs
    .map((p) => {
      const isLive = p.contentTypes.includes(CONTENT_TYPES.LIVE) && p.liveScheduledAt && p.liveScheduledAt >= now;
      const scheduledAt = isLive ? p.liveScheduledAt : p.iltScheduledAt;
      return {
        programId: p._id, title: p.title, titleAr: p.titleAr,
        instructor: p.instructor?.name, scheduledAt, type: isLive ? 'live' : 'ilt',
      };
    })
    .filter((s) => s.scheduledAt)
    .sort((a, b) => a.scheduledAt - b.scheduledAt)
    .slice(0, 5);

  const programIds = sessions.map((s) => s.programId);
  const counts = await MwasalatEnrollment.aggregate([
    { $match: { program: { $in: programIds } } },
    { $group: { _id: '$program', count: { $sum: 1 } } },
  ]);
  const countByProgram = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));

  return sessions.map((s) => ({ ...s, enrolledCount: countByProgram[s.programId.toString()] ?? 0 }));
};

// Instructor-scoped, today-only version of the panel above — backs the
// "Today's Schedule" widget on the instructor dashboard. Unlike
// getUpcomingClasses (next 5 sessions platform-wide, future only), this
// returns every live/ILT session this instructor has scheduled for the
// current calendar day, including ones already started.
const getMyTodaySchedule = async (instructorId) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + DAY_MS);

  const programs = await MwasalatProgram.find({
    instructor: instructorId,
    status: { $ne: PROGRAM_STATUS.ARCHIVED },
    $or: [
      { contentTypes: CONTENT_TYPES.LIVE, liveScheduledAt: { $gte: startOfDay, $lt: endOfDay } },
      { contentTypes: CONTENT_TYPES.ILT, iltScheduledAt: { $gte: startOfDay, $lt: endOfDay } },
    ],
  });

  const sessions = programs
    .map((p) => {
      const isLive = p.contentTypes.includes(CONTENT_TYPES.LIVE)
        && p.liveScheduledAt && p.liveScheduledAt >= startOfDay && p.liveScheduledAt < endOfDay;
      const scheduledAt = isLive ? p.liveScheduledAt : p.iltScheduledAt;
      return {
        programId: p._id, title: p.title, titleAr: p.titleAr,
        scheduledAt, type: isLive ? 'live' : 'ilt', venue: p.iltVenue,
      };
    })
    .filter((s) => s.scheduledAt)
    .sort((a, b) => a.scheduledAt - b.scheduledAt);

  const programIds = sessions.map((s) => s.programId);
  const counts = await MwasalatEnrollment.aggregate([
    { $match: { program: { $in: programIds } } },
    { $group: { _id: '$program', count: { $sum: 1 } } },
  ]);
  const countByProgram = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));

  return sessions.map((s) => ({ ...s, enrolledCount: countByProgram[s.programId.toString()] ?? 0 }));
};

// Unified "what's happening" feed for the admin dashboard's "Today's
// Activities" panel — merges recent enrollments (new + completed),
// certificates issued, and the admin activity log into one time-sorted feed.
// Payments are deliberately excluded — the dashboard's Recent Payments table
// covers that ground directly, so including them here would just duplicate it.
// Each item carries a `type` so the frontend can pick an icon/color without
// re-deriving it; this is a read-only display merge, not a write to the
// activity-log audit trail itself.
const getRecentActivityFeed = async (limit = 8) => {
  const [enrollments, certificates, adminLogResult] = await Promise.all([
    MwasalatEnrollment.find({}).populate('learner', 'name').populate('program', 'title titleAr').sort({ purchasedAt: -1 }).limit(limit),
    MwasalatCertificate.find({}).populate('learner', 'name').populate('program', 'title titleAr').sort({ issuedAt: -1 }).limit(limit),
    mwasalatActivityLogService.list({ limit }),
  ]);

  const items = [];

  enrollments.forEach((e) => {
    items.push({ type: 'enrolled', at: e.purchasedAt, learner: e.learner?.name, program: e.program?.title });
    if (e.status === ENROLLMENT_STATUS.COMPLETED && e.completedAt) {
      items.push({ type: 'completed', at: e.completedAt, learner: e.learner?.name, program: e.program?.title });
    }
  });

  certificates.forEach((c) => {
    items.push({ type: 'certificate', at: c.issuedAt, learner: c.learner?.name, program: c.program?.title });
  });

  adminLogResult.logs.forEach((log) => {
    items.push({
      type: 'admin', at: log.createdAt, action: log.action,
      actorName: log.actorName, metadata: log.metadata,
    });
  });

  return items
    .filter((i) => i.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, limit);
};

// All certificates issued platform-wide — backs the admin's "Certificates Issued" drill-down.
const listAllCertificates = async () => {
  const certificates = await MwasalatCertificate.find({})
    .populate('learner', 'name email')
    .populate('program', 'title category titleAr categoryAr')
    .sort({ issuedAt: -1 });

  return certificates.map((c) => ({
    _id: c._id,
    learner: c.learner,
    program: c.program,
    issuedAt: c.issuedAt,
    certificateNumber: formatCertificateNumber(c._id),
    expiresAt: c.expiresAt,
    isExpired: Boolean(c.expiresAt && c.expiresAt <= new Date()),
  }));
};

// Every program regardless of status (active/expired/archived/draft) — backs
// the admin Programs page, unlike listPublic() which deliberately hides
// anything not currently active. Ratings are batched from a single feedback
// fetch (same "one query + JS reduction" style as getAdminOverview) rather
// than N+1 queries per card.
const listAllForAdmin = async () => {
  const [programs, feedback] = await Promise.all([
    MwasalatProgram.find({}).populate('instructor', 'name email').sort({ createdAt: -1 }),
    MwasalatFeedback.find({}, { program: 1, courseRating: 1 }),
  ]);

  const ratingsByProgram = {};
  feedback.forEach((f) => {
    const key = f.program.toString();
    if (!ratingsByProgram[key]) ratingsByProgram[key] = [];
    ratingsByProgram[key].push(f.courseRating);
  });

  const now = new Date();
  return programs.map((p) => {
    const ratings = ratingsByProgram[p._id.toString()] ?? [];
    const isExpired = p.status !== PROGRAM_STATUS.ARCHIVED && p.expiryDate && p.expiryDate < now;
    return {
      _id: p._id,
      title: p.title,
      titleAr: p.titleAr,
      description: p.description,
      descriptionAr: p.descriptionAr,
      category: p.category,
      categoryAr: p.categoryAr,
      subCategory: p.subCategory,
      subCategoryAr: p.subCategoryAr,
      contentTypes: p.contentTypes,
      duration: p.duration,
      durationAr: p.durationAr,
      price: p.price,
      instructor: p.instructor,
      createdAt: p.createdAt,
      expiryDate: p.expiryDate,
      status: isExpired ? 'expired' : p.status,
      avgRating: ratings.length ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10 : null,
      feedbackCount: ratings.length,
    };
  });
};

// One instructor's full picture for the admin Instructor detail page: contact
// info + every program they've created, each with its own enrollment/rating
// stats, plus platform-wide totals across all of them.
const getInstructorDetail = async (instructorId) => {
  const [instructor, programs] = await Promise.all([
    MwasalatUser.findById(instructorId).select('name email createdAt isActive lastLogin'),
    MwasalatProgram.find({ instructor: instructorId }).sort({ createdAt: -1 }),
  ]);
  if (!instructor) throw new AppError('Instructor not found', 404);

  const programIds = programs.map((p) => p._id);
  const [enrollments, feedback, certificatesIssued] = await Promise.all([
    MwasalatEnrollment.find({ program: { $in: programIds } }, { program: 1, learner: 1 }),
    MwasalatFeedback.find({ program: { $in: programIds } }, { program: 1, courseRating: 1 }),
    MwasalatCertificate.countDocuments({ program: { $in: programIds } }),
  ]);

  const enrollmentsByProgram = {};
  const distinctLearners = new Set();
  enrollments.forEach((e) => {
    const key = e.program.toString();
    enrollmentsByProgram[key] = (enrollmentsByProgram[key] ?? 0) + 1;
    distinctLearners.add(e.learner.toString());
  });

  const ratingsByProgram = {};
  feedback.forEach((f) => {
    const key = f.program.toString();
    if (!ratingsByProgram[key]) ratingsByProgram[key] = [];
    ratingsByProgram[key].push(f.courseRating);
  });

  const now = new Date();
  const mappedPrograms = programs.map((p) => {
    const key = p._id.toString();
    const ratings = ratingsByProgram[key] ?? [];
    const isExpired = p.status !== PROGRAM_STATUS.ARCHIVED && p.expiryDate && p.expiryDate < now;
    return {
      _id: p._id,
      title: p.title,
      titleAr: p.titleAr,
      description: p.description,
      descriptionAr: p.descriptionAr,
      category: p.category,
      categoryAr: p.categoryAr,
      subCategory: p.subCategory,
      subCategoryAr: p.subCategoryAr,
      contentTypes: p.contentTypes,
      duration: p.duration,
      durationAr: p.durationAr,
      price: p.price,
      instructor: { _id: instructor._id, name: instructor.name, email: instructor.email },
      createdAt: p.createdAt,
      expiryDate: p.expiryDate,
      status: isExpired ? 'expired' : p.status,
      enrolledCount: enrollmentsByProgram[key] ?? 0,
      avgRating: ratings.length ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10 : null,
      feedbackCount: ratings.length,
    };
  });

  const allRatings = feedback.map((f) => f.courseRating);

  return {
    instructor: {
      _id: instructor._id, name: instructor.name, email: instructor.email,
      createdAt: instructor.createdAt, isActive: instructor.isActive, lastLogin: instructor.lastLogin,
    },
    totalPrograms: programs.length,
    totalLearners: distinctLearners.size,
    avgRating: allRatings.length ? Math.round((allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length) * 10) / 10 : null,
    certificatesIssued,
    programs: mappedPrograms,
  };
};

// Lightweight per-instructor totals for the admin Instructors table — program
// count + avg rating for every instructor in one batch, not one query per row.
const listInstructorSummaries = async () => {
  const [programs, feedback] = await Promise.all([
    MwasalatProgram.find({}, { instructor: 1 }),
    MwasalatFeedback.find({}, { program: 1, courseRating: 1 }),
  ]);

  const instructorByProgram = {};
  const totalsByInstructor = {};
  programs.forEach((p) => {
    const instructorKey = p.instructor.toString();
    instructorByProgram[p._id.toString()] = instructorKey;
    totalsByInstructor[instructorKey] = totalsByInstructor[instructorKey] ?? { totalPrograms: 0, ratings: [] };
    totalsByInstructor[instructorKey].totalPrograms += 1;
  });
  feedback.forEach((f) => {
    const instructorKey = instructorByProgram[f.program.toString()];
    if (!instructorKey || !totalsByInstructor[instructorKey]) return;
    totalsByInstructor[instructorKey].ratings.push(f.courseRating);
  });

  const summaries = {};
  Object.entries(totalsByInstructor).forEach(([instructorId, { totalPrograms, ratings }]) => {
    summaries[instructorId] = {
      totalPrograms,
      avgRating: ratings.length ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10 : null,
    };
  });
  return summaries;
};

// Marks that the learner has opened a specific content type (PDF/recording/
// live/ILT). `contentOpenedAt` — which gates the assessment — is only set once
// EVERY content type on the course has been opened at least once, not just
// one of them, so a course combining e.g. PDF + Recording can't unlock the
// quiz after only the PDF was viewed.
const markContentOpened = async (learnerId, programId, contentType) => {
  const [enrollment, program] = await Promise.all([
    MwasalatEnrollment.findOne({ learner: learnerId, program: programId }),
    MwasalatProgram.findById(programId),
  ]);
  if (!enrollment) throw new AppError('You must be enrolled in this course', 403);

  const opened = new Set(enrollment.openedContentTypes ?? []);

  // Multi-day PDF courses build up 'pdf' credit one calendar day at a time — it
  // only joins `opened` (and can complete the course) once the learner has
  // opened it on pdfDurationDays distinct days, instead of on the first open.
  if (contentType === CONTENT_TYPES.PDF && program?.pdfDurationDays > 0) {
    const todayKey = new Date().toISOString().slice(0, 10);
    const days = new Set(enrollment.pdfOpenedDates ?? []);
    days.add(todayKey);
    enrollment.pdfOpenedDates = [...days];
    if (enrollment.pdfOpenedDates.length >= program.pdfDurationDays) opened.add(CONTENT_TYPES.PDF);
  } else if (contentType) {
    opened.add(contentType);
  }
  enrollment.openedContentTypes = [...opened];

  const allTypes = program?.contentTypes ?? [];
  const fullyOpened = allTypes.length > 0 && allTypes.every((t) => opened.has(t));
  if (fullyOpened && !enrollment.contentOpenedAt) {
    enrollment.contentOpenedAt = new Date();
  }

  await registerActivity(programId, enrollment);
  return {
    contentOpened: Boolean(enrollment.contentOpenedAt),
    openedContentTypes: enrollment.openedContentTypes,
    pdfOpenedDates: enrollment.pdfOpenedDates,
  };
};

// Uploaded videos are stored 'authenticated' — no permanent public URL — so the
// learner/instructor's player fetches a freshly-signed, short-lived URL each time
// instead of the program document embedding one that would work forever once seen.
const getVideoUrl = async (requesterId, programId) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  if (!program.recordingVideoPublicId) throw new AppError('This course has no uploaded video', 404);

  const enrollment = await MwasalatEnrollment.findOne({ learner: requesterId, program: programId });
  const isOwner = String(program.instructor) === String(requesterId);
  if (!enrollment && !isOwner) throw new AppError('You must be enrolled in this course to watch it', 403);

  const url = cloudinary.url(program.recordingVideoPublicId, {
    resource_type: 'video',
    type: 'authenticated',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 2 * 60 * 60, // 2 hours
  });

  return {
    url,
    durationSeconds: program.recordingVideoDurationSeconds,
    furthestSeconds: enrollment?.videoFurthestSeconds ?? 0,
  };
};

// Furthest-position watch tracking for an uploaded video — only ever moves forward,
// so rewatching/seeking backward never reduces recorded progress. Crossing ~90% grants
// the same "content opened" credit the PDF finish-button flow already uses.
const updateVideoProgress = async (learnerId, programId, positionSeconds, durationSeconds) => {
  const enrollment = await MwasalatEnrollment.findOne({ learner: learnerId, program: programId });
  if (!enrollment) throw new AppError('You must be enrolled in this course', 403);

  enrollment.videoFurthestSeconds = Math.max(enrollment.videoFurthestSeconds ?? 0, positionSeconds ?? 0);
  await registerActivity(programId, enrollment);

  const watchedEnough = durationSeconds > 0 && enrollment.videoFurthestSeconds >= durationSeconds * 0.9;
  if (watchedEnough) {
    await markContentOpened(learnerId, programId, CONTENT_TYPES.RECORDING);
  }

  return { videoFurthestSeconds: enrollment.videoFurthestSeconds, watchedEnough };
};

const getStats = async (programId) => {
  const [total, completed, feedback, activeEnrollments, returnedThisWeek] = await Promise.all([
    MwasalatEnrollment.countDocuments({ program: programId }),
    MwasalatEnrollment.countDocuments({ program: programId, status: ENROLLMENT_STATUS.COMPLETED }),
    MwasalatFeedback.find({ program: programId }),
    MwasalatEnrollment.find({ program: programId, status: { $ne: ENROLLMENT_STATUS.COMPLETED } }, 'riskLevel'),
    MwasalatEnrollment.countDocuments({ program: programId, returnedAt: { $gte: new Date(Date.now() - 7 * DAY_MS) } }),
  ]);

  const avgCourseRating = feedback.length
    ? feedback.reduce((sum, f) => sum + f.courseRating, 0) / feedback.length
    : null;
  const avgInstructorRating = feedback.length
    ? feedback.reduce((sum, f) => sum + f.instructorRating, 0) / feedback.length
    : null;
  const atRiskCount = activeEnrollments.filter((e) => e.riskLevel && e.riskLevel !== 'on_track').length;

  return {
    totalEnrolled: total,
    totalCompleted: completed,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
    avgCourseRating,
    avgInstructorRating,
    feedbackCount: feedback.length,
    atRiskCount,
    returnedThisWeek,
  };
};

// Weekly per-course email digest for every instructor with at least one
// active program — reuses getStats' numbers plus a fresh enrollment count
// for the week, matching instructorWeeklyDigestTemplate's fields.
const sendWeeklyInstructorDigests = async () => {
  const programs = await MwasalatProgram.find({ status: PROGRAM_STATUS.ACTIVE }).populate('instructor', 'name email');
  let sent = 0;

  for (const program of programs) {
    if (!program.instructor?.email) continue; // eslint-disable-line no-continue

    // eslint-disable-next-line no-await-in-loop
    const [stats, newEnrollments] = await Promise.all([
      getStats(program._id),
      MwasalatEnrollment.countDocuments({ program: program._id, purchasedAt: { $gte: new Date(Date.now() - 7 * DAY_MS) } }),
    ]);

    // eslint-disable-next-line no-await-in-loop
    await sendEmail({
      to: program.instructor.email,
      subject: `Weekly digest — ${program.title}`,
      html: instructorWeeklyDigestTemplate({
        name: program.instructor.name,
        courseTitle: program.title,
        newEnrollments,
        atRiskCount: stats.atRiskCount,
        returnedCount: stats.returnedThisWeek,
        completionRate: stats.completionRate,
      }),
    }).catch((err) => logger.error(`[mwasalat-program] Weekly digest email failed for ${program.instructor.email}: ${err.message}`));
    sent += 1;
  }

  return sent;
};

// Daily sweep — emails + in-app-notifies learners whose certificate expires within
// the next 30 days, once each (guarded by expiryReminderSentAt). Threshold-based
// like archiveExpired, rather than an exact "expires in exactly 30 days" match, so a
// missed cron run still catches the reminder on the next pass instead of silently
// skipping it.
const sendCertificateExpiryReminders = async () => {
  const now = new Date();
  const reminderCutoff = new Date(now.getTime() + 30 * DAY_MS);

  const dueCertificates = await MwasalatCertificate.find({
    expiresAt: { $gt: now, $lte: reminderCutoff },
    expiryReminderSentAt: null,
  })
    .populate('learner', 'name email')
    .populate('program', 'title instructor');

  let sent = 0;
  for (const certificate of dueCertificates) {
    if (certificate.learner?.email) {
      // eslint-disable-next-line no-await-in-loop
      await sendEmail({
        to: certificate.learner.email,
        subject: `Your certificate for ${certificate.program?.title} expires soon`,
        html: certificateExpiringTemplate({
          name: certificate.learner.name,
          courseTitle: certificate.program?.title,
          certificateNumber: formatCertificateNumber(certificate._id),
          expiresAt: certificate.expiresAt,
          certificateUrl: `${process.env.CLIENT_URL}/mwasalat/learner/programs/${certificate.program?._id}/certificate`,
        }),
      }).catch((err) => logger.error(`[mwasalat-program] Certificate expiry email failed for ${certificate.learner.email}: ${err.message}`));
    }

    if (certificate.learner?._id) {
      // eslint-disable-next-line no-await-in-loop
      await mwasalatNotificationService.notifyUsers(certificate.program?.instructor, [certificate.learner._id], {
        title: 'Certificate expiring soon',
        message: `Your certificate for "${certificate.program?.title}" expires on ${certificate.expiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Renew the course to keep it valid.`,
      }).catch((err) => logger.error(`[mwasalat-program] Certificate expiry notification failed for learner ${certificate.learner._id}: ${err.message}`));
    }

    certificate.expiryReminderSentAt = now;
    // eslint-disable-next-line no-await-in-loop
    await certificate.save();
    sent += 1;
  }

  return sent;
};

export const mwasalatProgramService = {
  aiAutofill, createLiveMeeting, create, update, remove, archiveExpired, listMine, listPublic, enroll, listMyEnrollments, toggleStar,
  getById, getLearners, getMyRoster, getFeedback, getStats, checkIn, markAttendance, getAttendance,
  submitFeedback, getCompletionStatus, maybeCompleteEnrollment, markContentOpened, getMyCertificate, verifyCertificate, getAchievements,
  getVideoUrl, updateVideoProgress, sendCertificateExpiryReminders,
  registerActivity, computeEngagementAndNudge, sendEncouragement, sendWeeklyInstructorDigests,
  getAdminOverview, listAllCertificates, listAllForAdmin, getInstructorDetail, listInstructorSummaries,
  getTopCoursesByCompletionRate, getUpcomingClasses, getMyTodaySchedule, getRecentActivityFeed,
};
