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
import { certificateIssuedTemplate } from '../mwasalatUser/mwasalatEmailTemplates.js';
import logger from '../../utils/logger.js';
import { mwasalatActivityLogService } from '../mwasalatActivityLog/mwasalatActivityLog.service.js';
import { mwasalatNotificationService } from '../mwasalatNotification/mwasalatNotification.service.js';

const formatCertificateNumber = (certificateId) => `MWL-${certificateId.toString().slice(-8).toUpperCase()}`;

const aiAutofill = async (title) => {
  if (!title?.trim()) throw new AppError('Title is required for autofill', 400);
  return suggestFromTitle(title.trim());
};

const create = async (instructorId, data, pdfFile, videoFile, actor) => {
  const {
    title, category, subCategory, description, duration, price, expiryDate,
    recordingLink, liveScheduledAt, liveMeetingLink, iltVenue, iltScheduledAt,
  } = data;

  const contentTypes = JSON.parse(data.contentTypes ?? '[]');
  if (!contentTypes.length) throw new AppError('Select at least one content type', 400);

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
    title, category, subCategory, description, contentTypes, duration, price,
    expiryDate: expiryDate || undefined,
    pdfUrl,
    recordingLink: contentTypes.includes(CONTENT_TYPES.RECORDING) && !videoFile ? recordingLink : undefined,
    recordingVideoPublicId,
    recordingVideoDurationSeconds,
    liveScheduledAt: contentTypes.includes(CONTENT_TYPES.LIVE) ? liveScheduledAt : undefined,
    liveMeetingLink: contentTypes.includes(CONTENT_TYPES.LIVE) ? liveMeetingLink : undefined,
    iltVenue: contentTypes.includes(CONTENT_TYPES.ILT) ? iltVenue : undefined,
    iltScheduledAt: contentTypes.includes(CONTENT_TYPES.ILT) ? iltScheduledAt : undefined,
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

const listPublic = async () => {
  const now = new Date();
  return MwasalatProgram.find({
    status: PROGRAM_STATUS.ACTIVE,
    $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }],
  })
    .populate('instructor', 'name')
    .sort({ createdAt: -1 });
};

const assertOwnership = (program, requesterId, requesterRole) => {
  if (requesterRole === MWASALAT_ROLES.SUPER_ADMIN) return;
  if (String(program.instructor) !== String(requesterId)) {
    throw new AppError('You do not have permission to modify this course', 403);
  }
};

const EDITABLE_FIELDS = [
  'title', 'category', 'subCategory', 'description', 'duration', 'price', 'expiryDate',
  'recordingLink', 'liveScheduledAt', 'liveMeetingLink', 'iltVenue', 'iltScheduledAt',
];

const update = async (requesterId, requesterRole, programId, data, actor) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  assertOwnership(program, requesterId, requesterRole);

  for (const field of EDITABLE_FIELDS) {
    if (data[field] !== undefined) program[field] = data[field] || undefined;
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
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);

  const existing = await MwasalatEnrollment.findOne({ learner: learnerId, program: programId });
  if (existing) throw new AppError('You are already enrolled in this program', 409);

  return MwasalatEnrollment.create({ learner: learnerId, program: programId });
};

const listMyEnrollments = async (learnerId) => {
  return MwasalatEnrollment.find({ learner: learnerId })
    .populate('program')
    .sort({ createdAt: -1 });
};

const getById = async (id) => {
  const program = await MwasalatProgram.findById(id).populate('instructor', 'name email');
  if (!program) throw new AppError('Program not found', 404);
  return program;
};

const getLearners = async (programId) => {
  return MwasalatEnrollment.find({ program: programId })
    .populate('learner', 'name email')
    .sort({ createdAt: -1 });
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

  const certificate = await MwasalatCertificate.create({ learner: learnerId, program: programId, issuedAt: new Date() });

  const [learner, program] = await Promise.all([
    MwasalatUser.findById(learnerId),
    MwasalatProgram.findById(programId),
  ]);

  if (learner?.email) {
    sendEmail({
      to: learner.email,
      subject: `You earned a certificate — ${program?.title}`,
      html: certificateIssuedTemplate({
        name: learner.name,
        courseTitle: program?.title,
        certificateNumber: formatCertificateNumber(certificate._id),
        issuedAt: certificate.issuedAt,
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

  await maybeCompleteEnrollment(learnerId, programId);
  return feedback;
};

const getCompletionStatus = async (learnerId, programId) => {
  const [enrollment, hasQuiz, passingAttempt, feedback, certificate] = await Promise.all([
    MwasalatEnrollment.findOne({ learner: learnerId, program: programId }),
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
    certificateNumber: formatCertificateNumber(certificate._id),
    issuedAt: certificate.issuedAt,
    learnerName: learner?.name,
    courseTitle: program?.title,
    category: program?.category,
    instructorName: program?.instructor?.name,
  };
};

// Full achievement history for one learner — used by both the learner's own
// "Achievements" page and the admin's learner-detail view. Attempt numbers are
// computed per-program (attempt #1, #2... for that specific course's quiz),
// not globally, so they match what the learner sees on their own quiz results.
const getAchievements = async (learnerId) => {
  const [user, enrollments, attempts, certificates] = await Promise.all([
    MwasalatUser.findById(learnerId).select('name email points'),
    MwasalatEnrollment.find({ learner: learnerId }).populate('program', 'title category').sort({ purchasedAt: -1 }),
    MwasalatQuizAttempt.find({ learner: learnerId }).populate('program', 'title').sort({ attemptedAt: -1 }),
    MwasalatCertificate.find({ learner: learnerId }).populate('program', 'title category').sort({ issuedAt: -1 }),
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
    })),
  };
};

const CONTENT_TYPE_LABELS = { pdf: 'PDF', recording: 'Recording', live: 'Live', ilt: 'ILT' };

// Real platform-wide stats for the super admin dashboard — replaces the old
// hardcoded/placeholder numbers with live counts and aggregates.
const getAdminOverview = async () => {
  const [totalLearners, totalInstructors, activePrograms, totalCertificates, programs] = await Promise.all([
    MwasalatUser.countDocuments({ role: MWASALAT_ROLES.LEARNER }),
    MwasalatUser.countDocuments({ role: MWASALAT_ROLES.INSTRUCTOR }),
    MwasalatProgram.countDocuments({ status: PROGRAM_STATUS.ACTIVE }),
    MwasalatCertificate.countDocuments({}),
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
    totalLearners, totalInstructors, activePrograms, totalCertificates, programsByType, weeklySignups, funnel,
  };
};

// All certificates issued platform-wide — backs the admin's "Certificates Issued" drill-down.
const listAllCertificates = async () => {
  const certificates = await MwasalatCertificate.find({})
    .populate('learner', 'name email')
    .populate('program', 'title category')
    .sort({ issuedAt: -1 });

  return certificates.map((c) => ({
    _id: c._id,
    learner: c.learner,
    program: c.program,
    issuedAt: c.issuedAt,
    certificateNumber: formatCertificateNumber(c._id),
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
      description: p.description,
      category: p.category,
      subCategory: p.subCategory,
      contentTypes: p.contentTypes,
      duration: p.duration,
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
      description: p.description,
      category: p.category,
      subCategory: p.subCategory,
      contentTypes: p.contentTypes,
      duration: p.duration,
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
  if (contentType) opened.add(contentType);
  enrollment.openedContentTypes = [...opened];

  const allTypes = program?.contentTypes ?? [];
  const fullyOpened = allTypes.length > 0 && allTypes.every((t) => opened.has(t));
  if (fullyOpened && !enrollment.contentOpenedAt) {
    enrollment.contentOpenedAt = new Date();
  }

  await enrollment.save();
  return { contentOpened: Boolean(enrollment.contentOpenedAt), openedContentTypes: enrollment.openedContentTypes };
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
  await enrollment.save();

  const watchedEnough = durationSeconds > 0 && enrollment.videoFurthestSeconds >= durationSeconds * 0.9;
  if (watchedEnough) {
    await markContentOpened(learnerId, programId, CONTENT_TYPES.RECORDING);
  }

  return { videoFurthestSeconds: enrollment.videoFurthestSeconds, watchedEnough };
};

const getStats = async (programId) => {
  const [total, completed, feedback] = await Promise.all([
    MwasalatEnrollment.countDocuments({ program: programId }),
    MwasalatEnrollment.countDocuments({ program: programId, status: ENROLLMENT_STATUS.COMPLETED }),
    MwasalatFeedback.find({ program: programId }),
  ]);

  const avgCourseRating = feedback.length
    ? feedback.reduce((sum, f) => sum + f.courseRating, 0) / feedback.length
    : null;
  const avgInstructorRating = feedback.length
    ? feedback.reduce((sum, f) => sum + f.instructorRating, 0) / feedback.length
    : null;

  return {
    totalEnrolled: total,
    totalCompleted: completed,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
    avgCourseRating,
    avgInstructorRating,
    feedbackCount: feedback.length,
  };
};

export const mwasalatProgramService = {
  aiAutofill, create, update, remove, archiveExpired, listMine, listPublic, enroll, listMyEnrollments,
  getById, getLearners, getFeedback, getStats, checkIn, markAttendance, getAttendance,
  submitFeedback, getCompletionStatus, maybeCompleteEnrollment, markContentOpened, getMyCertificate, getAchievements,
  getVideoUrl, updateVideoProgress,
  getAdminOverview, listAllCertificates, listAllForAdmin, getInstructorDetail, listInstructorSummaries,
};
