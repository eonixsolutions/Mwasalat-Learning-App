import mongoose from 'mongoose';
import MwasalatProgram from './mwasalatProgram.model.js';
import MwasalatEnrollment from './mwasalatEnrollment.model.js';
import MwasalatFeedback from './mwasalatFeedback.model.js';
import MwasalatAttendance from './mwasalatAttendance.model.js';
import MwasalatCertificate from './mwasalatCertificate.model.js';
import MwasalatQuiz from '../mwasalatQuiz/mwasalatQuiz.model.js';
import MwasalatQuizAttempt from '../mwasalatQuiz/mwasalatQuizAttempt.model.js';
import MwasalatAssignment from '../mwasalatAssignment/mwasalatAssignment.model.js';
import MwasalatAssignmentSubmission from '../mwasalatAssignment/mwasalatAssignmentSubmission.model.js';
import MwasalatUser from '../mwasalatUser/mwasalatUser.model.js';
import MwasalatCategory from '../mwasalatCategory/mwasalatCategory.model.js';
import MwasalatDepartment from '../mwasalatDepartment/mwasalatDepartment.model.js';
import MwasalatGroup from '../mwasalatGroup/mwasalatGroup.model.js';
import { AppError } from '../../utils/AppError.js';
import { ENROLLMENT_STATUS, PROGRAM_STATUS, PROGRAM_AUDIENCE, CONTENT_TYPES, LESSON_TYPES, SEAT_CONSUMING_STATUSES, ACCESS_GRANTED_STATUSES, ACTIVE_ENROLLMENT_STATUSES, COURSE_DELETION_GRACE_DAYS } from './mwasalatProgram.constants.js';
import { MWASALAT_ROLES, MWASALAT_LEARNER_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';
import { mwasalatDepartmentScope } from '../mwasalatUser/mwasalatDepartmentScope.js';
import { suggestFromTitle } from './mwasalatProgram.suggestions.js';
import cloudinary, { uploadBuffer } from '../../config/cloudinary.js';
import { sendEmail } from '../../utils/mailer.js';
import { certificateIssuedTemplate, certificateExpiringTemplate, reengagementTemplate, instructorWeeklyDigestTemplate } from '../mwasalatUser/mwasalatEmailTemplates.js';
import logger from '../../utils/logger.js';
import { mwasalatActivityLogService } from '../mwasalatActivityLog/mwasalatActivityLog.service.js';
import { mwasalatNotificationService } from '../mwasalatNotification/mwasalatNotification.service.js';
import { createZoomMeeting } from '../../integrations/zoom.js';
import { getOrgTimezone, getTodayBoundaryInTimezone } from '../../utils/orgTimezone.js';

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

// Mongo query fragment matching programs visible to an internal learner in
// `departmentId` and/or a member of one of `groupIds` (their MwasalatGroup
// cohorts) — untagged on both axes (no restriction, the default), or
// explicitly tagged to their department, or explicitly targeting one of
// their cohorts. `departments`/`targetGroups` may be entirely absent on
// documents saved before those fields existed, so `$exists: false` is
// checked alongside `$size: 0` rather than relying on the schema default
// (Mongoose defaults only apply on hydration, never to how MongoDB matches
// an existing document against a query filter). departmentId/groupIds are
// guarded rather than passed through unconditionally so an absent value
// (no department assigned, no cohort membership) never becomes a stray
// `{field: undefined}` clause.
const targetingVisibilityClause = (departmentId, groupIds = []) => ({
  $or: [
    {
      $and: [
        { $or: [{ departments: { $exists: false } }, { departments: { $size: 0 } }] },
        { $or: [{ targetGroups: { $exists: false } }, { targetGroups: { $size: 0 } }] },
      ],
    },
    ...(departmentId ? [{ departments: departmentId }] : []),
    ...(groupIds.length ? [{ targetGroups: { $in: groupIds } }] : []),
  ],
});

// Same rule as targetingVisibilityClause, evaluated in JS against an
// already-fetched (hydrated) program document — used where a document is
// already in hand rather than being queried (getById, enroll).
const learnerCanAccessProgram = (program, requesterRole, requesterDepartment, requesterGroupIds = []) => {
  if (!MWASALAT_LEARNER_ROLES.includes(requesterRole)) return true;
  if (requesterRole === MWASALAT_ROLES.EXTERNAL_LEARNER) {
    return program.audience !== PROGRAM_AUDIENCE.INTERNAL_ONLY;
  }
  // Internal learner.
  if (program.audience === PROGRAM_AUDIENCE.EXTERNAL_ONLY) return false;
  const deptRestricted = program.departments?.length > 0;
  const groupRestricted = program.targetGroups?.length > 0;
  if (!deptRestricted && !groupRestricted) return true;
  const inDepartment = deptRestricted && program.departments.some((d) => String(d?._id ?? d) === String(requesterDepartment));
  const inGroup = groupRestricted && program.targetGroups.some((g) => requesterGroupIds.some((id) => String(id) === String(g?._id ?? g)));
  return inDepartment || inGroup;
};

// Cohort membership isn't cached on the user doc — a fresh lookup wherever
// program targeting needs to be evaluated for an internal learner. Inactive
// cohorts grant no access, mirroring how an archived program grants none.
const getLearnerGroupIds = async (learnerId) => {
  const groups = await MwasalatGroup.find({ members: learnerId, isActive: true }, '_id');
  return groups.map((g) => g._id);
};

// Mandatory-course auto-enrollment ---------------------------------------
// isMandatory used to be purely cosmetic — the only thing it drove was the
// overdue supervisor notice in runDeadlineSweep, which never fires unless the
// learner already has an enrollment record, and enrollment has always been
// learner-initiated. This makes "mandatory" actually land the course on a
// matching internal learner's plate. Two triggers call into this: a program
// being (or becoming) mandatory (create()/update() below), and an internal
// learner newly created or moved into a matching department (bulkImport/
// assignDepartment in mwasalatUser.service.js, via the exported
// syncMandatoryEnrollmentsForLearners).

// Every active internal learner eligible for a mandatory program's audience —
// unrestricted if the program lists neither departments nor targetGroups,
// otherwise anyone in one of the listed departments OR a member of one of
// the listed cohorts (same union rule as learnerCanAccessProgram).
const getMandatoryTargetLearnerIds = async (program) => {
  const baseQuery = { role: MWASALAT_ROLES.LEARNER, isActive: true };
  const deptRestricted = program.departments?.length > 0;
  const groupRestricted = program.targetGroups?.length > 0;

  if (!deptRestricted && !groupRestricted) {
    const learners = await MwasalatUser.find(baseQuery, '_id');
    return learners.map((l) => l._id);
  }

  const orClauses = [];
  if (deptRestricted) orClauses.push({ department: { $in: program.departments } });
  if (groupRestricted) {
    const groups = await MwasalatGroup.find({ _id: { $in: program.targetGroups }, isActive: true }, 'members');
    const memberIds = [...new Set(groups.flatMap((g) => g.members.map((m) => m.toString())))];
    if (memberIds.length) orClauses.push({ _id: { $in: memberIds } });
  }
  if (!orClauses.length) return [];

  const learners = await MwasalatUser.find({ ...baseQuery, $or: orClauses }, '_id');
  return learners.map((l) => l._id);
};

// Batch-creates enrollments for whichever of `learnerIds` don't already have
// one on this program (any status — a past rejection is a deliberate call by
// the instructor and shouldn't be silently overridden), honoring the same
// approval-gate/seat-capacity rules a manual enroll() would apply.
const autoEnrollMandatoryLearners = async (program, learnerIds) => {
  if (!learnerIds?.length) return;

  const existing = await MwasalatEnrollment.find(
    { program: program._id, learner: { $in: learnerIds } },
    'learner'
  );
  const covered = new Set(existing.map((e) => e.learner.toString()));
  const toEnroll = learnerIds.filter((id) => !covered.has(id.toString()));
  if (!toEnroll.length) return;

  let seatsTaken = 0;
  if (program.capacity) {
    seatsTaken = await MwasalatEnrollment.countDocuments({
      program: program._id, status: { $in: SEAT_CONSUMING_STATUSES },
    });
  }

  const docs = toEnroll.map((learnerId) => {
    let status;
    if (program.capacity && seatsTaken >= program.capacity) {
      status = ENROLLMENT_STATUS.WAITLISTED;
    } else {
      status = program.requiresApproval ? ENROLLMENT_STATUS.PENDING_APPROVAL : ENROLLMENT_STATUS.ENROLLED;
      if (program.capacity) seatsTaken += 1;
    }
    return { learner: learnerId, program: program._id, status };
  });

  // Same "duplicates are expected, ignore them" convention as
  // mwasalatCategory.service.js's seed insertMany — a race against a learner
  // self-enrolling between the lookup above and this insert is the only way
  // this ever collides, and losing that race to their own manual enroll is fine.
  await MwasalatEnrollment.insertMany(docs, { ordered: false }).catch(() => {});
};

// Program-side trigger — called from create()/update() whenever the saved
// program ends up mandatory, to backfill everyone currently eligible
// (including anyone newly eligible because departments just changed).
const syncMandatoryEnrollmentsForProgram = async (program) => {
  if (!program.isMandatory || program.status !== PROGRAM_STATUS.ACTIVE) return;
  const learnerIds = await getMandatoryTargetLearnerIds(program);
  await autoEnrollMandatoryLearners(program, learnerIds);
};

// Learner-side trigger — called from mwasalatUser.service.js when internal
// learners are newly created (bulkImport) or moved into a department
// (assignDepartment), and from mwasalatGroup.service.js when members are
// added to a cohort — to enroll them into whatever mandatory courses already
// target that department/cohort (or all internal learners, unrestricted).
// Self-defending on role/active status so no caller needs to pre-filter its
// own learnerIds list (e.g. a cohort can technically list any user).
const syncMandatoryEnrollmentsForLearners = async (learnerIds, { departmentId, groupIds = [] } = {}) => {
  if (!learnerIds?.length) return;
  const eligible = await MwasalatUser.find(
    { _id: { $in: learnerIds }, role: MWASALAT_ROLES.LEARNER, isActive: true }, '_id'
  );
  if (!eligible.length) return;
  const eligibleIds = eligible.map((u) => u._id);

  const programs = await MwasalatProgram.find({
    status: PROGRAM_STATUS.ACTIVE,
    isMandatory: true,
    audience: { $ne: PROGRAM_AUDIENCE.EXTERNAL_ONLY },
    ...targetingVisibilityClause(departmentId, groupIds),
  });
  for (const program of programs) {
    // eslint-disable-next-line no-await-in-loop
    await autoEnrollMandatoryLearners(program, eligibleIds);
  }
};

const create = async (instructorId, data, pdfFiles, videoFile, actor) => {
  const {
    title, titleAr, category, categoryAr, subCategory, subCategoryAr,
    description, descriptionAr, duration, durationAr, expiryDate,
    recordingLink, liveScheduledAt, liveMeetingLink, liveMeetingProvider, liveMeetingStartUrl,
    iltVenue, iltScheduledAt, pdfDurationDays, certificateValidityMonths, capacity, prerequisiteProgram,
    requiresApproval, autoRenewCertificate, expectedCompletionDays,
  } = data;

  const contentTypes = JSON.parse(data.contentTypes ?? '[]');
  if (!contentTypes.length) throw new AppError('Select at least one content type', 400);

  const audience = Object.values(PROGRAM_AUDIENCE).includes(data.audience) ? data.audience : PROGRAM_AUDIENCE.ALL;
  // Internal learners are always free — a price never applies when external
  // learners can't see this course at all.
  const price = audience === PROGRAM_AUDIENCE.INTERNAL_ONLY ? 0 : (data.price ?? 0);

  // Only meaningful when internal learners are part of the audience — an
  // external-only course has no department/cohort targeting concept, so
  // these stay empty regardless of what's submitted for either.
  let departmentIds = [];
  let targetGroupIds = [];
  if (audience !== PROGRAM_AUDIENCE.EXTERNAL_ONLY) {
    departmentIds = JSON.parse(data.departments ?? '[]');
    if (departmentIds.length) {
      const validCount = await MwasalatDepartment.countDocuments({ _id: { $in: departmentIds } });
      if (validCount !== departmentIds.length) {
        throw new AppError('One or more selected departments were not found', 400);
      }
    }
    targetGroupIds = JSON.parse(data.targetGroups ?? '[]');
    if (targetGroupIds.length) {
      const validGroupCount = await MwasalatGroup.countDocuments({ _id: { $in: targetGroupIds } });
      if (validGroupCount !== targetGroupIds.length) {
        throw new AppError('One or more selected cohorts were not found', 400);
      }
    }
  }

  const categoryDoc = await MwasalatCategory.findOne({ name: category, isActive: true });
  if (!categoryDoc) throw new AppError('Selected category is not valid — choose one from the list', 400);
  // Only enforce once the category has a managed subcategory list — categories
  // seeded before this taxonomy existed have none yet, so their courses keep
  // accepting free-text subCategory until an admin populates the list.
  if (categoryDoc.subCategories?.length && !categoryDoc.subCategories.some((s) => s.name === subCategory)) {
    throw new AppError('Selected subcategory is not valid — choose one from the list', 400);
  }

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

  let completionDays;
  if (expectedCompletionDays) {
    completionDays = Number(expectedCompletionDays);
    if (!Number.isInteger(completionDays) || completionDays < 1) {
      throw new AppError('Expected completion days must be a whole number of at least 1', 400);
    }
  }
  // Mandatory is an internal-learner concept only — an external_only course
  // has no such toggle (external deadline enforcement is unconditional
  // whenever expectedCompletionDays is set at all).
  const isMandatory = audience !== PROGRAM_AUDIENCE.EXTERNAL_ONLY
    && (data.isMandatory === true || data.isMandatory === 'true');

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

  if (contentTypes.includes(CONTENT_TYPES.PDF) && !pdfFiles?.length) {
    throw new AppError('At least one PDF file is required for the PDF content type', 400);
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
  let documents;
  if (pdfFiles?.length) {
    // `format` is ignored for resource_type 'raw' — the delivered URL only gets
    // a real .pdf extension if the public_id itself ends in .pdf. Without it,
    // Cloudinary serves the file as application/octet-stream with a forced
    // download disposition instead of an inline-viewable PDF.
    const uploads = await Promise.all(pdfFiles.map((file) => uploadBuffer(file.buffer, {
      public_id: `mwasalat/course-pdfs/${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`,
      resource_type: 'raw',
      allowed_formats: ['pdf'],
    })));
    documents = uploads.map((uploaded, i) => ({
      url: uploaded.secure_url, publicId: uploaded.public_id, name: pdfFiles[i].originalname,
    }));
    // pdfUrl mirrors the first document — kept as its own field since the day-tracking
    // progress mechanic (pdfDurationDays / pdfOpenedDates) is keyed off a single "pdf"
    // content type, not per-document.
    pdfUrl = documents[0].url;
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
    audience, departments: departmentIds, targetGroups: targetGroupIds,
    expiryDate: expiryDate || undefined,
    certificateValidityMonths: certValidityMonths,
    autoRenewCertificate: Boolean(certValidityMonths) && (autoRenewCertificate === true || autoRenewCertificate === 'true'),
    expectedCompletionDays: completionDays,
    isMandatory,
    pdfUrl,
    documents,
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
    requiresApproval: requiresApproval === true || requiresApproval === 'true',
    prerequisiteProgram: prerequisiteProgramId,
    instructor: instructorId,
  });

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'create_program', targetType: 'MwasalatProgram', targetId: program._id, metadata: { title: program.title },
  });

  await syncMandatoryEnrollmentsForProgram(program);

  return program;
};

const listMine = async (instructorId) => {
  return MwasalatProgram.find({ instructor: instructorId }).sort({ createdAt: -1 });
};

// Seats-remaining is only meaningful for session-based delivery (live/ILT) —
// self-paced pdf/recording courses never set a capacity, so they're returned
// as-is with no seatsRemaining field at all.
// `requester` is nullable — this route allows anonymous access (see
// authenticateOptional) so the public landing page can show a course
// preview strip while logged out. An anonymous visitor and an
// external_learner are treated identically (both are the prospective/actual
// paying public audience); a learner additionally gets department-filtered;
// any staff role is unrestricted, matching this endpoint's behavior before
// audience/department targeting existed.
const listPublic = async (requester) => {
  const now = new Date();
  const andClauses = [
    { status: PROGRAM_STATUS.ACTIVE },
    { enrollmentClosed: { $ne: true } },
    { $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }] },
    // A live/ILT course's one-time session date has passed — new learners can't
    // attend it, so hide it from the catalog. Existing enrollees are unaffected:
    // getById() and listMyEnrollments() have no such gate, only this browse query does.
    {
      $nor: [
        { contentTypes: CONTENT_TYPES.LIVE, liveScheduledAt: { $lte: now } },
        { contentTypes: CONTENT_TYPES.ILT, iltScheduledAt: { $lte: now } },
      ],
    },
  ];

  const role = requester?.role;
  if (!role || role === MWASALAT_ROLES.EXTERNAL_LEARNER) {
    andClauses.push({ audience: { $ne: PROGRAM_AUDIENCE.INTERNAL_ONLY } });
  } else if (role === MWASALAT_ROLES.LEARNER) {
    andClauses.push({ audience: { $ne: PROGRAM_AUDIENCE.EXTERNAL_ONLY } });
    const groupIds = await getLearnerGroupIds(requester._id);
    andClauses.push(targetingVisibilityClause(requester.department, groupIds));
  }

  const programs = await MwasalatProgram.find({ $and: andClauses })
    .populate('instructor', 'name')
    .populate('prerequisiteProgram', 'title titleAr')
    .sort({ createdAt: -1 });

  const capacitated = programs.filter((p) => p.capacity);
  if (!capacitated.length) return programs;

  const counts = await MwasalatEnrollment.aggregate([
    { $match: { program: { $in: capacitated.map((p) => p._id) }, status: { $in: SEAT_CONSUMING_STATUSES } } },
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

// Thrown by every learner-facing content endpoint (check-in, mark-opened, video,
// feedback) — a 'pending_approval'/'waitlisted'/'rejected' enrollment record exists
// but grants no access yet, so treat it the same as "not enrolled" with a specific reason.
const assertHasAccess = (enrollment) => {
  if (!enrollment) throw new AppError('You must be enrolled in this course', 403);
  if (enrollment.status === ENROLLMENT_STATUS.PENDING_APPROVAL) {
    throw new AppError('Your enrollment is awaiting approval', 403);
  }
  if (enrollment.status === ENROLLMENT_STATUS.WAITLISTED) {
    throw new AppError('You are on the waitlist for this course', 403);
  }
  if (enrollment.status === ENROLLMENT_STATUS.REJECTED) {
    throw new AppError('Your enrollment request was not approved', 403);
  }
  if (enrollment.status === ENROLLMENT_STATUS.LOCKED) {
    throw new AppError('Your access to this course is locked — pay to reactivate it', 402);
  }
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

  const effectiveCategory = data.category !== undefined ? data.category : program.category;
  const effectiveSubCategory = data.subCategory !== undefined ? data.subCategory : program.subCategory;
  if (data.category !== undefined || data.subCategory !== undefined) {
    const categoryDoc = await MwasalatCategory.findOne({ name: effectiveCategory, isActive: true });
    if (!categoryDoc) throw new AppError('Selected category is not valid — choose one from the list', 400);
    if (categoryDoc.subCategories?.length && !categoryDoc.subCategories.some((s) => s.name === effectiveSubCategory)) {
      throw new AppError('Selected subcategory is not valid — choose one from the list', 400);
    }
  }

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

  if (data.autoRenewCertificate !== undefined) {
    program.autoRenewCertificate = data.autoRenewCertificate === true || data.autoRenewCertificate === 'true';
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

  if (data.requiresApproval !== undefined) {
    program.requiresApproval = data.requiresApproval === true || data.requiresApproval === 'true';
  }

  if (data.enrollmentClosed !== undefined) {
    program.enrollmentClosed = data.enrollmentClosed === true || data.enrollmentClosed === 'true';
  }

  if (data.expectedCompletionDays !== undefined) {
    if (data.expectedCompletionDays === '' || data.expectedCompletionDays === null) {
      program.expectedCompletionDays = undefined;
    } else {
      const days = Number(data.expectedCompletionDays);
      if (!Number.isInteger(days) || days < 1) {
        throw new AppError('Expected completion days must be a whole number of at least 1', 400);
      }
      program.expectedCompletionDays = days;
    }
  }

  if (data.isMandatory !== undefined) {
    program.isMandatory = data.isMandatory === true || data.isMandatory === 'true';
  }

  // Documents can only be removed after creation, not added — matches the existing
  // "content types are locked after creation" convention (no re-upload path here).
  if (data.removeDocumentIds !== undefined) {
    const removeIds = new Set((Array.isArray(data.removeDocumentIds) ? data.removeDocumentIds : JSON.parse(data.removeDocumentIds || '[]')).map(String));
    program.documents = program.documents.filter((doc) => !removeIds.has(String(doc._id)));
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

  // Only meaningful when audience includes internal learners — audience
  // itself is immutable after creation (not in EDITABLE_FIELDS), so this
  // form's Departments/Cohorts fields only ever show for a course that
  // already supports them.
  if (data.departments !== undefined) {
    const departmentIds = Array.isArray(data.departments) ? data.departments : JSON.parse(data.departments || '[]');
    if (departmentIds.length) {
      const validCount = await MwasalatDepartment.countDocuments({ _id: { $in: departmentIds } });
      if (validCount !== departmentIds.length) {
        throw new AppError('One or more selected departments were not found', 400);
      }
    }
    program.departments = departmentIds;
  }

  if (data.targetGroups !== undefined) {
    const targetGroupIds = Array.isArray(data.targetGroups) ? data.targetGroups : JSON.parse(data.targetGroups || '[]');
    if (targetGroupIds.length) {
      const validGroupCount = await MwasalatGroup.countDocuments({ _id: { $in: targetGroupIds } });
      if (validGroupCount !== targetGroupIds.length) {
        throw new AppError('One or more selected cohorts were not found', 400);
      }
    }
    program.targetGroups = targetGroupIds;
  }

  // Re-asserted on every save, not just at creation — price is independently
  // PATCHable via EDITABLE_FIELDS, so this must run after that loop to stop a
  // nonzero price being written back onto an internal-only course.
  if (program.audience === PROGRAM_AUDIENCE.INTERNAL_ONLY) program.price = 0;
  // Same reasoning — mandatory is an internal-learner concept only, so an
  // external_only course can never carry it regardless of what was submitted.
  if (program.audience === PROGRAM_AUDIENCE.EXTERNAL_ONLY) program.isMandatory = false;

  await program.save();
  // Capacity may have just increased — pull waitlisted learners in if there's now room.
  await promoteFromWaitlist(program);
  // No-op unless the course is (still/now) mandatory — backfills anyone newly
  // eligible if it was just marked mandatory or its departments just changed.
  await syncMandatoryEnrollmentsForProgram(program);

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

  if (program.deletionScheduledAt) {
    throw new AppError('This course is already scheduled for deletion', 409);
  }

  const activeEnrollmentCount = await MwasalatEnrollment.countDocuments({
    program: program._id,
    status: { $in: ACTIVE_ENROLLMENT_STATUSES },
  });
  if (activeEnrollmentCount > 0) {
    throw new AppError(
      `Cannot delete this course: ${activeEnrollmentCount} learner${activeEnrollmentCount === 1 ? '' : 's'} ${activeEnrollmentCount === 1 ? 'is' : 'are'} actively enrolled`,
      409
    );
  }

  const scheduledAt = new Date(Date.now() + COURSE_DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000);
  program.deletionScheduledAt = scheduledAt;
  program.enrollmentClosed = true;
  await program.save();

  const enrollments = await MwasalatEnrollment.find({ program: programId }, 'learner');
  if (enrollments.length) {
    mwasalatNotificationService.notifyUsers(
      requesterId,
      enrollments.map((e) => e.learner),
      {
        title: 'Course scheduled for deletion',
        message: `"${program.title}" will be discontinued on ${scheduledAt.toDateString()}. Your progress, certificate, and existing access will remain available — it just won't appear in the catalog anymore.`,
      }
    ).catch((err) => logger.error(`[mwasalat-program] Failed to notify learners for scheduled deletion of program ${programId}: ${err.message}`));
  }

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'schedule_delete_program', targetType: 'MwasalatProgram', targetId: program._id, metadata: { title: program.title, scheduledAt },
  });

  return program;
};

const cancelScheduledDeletion = async (requesterId, requesterRole, programId, actor) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  assertOwnership(program, requesterId, requesterRole);

  if (!program.deletionScheduledAt) {
    throw new AppError('This course is not scheduled for deletion', 400);
  }

  // Deliberately left untouched: the instructor may have wanted enrollment
  // closed independent of the delete flow — they can re-toggle it via update().
  program.deletionScheduledAt = null;
  await program.save();

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'cancel_program_deletion', targetType: 'MwasalatProgram', targetId: program._id, metadata: { title: program.title },
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

// Grace-period counterpart to archiveExpired() — same non-destructive soft-archive,
// just gated on remove()'s deletionScheduledAt deadline instead of expiryDate.
// Learners were already notified of the date when deletion was scheduled, so no
// re-notification here.
const runScheduledDeletions = async () => {
  const now = new Date();
  const result = await MwasalatProgram.updateMany(
    { deletionScheduledAt: { $lte: now } },
    { $set: { status: PROGRAM_STATUS.ARCHIVED }, $unset: { deletionScheduledAt: '' } }
  );
  return result.modifiedCount;
};

const enroll = async (learnerId, learnerRole, programId, learnerDepartment) => {
  const program = await MwasalatProgram.findById(programId).populate('prerequisiteProgram', 'title titleAr');
  if (!program) throw new AppError('Program not found', 404);

  // Unconditional — unlike getById()'s gate, this grants *new* access, so
  // there's no "already has a record" bypass here.
  const learnerGroupIds = learnerRole === MWASALAT_ROLES.LEARNER ? await getLearnerGroupIds(learnerId) : [];
  if (!learnerCanAccessProgram(program, learnerRole, learnerDepartment, learnerGroupIds)) {
    throw new AppError('This course is not available to you', 403);
  }

  // Internal learners are free regardless of a course's listed price; external
  // learners are the paying public audience and must go through checkout for
  // anything priced — see mwasalatPayment.service.js#createCheckoutSession.
  if (program.price > 0 && learnerRole === MWASALAT_ROLES.EXTERNAL_LEARNER) {
    throw new AppError('This course requires payment — use the checkout flow to enroll', 402);
  }

  if (program.enrollmentClosed) {
    throw new AppError('This course is not accepting new enrollments right now', 409);
  }

  const existing = await MwasalatEnrollment.findOne({ learner: learnerId, program: programId });
  if (existing && existing.status !== ENROLLMENT_STATUS.REJECTED) {
    throw new AppError('You are already enrolled in this program', 409);
  }

  if (program.prerequisiteProgram) {
    const prereqCompleted = await MwasalatEnrollment.findOne({
      learner: learnerId, program: program.prerequisiteProgram._id, completedAt: { $ne: null },
    });
    if (!prereqCompleted) {
      throw new AppError(`Complete "${program.prerequisiteProgram.title}" first to unlock this course`, 409);
    }
  }

  let isFull = false;
  if (program.capacity) {
    const seatsTaken = await MwasalatEnrollment.countDocuments({
      program: programId, status: { $in: SEAT_CONSUMING_STATUSES },
    });
    isFull = seatsTaken >= program.capacity;
  }

  const status = isFull
    ? ENROLLMENT_STATUS.WAITLISTED
    : (program.requiresApproval ? ENROLLMENT_STATUS.PENDING_APPROVAL : ENROLLMENT_STATUS.ENROLLED);

  // A previously-rejected learner re-requesting reuses their old enrollment row
  // instead of creating a duplicate (the learner/program pair is unique-indexed).
  if (existing) {
    existing.status = status;
    existing.purchasedAt = new Date();
    existing.rejectedAt = undefined;
    existing.rejectionReason = undefined;
    existing.approvedAt = undefined;
    existing.approvedBy = undefined;
    await existing.save();
    return existing;
  }

  return MwasalatEnrollment.create({ learner: learnerId, program: programId, status });
};

// Fills freed seats from the front of the waitlist (oldest request first), looping
// in case capacity was just increased by more than one seat at once. No-op for
// courses without a capacity — waitlisting only ever applies to session-based delivery.
const promoteFromWaitlist = async (program) => {
  if (!program.capacity) return;

  let seatsTaken = await MwasalatEnrollment.countDocuments({
    program: program._id, status: { $in: SEAT_CONSUMING_STATUSES },
  });

  while (seatsTaken < program.capacity) {
    const next = await MwasalatEnrollment.findOne({ program: program._id, status: ENROLLMENT_STATUS.WAITLISTED })
      .sort({ purchasedAt: 1 });
    if (!next) break;

    next.status = program.requiresApproval ? ENROLLMENT_STATUS.PENDING_APPROVAL : ENROLLMENT_STATUS.ENROLLED;
    // Reset the completion-deadline clock (and the engagement/risk clock,
    // which already falls back to purchasedAt) to the moment they actually
    // get access — otherwise time spent waitlisted would count against a
    // deadline they had no way to act on yet.
    next.purchasedAt = new Date();
    await next.save();
    seatsTaken += 1;

    mwasalatNotificationService.notifyUsers(program.instructor, [next.learner], {
      title: 'A seat opened up',
      message: program.requiresApproval
        ? `A seat opened up in "${program.title}" — your enrollment is now awaiting approval.`
        : `A seat opened up in "${program.title}" — you're off the waitlist and enrolled!`,
    }).catch((err) => logger.error(`[mwasalat-program] Waitlist promotion notification failed: ${err.message}`));
  }
};

const approveEnrollment = async (requesterId, requesterRole, programId, learnerId) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  assertOwnership(program, requesterId, requesterRole);

  const enrollment = await MwasalatEnrollment.findOne({ learner: learnerId, program: programId });
  if (!enrollment) throw new AppError('Enrollment not found', 404);
  if (enrollment.status !== ENROLLMENT_STATUS.PENDING_APPROVAL) {
    throw new AppError('This enrollment is not awaiting approval', 409);
  }

  enrollment.status = ENROLLMENT_STATUS.ENROLLED;
  enrollment.approvedAt = new Date();
  enrollment.approvedBy = requesterId;
  await enrollment.save();

  mwasalatNotificationService.notifyUsers(requesterId, [learnerId], {
    title: 'Enrollment approved',
    message: `You're approved for "${program.title}" — you now have full access.`,
  }).catch((err) => logger.error(`[mwasalat-program] Approval notification failed: ${err.message}`));

  return enrollment;
};

const rejectEnrollment = async (requesterId, requesterRole, programId, learnerId, reason) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  assertOwnership(program, requesterId, requesterRole);

  const enrollment = await MwasalatEnrollment.findOne({ learner: learnerId, program: programId });
  if (!enrollment) throw new AppError('Enrollment not found', 404);
  if (![ENROLLMENT_STATUS.PENDING_APPROVAL, ENROLLMENT_STATUS.WAITLISTED].includes(enrollment.status)) {
    throw new AppError('Only pending or waitlisted enrollments can be rejected', 409);
  }

  enrollment.status = ENROLLMENT_STATUS.REJECTED;
  enrollment.rejectedAt = new Date();
  enrollment.rejectionReason = reason?.trim() || undefined;
  await enrollment.save();

  mwasalatNotificationService.notifyUsers(requesterId, [learnerId], {
    title: 'Enrollment request declined',
    message: `Your request to join "${program.title}" was declined${reason?.trim() ? `: ${reason.trim()}` : '.'}`,
  }).catch((err) => logger.error(`[mwasalat-program] Rejection notification failed: ${err.message}`));

  await promoteFromWaitlist(program);

  return enrollment;
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

  // Hoisted above the audience/department gate below so it can double as the
  // "already has a record" bypass — a learner who already has any enrollment
  // (even pending/rejected) can always keep viewing a course they've
  // interacted with; retagging a course's targeting afterward must never
  // strand them mid-course (unlike enroll(), which grants *new* access and
  // has no such bypass).
  const isLearnerRole = MWASALAT_LEARNER_ROLES.includes(requester?.role);
  const myEnrollment = isLearnerRole
    ? await MwasalatEnrollment.findOne({ learner: requester._id, program: id }, 'status')
    : null;

  const needsAccessCheck = isLearnerRole && !myEnrollment;
  const requesterGroupIds = needsAccessCheck && requester.role === MWASALAT_ROLES.LEARNER
    ? await getLearnerGroupIds(requester._id)
    : [];
  if (needsAccessCheck && !learnerCanAccessProgram(program, requester.role, requester.department, requesterGroupIds)) {
    throw new AppError('This course is not available to you', 403);
  }

  const canSeeHostLink = requester && (
    requester.role === MWASALAT_ROLES.SUPER_ADMIN
    || (requester.role === MWASALAT_ROLES.INSTRUCTOR && String(program.instructor?._id) === String(requester._id))
  );
  const result = program.toObject();
  if (!canSeeHostLink) delete result.liveMeetingStartUrl;

  if (program.capacity) {
    const seatsTaken = await MwasalatEnrollment.countDocuments({
      program: id, status: { $in: SEAT_CONSUMING_STATUSES },
    });
    result.seatsRemaining = Math.max(0, program.capacity - seatsTaken);
  }

  if (program.prerequisiteProgram && isLearnerRole) {
    const prereqCompleted = await MwasalatEnrollment.findOne({
      learner: requester._id, program: program.prerequisiteProgram._id, completedAt: { $ne: null },
    });
    result.prerequisiteCompleted = Boolean(prereqCompleted);
  }

  if (isLearnerRole) {
    result.myEnrollmentStatus = myEnrollment?.status ?? null;
  }

  return result;
};

// Fractional per-lesson credit for modular progress — the granular counterpart
// to isLessonOpened's all-or-nothing flag (defined further down, but usable
// here since these are only ever *called* after the whole module has loaded).
// Video/audio lessons get partial credit for how much was actually watched,
// same as the legacy branch's recording step; quiz/assignment lessons stay
// all-or-nothing (passed or not — a submitted-but-failed attempt is still 0,
// there's no partial credit for "attempted").
const lessonProgressFraction = (lesson, moduleProgress, lessonMediaProgress, quizPassed, passedAssignmentLessonIds) => {
  if (lesson.type === LESSON_TYPES.QUIZ) return quizPassed ? 1 : 0;
  if (lesson.type === LESSON_TYPES.ASSIGNMENT) return passedAssignmentLessonIds.has(String(lesson._id)) ? 1 : 0;
  if (lesson.type === LESSON_TYPES.VIDEO || lesson.type === LESSON_TYPES.AUDIO) {
    const duration = lesson.type === LESSON_TYPES.AUDIO ? lesson.audioDurationSeconds : lesson.videoDurationSeconds;
    if (duration) {
      const media = lessonMediaProgress?.find((m) => String(m.lessonId) === String(lesson._id));
      return Math.min(1, (media?.furthestSeconds ?? 0) / duration);
    }
  }
  return isLessonOpened(lesson, moduleProgress, lessonMediaProgress) ? 1 : 0;
};

// A module's own completion fraction — equal-weighted average of its lessons'
// fractions, so a 2-lesson module with one finished lesson and a half-watched
// second lesson reads as 50%, not 0% the way the old completedAt-only gate did.
const computeModuleContentFraction = (mod, enrollment, passedQuizModuleIds, passedAssignmentLessonIds) => {
  const lessons = mod.lessons ?? [];
  if (!lessons.length) return 0;
  const moduleProgress = enrollment?.moduleProgress?.find((mp) => String(mp.moduleId) === String(mod._id));
  const quizPassed = passedQuizModuleIds.has(String(mod._id));
  const sum = lessons.reduce(
    (acc, l) => acc + lessonProgressFraction(l, moduleProgress, enrollment?.lessonMediaProgress, quizPassed, passedAssignmentLessonIds),
    0
  );
  return sum / lessons.length;
};

// Whole-course modular fraction — equal-weighted average across modules, each
// itself an equal-weighted average across its lessons: 100%/totalModules per
// module, then each module's own share split across its lessons using the
// same per-type logic as the single pdf/video legacy branch below.
const computeModularProgressFraction = (program, enrollment, passedQuizModuleIds, passedAssignmentLessonIds) => {
  const modules = program.modules ?? [];
  if (!modules.length) return 0;
  const sum = modules.reduce(
    (acc, mod) => acc + computeModuleContentFraction(mod, enrollment, passedQuizModuleIds, passedAssignmentLessonIds),
    0
  );
  return sum / modules.length;
};

// Server-side mirror of frontend/src/utils/mwasalatProgress.js stageProgress()
// — deliberately duplicated (frontend/backend don't share a module boundary
// here) so the instructor roster gets a real progress % without firing one
// getCompletionStatus request per learner. passedQuizModuleIds/
// passedAssignmentLessonIds are only used by the modular branch — legacy
// (single quiz, moduleId null) callers can omit them.
const computeLearnerProgressPercent = (
  enrollment, program, quizPassed, feedbackSubmitted, hasQuiz,
  passedQuizModuleIds = new Set(), passedAssignmentLessonIds = new Set()
) => {
  const contentTypes = program.contentTypes ?? [];

  // Modular ("super course") progress — each module contributes an equal
  // share (1/totalModules), and within a module each lesson contributes an
  // equal share of that, using per-lesson-type fractional credit. Replaces
  // the old all-or-nothing completedModules/totalModules count so in-progress
  // work inside an unfinished module is no longer invisible.
  if (contentTypes.includes(CONTENT_TYPES.MODULAR)) {
    const totalModules = program.modules?.length ?? 0;
    const contentStep = totalModules
      ? computeModularProgressFraction(program, enrollment, passedQuizModuleIds, passedAssignmentLessonIds)
      : 0;
    const steps = [contentStep, feedbackSubmitted ? 1 : 0];
    const done = steps.reduce((sum, s) => sum + s, 0);
    return Math.round((done / steps.length) * 100);
  }

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
  const [program, enrollments, hasQuiz, passingAttempts, feedbackDocs, passingAssignments] = await Promise.all([
    MwasalatProgram.findById(programId),
    MwasalatEnrollment.find({ program: programId }).populate('learner', 'name email').sort({ createdAt: -1 }),
    MwasalatQuiz.exists({ program: programId }),
    MwasalatQuizAttempt.find({ program: programId, passed: true }, 'learner moduleId'),
    MwasalatFeedback.find({ program: programId }, 'learner'),
    MwasalatAssignmentSubmission.find({ program: programId, passed: true }, 'learner lessonId'),
  ]);
  if (!program) throw new AppError('Program not found', 404);

  const passedLearnerIds = new Set(passingAttempts.map((a) => a.learner.toString()));
  const feedbackLearnerIds = new Set(feedbackDocs.map((f) => f.learner.toString()));
  // Per-learner lookups for the modular branch's per-module/per-lesson fractions.
  const passedQuizModuleIdsByLearner = new Map();
  passingAttempts.forEach((a) => {
    if (!a.moduleId) return;
    const lid = a.learner.toString();
    if (!passedQuizModuleIdsByLearner.has(lid)) passedQuizModuleIdsByLearner.set(lid, new Set());
    passedQuizModuleIdsByLearner.get(lid).add(String(a.moduleId));
  });
  const passedAssignmentLessonIdsByLearner = new Map();
  passingAssignments.forEach((s) => {
    const lid = s.learner.toString();
    if (!passedAssignmentLessonIdsByLearner.has(lid)) passedAssignmentLessonIdsByLearner.set(lid, new Set());
    passedAssignmentLessonIdsByLearner.get(lid).add(String(s.lessonId));
  });
  const returnedCutoff = Date.now() - 3 * DAY_MS;

  const allStudents = enrollments.map((e) => {
    const learnerId = e.learner?._id?.toString();
    const progress = computeLearnerProgressPercent(
      e, program, passedLearnerIds.has(learnerId), feedbackLearnerIds.has(learnerId), Boolean(hasQuiz),
      passedQuizModuleIdsByLearner.get(learnerId), passedAssignmentLessonIdsByLearner.get(learnerId)
    );
    const returned = Boolean(e.returnedAt) && new Date(e.returnedAt).getTime() >= returnedCutoff;
    const isCompleted = e.status === ENROLLMENT_STATUS.COMPLETED;
    const dueAt = computeDueAt(e, program);
    const overdue = Boolean(dueAt) && Date.now() >= dueAt.getTime() && !isCompleted;
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
      dueAt,
      overdue,
      isLocked: e.status === ENROLLMENT_STATUS.LOCKED,
    };
  });

  const needsAttention = allStudents.filter(
    (s) => (s.riskLevel !== 'on_track' && s.status !== ENROLLMENT_STATUS.COMPLETED) || s.returned || s.overdue
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

  const [enrollments, quizzes, passingAttempts, feedbackDocs, passingAssignments] = await Promise.all([
    MwasalatEnrollment.find({ program: { $in: programIds } }).populate('learner', 'name email').sort({ createdAt: -1 }),
    MwasalatQuiz.find({ program: { $in: programIds } }, 'program'),
    MwasalatQuizAttempt.find({ program: { $in: programIds }, passed: true }, 'learner program moduleId'),
    MwasalatFeedback.find({ program: { $in: programIds } }, 'learner program'),
    MwasalatAssignmentSubmission.find({ program: { $in: programIds }, passed: true }, 'learner program lessonId'),
  ]);

  const programsWithQuiz = new Set(quizzes.map((q) => q.program.toString()));
  const passedKeys = new Set(passingAttempts.map((a) => `${a.learner}:${a.program}`));
  const feedbackKeys = new Set(feedbackDocs.map((f) => `${f.learner}:${f.program}`));
  // Per-(learner, program) lookups for the modular branch's per-module/per-lesson fractions.
  const passedQuizModuleIdsByKey = new Map();
  passingAttempts.forEach((a) => {
    if (!a.moduleId) return;
    const key = `${a.learner}:${a.program}`;
    if (!passedQuizModuleIdsByKey.has(key)) passedQuizModuleIdsByKey.set(key, new Set());
    passedQuizModuleIdsByKey.get(key).add(String(a.moduleId));
  });
  const passedAssignmentLessonIdsByKey = new Map();
  passingAssignments.forEach((s) => {
    const key = `${s.learner}:${s.program}`;
    if (!passedAssignmentLessonIdsByKey.has(key)) passedAssignmentLessonIdsByKey.set(key, new Set());
    passedAssignmentLessonIdsByKey.get(key).add(String(s.lessonId));
  });
  const returnedCutoff = Date.now() - 3 * DAY_MS;

  const allStudents = enrollments.map((e) => {
    const programKey = e.program.toString();
    const program = programById.get(programKey);
    const learnerId = e.learner?._id?.toString();
    const key = `${learnerId}:${programKey}`;
    const progress = computeLearnerProgressPercent(
      e, program, passedKeys.has(key), feedbackKeys.has(key), programsWithQuiz.has(programKey),
      passedQuizModuleIdsByKey.get(key), passedAssignmentLessonIdsByKey.get(key)
    );
    const returned = Boolean(e.returnedAt) && new Date(e.returnedAt).getTime() >= returnedCutoff;
    const isCompleted = e.status === ENROLLMENT_STATUS.COMPLETED;
    const dueAt = program ? computeDueAt(e, program) : null;
    const overdue = Boolean(dueAt) && Date.now() >= dueAt.getTime() && !isCompleted;
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
      dueAt,
      overdue,
      isLocked: e.status === ENROLLMENT_STATUS.LOCKED,
    };
  });

  const needsAttention = allStudents.filter(
    (s) => (s.riskLevel !== 'on_track' && s.status !== ENROLLMENT_STATUS.COMPLETED) || s.returned || s.overdue
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
  assertHasAccess(enrollment);

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

// Instructor-triggered "the session actually happened" marker — separate from
// attendance/check-in (which only proves a learner showed up) and from
// markContentOpened's 'live'/'ilt' credit (which fires the moment a learner
// clicks Join, before the session even starts). This is what unlocks the
// course-level quiz for session-based delivery — see isClassSessionCompleted.
const completeClass = async (requesterId, requesterRole, programId, contentType, actor) => {
  if (![CONTENT_TYPES.LIVE, CONTENT_TYPES.ILT].includes(contentType)) {
    throw new AppError('contentType must be "live" or "ilt"', 400);
  }

  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  assertOwnership(program, requesterId, requesterRole);
  if (!program.contentTypes.includes(contentType)) {
    throw new AppError(`This course has no ${contentType === CONTENT_TYPES.LIVE ? 'live class' : 'in-person session'}`, 400);
  }

  const field = contentType === CONTENT_TYPES.LIVE ? 'liveClassCompletedAt' : 'iltClassCompletedAt';
  program[field] = new Date();
  await program.save();

  const enrollments = await MwasalatEnrollment.find(
    { program: programId, status: { $in: ACCESS_GRANTED_STATUSES } },
    'learner'
  );
  if (enrollments.length) {
    const sessionLabel = contentType === CONTENT_TYPES.LIVE ? 'live class' : 'in-person session';
    mwasalatNotificationService.notifyUsers(
      requesterId,
      enrollments.map((e) => e.learner),
      {
        title: 'Class completed',
        message: `The ${sessionLabel} for "${program.title}" has been marked complete — the assessment is now available.`,
      }
    ).catch((err) => logger.error(`[mwasalat-program] Failed to notify learners for completed class ${programId}: ${err.message}`));
  }

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'complete_class', targetType: 'MwasalatProgram', targetId: program._id,
    metadata: { title: program.title, contentType },
  });

  return program.toObject();
};

// True unless the course includes a live/ILT session the instructor hasn't
// marked complete yet via completeClass() — courses with neither delivery
// mode (or both already completed) have nothing to wait on.
const isClassSessionCompleted = (program) => {
  const types = program?.contentTypes ?? [];
  if (types.includes(CONTENT_TYPES.LIVE) && !program.liveClassCompletedAt) return false;
  if (types.includes(CONTENT_TYPES.ILT) && !program.iltClassCompletedAt) return false;
  return true;
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
    // Only learners with actual content access are meaningfully "engaged" or "at risk" —
    // pending-approval/waitlisted/rejected enrollments haven't been granted anything yet.
    status: { $in: ACCESS_GRANTED_STATUSES.filter((s) => s !== ENROLLMENT_STATUS.COMPLETED) },
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
        await mwasalatNotificationService.notifyUsers(program.instructor, [enrollment.learner], { title, message, type: 'inactivity_nudge' });

        if (threshold === 14) {
          const learner = await MwasalatUser.findById(enrollment.learner, 'name email');
          if (learner?.email) {
            sendEmail({
              to: learner.email,
              subject: title,
              html: reengagementTemplate({
                name: learner.name,
                courseTitle: program.title,
                courseUrl: `${process.env.CLIENT_URL}/learner/programs/${program._id}`,
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

// Grace periods for the external-learner deadline flow, in days past the
// course's own deadline (computeDueAt): a warning notification at +10, then
// access locks at +10+5 = +15 if still incomplete. Internal-mandatory courses
// have no grace period — the supervisor is notified the moment it's overdue.
const OVERDUE_WARN_DAYS = 10;
const OVERDUE_LOCK_DAYS = 5;

// Deliberately not stored on the enrollment — recomputed live everywhere it's
// needed (here and in getLearners/getMyRoster's "overdue" derivation) so an
// instructor editing expectedCompletionDays later applies retroactively with
// no backfill. Anchors on reactivatedAt (if ever reactivated) over approvedAt
// (if the enrollment needed approval) over purchasedAt — never counts time
// spent waiting for approval or on a waitlist against the deadline (see the
// purchasedAt reset in promoteFromWaitlist).
const computeDueAt = (enrollment, program) => {
  if (!program.expectedCompletionDays) return null;
  const anchor = enrollment.reactivatedAt ?? enrollment.approvedAt ?? enrollment.purchasedAt;
  return new Date(new Date(anchor).getTime() + program.expectedCompletionDays * DAY_MS);
};

// Daily sweep for courses with a completion deadline set (mirrors
// computeEngagementAndNudge's shape: batch-fetch relevant programs/
// enrollments, chunk the side-effecting notify+save pass). Two independent
// branches by learner role — a course's `isMandatory` flag only ever gates
// the internal branch; external learners on the same course always get the
// warn/lock treatment once a deadline exists, regardless of `isMandatory`.
const runDeadlineSweep = async () => {
  const now = Date.now();
  const deadlinePrograms = await MwasalatProgram.find(
    { status: PROGRAM_STATUS.ACTIVE, expectedCompletionDays: { $ne: null } },
    'title instructor isMandatory expectedCompletionDays'
  );
  const programById = new Map(deadlinePrograms.map((p) => [p._id.toString(), p]));
  if (!programById.size) return { checked: 0, supervisorNotified: 0, warned: 0, locked: 0 };

  const enrollments = await MwasalatEnrollment.find({
    program: { $in: [...programById.keys()] },
    status: { $in: ACCESS_GRANTED_STATUSES.filter((s) => s !== ENROLLMENT_STATUS.COMPLETED) },
  }).populate('learner', 'name role supervisor');

  const overdue = [];
  enrollments.forEach((enrollment) => {
    const program = programById.get(enrollment.program.toString());
    if (!program || !enrollment.learner) return;
    const dueAt = computeDueAt(enrollment, program);
    if (!dueAt || now < dueAt.getTime()) return;
    overdue.push({ enrollment, program, dueAt });
  });

  let supervisorNotified = 0;
  let warned = 0;
  let locked = 0;
  const chunkSize = 25;
  for (let i = 0; i < overdue.length; i += chunkSize) {
    const chunk = overdue.slice(i, i + chunkSize);
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(chunk.map(async ({ enrollment, program, dueAt }) => {
      try {
        const { learner } = enrollment;

        if (learner.role === MWASALAT_ROLES.LEARNER) {
          if (!program.isMandatory || enrollment.supervisorNotifiedAt || !learner.supervisor) return;
          await mwasalatNotificationService.notifyUsers(program.instructor, [learner.supervisor], {
            title: 'A direct report has an overdue mandatory course',
            message: `${learner.name} has not completed "${program.title}", which was due on ${dueAt.toDateString()}.`,
            type: 'overdue_supervisor_notice',
          });
          enrollment.supervisorNotifiedAt = new Date();
          await enrollment.save();
          supervisorNotified += 1;
          return;
        }

        if (learner.role === MWASALAT_ROLES.EXTERNAL_LEARNER) {
          const daysPastDue = Math.floor((now - dueAt.getTime()) / DAY_MS);

          // Check the lock threshold before the warning threshold — if the
          // sweep hasn't run in a while and both thresholds are already
          // crossed, lock directly rather than warning-then-immediately-locking.
          if (daysPastDue >= OVERDUE_WARN_DAYS + OVERDUE_LOCK_DAYS) {
            if (enrollment.lockedAt) return;
            enrollment.preLockStatus = enrollment.status;
            enrollment.status = ENROLLMENT_STATUS.LOCKED;
            enrollment.lockedAt = new Date();
            await enrollment.save();
            await mwasalatNotificationService.notifyUsers(program.instructor, [learner._id], {
              title: 'Course access locked',
              message: `Your access to "${program.title}" has been locked because it wasn't completed in time. Pay half the course price to reactivate it.`,
              type: 'overdue_lock',
            });
            locked += 1;
          } else if (daysPastDue >= OVERDUE_WARN_DAYS) {
            if (enrollment.overdueWarnedAt) return;
            enrollment.overdueWarnedAt = new Date();
            await enrollment.save();
            await mwasalatNotificationService.notifyUsers(program.instructor, [learner._id], {
              title: 'Course completion overdue',
              message: `"${program.title}" was due on ${dueAt.toDateString()} and is still incomplete. You have ${OVERDUE_LOCK_DAYS} more days before access is locked.`,
              type: 'overdue_warning',
            });
            warned += 1;
          }
          // Otherwise: just overdue, under the warning threshold — no
          // notification yet, just shows as "overdue" on the instructor's
          // roster (see the derived `overdue` field in getLearners/getMyRoster).
        }
      } catch (err) {
        logger.error(`[mwasalat-program] Deadline sweep failed for enrollment ${enrollment._id}: ${err.message}`);
      }
    }));
  }

  return { checked: overdue.length, supervisorNotified, warned, locked };
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

// Shared by quiz-pass, assignment-grade, and feedback-submit — issues a certificate
// once every condition the course actually has (quiz/assignment are only required
// if one exists at all) is satisfied
const maybeCompleteEnrollment = async (learnerId, programId) => {
  const enrollment = await MwasalatEnrollment.findOne({ learner: learnerId, program: programId });
  if (!enrollment || enrollment.status === ENROLLMENT_STATUS.COMPLETED) return;

  const program = await MwasalatProgram.findById(programId);
  if (!program) return;

  const feedback = await MwasalatFeedback.findOne({ learner: learnerId, program: programId });

  if (program.contentTypes?.includes(CONTENT_TYPES.MODULAR)) {
    const statuses = await computeModuleStatuses(program, enrollment);
    const allModulesComplete = statuses.length > 0 && statuses.every((s) => s.completed);
    if (!allModulesComplete || !feedback) return;
  } else {
    const [hasQuiz, passingAttempt, hasAssignment, passingSubmission] = await Promise.all([
      MwasalatQuiz.exists({ program: programId, moduleId: null }),
      MwasalatQuizAttempt.findOne({ learner: learnerId, program: programId, moduleId: null, passed: true }),
      MwasalatAssignment.exists({ program: programId, moduleId: null }),
      MwasalatAssignmentSubmission.findOne({ learner: learnerId, program: programId, moduleId: null, passed: true }),
    ]);

    const quizSatisfied = hasQuiz ? Boolean(passingAttempt) : true;
    const assignmentSatisfied = hasAssignment ? Boolean(passingSubmission) : true;
    if (!quizSatisfied || !assignmentSatisfied || !feedback) return;
  }

  enrollment.status = ENROLLMENT_STATUS.COMPLETED;
  enrollment.completedAt = new Date();
  await enrollment.save();

  const existingCertificate = await MwasalatCertificate.findOne({ learner: learnerId, program: programId });
  if (existingCertificate) return;

  const learner = await MwasalatUser.findById(learnerId);

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
        certificateUrl: `${process.env.CLIENT_URL}/learner/programs/${programId}/certificate`,
      }),
    }).catch((err) => logger.error(`[mwasalat-program] Certificate email failed for ${learner.email}: ${err.message}`));
  }
};

const submitFeedback = async (learnerId, programId, data) => {
  const enrollment = await MwasalatEnrollment.findOne({ learner: learnerId, program: programId });
  assertHasAccess(enrollment);

  const existing = await MwasalatFeedback.findOne({ learner: learnerId, program: programId });
  if (existing) throw new AppError('You have already submitted feedback for this course', 409);

  const feedback = await MwasalatFeedback.create({
    learner: learnerId,
    program: programId,
    courseRating: data.courseRating,
    instructorRating: data.instructorRating,
    trainerClear: typeof data.trainerClear === 'boolean' ? data.trainerClear : (data.trainerClear === 'true' ? true : data.trainerClear === 'false' ? false : null),
    comment: data.comment,
  });

  await registerActivity(programId, enrollment);
  await maybeCompleteEnrollment(learnerId, programId);
  return feedback;
};

const getCompletionStatus = async (learnerId, programId) => {
  const [
    enrollment, program, hasQuiz, passingAttempt, feedback, certificate, hasAssignment, latestSubmission,
    passedModuleQuizAttempts, passedModuleAssignments,
  ] = await Promise.all([
    MwasalatEnrollment.findOne({ learner: learnerId, program: programId }),
    MwasalatProgram.findById(programId, 'pdfDurationDays contentTypes recordingVideoDurationSeconds modules liveClassCompletedAt iltClassCompletedAt'),
    MwasalatQuiz.exists({ program: programId, moduleId: null }),
    MwasalatQuizAttempt.findOne({ learner: learnerId, program: programId, moduleId: null, passed: true }),
    MwasalatFeedback.findOne({ learner: learnerId, program: programId }),
    MwasalatCertificate.findOne({ learner: learnerId, program: programId }),
    MwasalatAssignment.exists({ program: programId, moduleId: null }),
    MwasalatAssignmentSubmission.findOne({ learner: learnerId, program: programId, moduleId: null }).sort({ submittedAt: -1 }),
    // Modular-only: per-module quiz passes / per-lesson assignment passes for
    // this learner, feeding computeModularProgressFraction's granular %.
    MwasalatQuizAttempt.find({ learner: learnerId, program: programId, moduleId: { $ne: null }, passed: true }, 'moduleId'),
    MwasalatAssignmentSubmission.find({ learner: learnerId, program: programId, moduleId: { $ne: null }, passed: true }, 'lessonId'),
  ]);

  const quizAttemptNumber = passingAttempt
    ? await MwasalatQuizAttempt.countDocuments({
      learner: learnerId, program: programId, moduleId: null, attemptedAt: { $lte: passingAttempt.attemptedAt },
    })
    : null;

  // Modular ("super course") summary. completedModules/totalModules stay an
  // exact whole-module count (used for the "X of Y modules done" badge and
  // the "continue vs start" check), while progressFraction is the granular
  // per-lesson number the frontend's stageProgress() mirror now uses for the
  // actual percentage — see computeModularProgressFraction above.
  const modular = program?.contentTypes?.includes(CONTENT_TYPES.MODULAR)
    ? {
      totalModules: program.modules?.length ?? 0,
      completedModules: enrollment?.moduleProgress?.filter((mp) => mp.completedAt).length ?? 0,
      progressFraction: computeModularProgressFraction(
        program,
        enrollment,
        new Set(passedModuleQuizAttempts.map((a) => String(a.moduleId))),
        new Set(passedModuleAssignments.map((s) => String(s.lessonId)))
      ),
    }
    : null;

  let waitlistPosition = null;
  if (enrollment?.status === ENROLLMENT_STATUS.WAITLISTED) {
    waitlistPosition = 1 + await MwasalatEnrollment.countDocuments({
      program: programId, status: ENROLLMENT_STATUS.WAITLISTED, purchasedAt: { $lt: enrollment.purchasedAt },
    });
  }

  return {
    status: enrollment?.status ?? null,
    waitlistPosition,
    rejectionReason: enrollment?.status === ENROLLMENT_STATUS.REJECTED ? enrollment.rejectionReason ?? null : null,
    contentOpened: Boolean(enrollment?.contentOpenedAt),
    // Whether a live/ILT course's instructor has marked the session itself
    // complete (see completeClass) — the quiz stays hidden/blocked until this
    // is true, even once contentOpened flips on the learner's own "Join" click.
    sessionCompleted: isClassSessionCompleted(program),
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
    hasAssignment: Boolean(hasAssignment),
    assignmentPassed: hasAssignment ? latestSubmission?.passed === true : true,
    assignmentSubmission: latestSubmission
      ? {
        status: latestSubmission.status,
        score: latestSubmission.score,
        passed: latestSubmission.passed,
        feedback: latestSubmission.feedback,
        submittedAt: latestSubmission.submittedAt,
      }
      : null,
    feedbackSubmitted: Boolean(feedback),
    certificateIssued: Boolean(certificate),
    modular,
  };
};

const getMyCertificate = async (learnerId, programId) => {
  const certificate = await MwasalatCertificate.findOne({ learner: learnerId, program: programId });
  if (!certificate) throw new AppError('No certificate found for this course', 404);

  const [learner, program, hasQuiz] = await Promise.all([
    MwasalatUser.findById(learnerId),
    MwasalatProgram.findById(programId).populate('instructor', 'name'),
    MwasalatQuiz.exists({ program: programId }),
  ]);

  // "Due for renewal" mirrors the 30-day reminder/auto-renewal window elsewhere in
  // this file — surfaced so the certificate page can offer a retest CTA before the
  // cert actually lapses, not only after.
  const renewalWindow = new Date(Date.now() + 30 * DAY_MS);
  const isDueForRenewal = Boolean(certificate.expiresAt && certificate.expiresAt <= renewalWindow);
  const canRenewViaRetest = isDueForRenewal && Boolean(hasQuiz) && !program?.autoRenewCertificate;

  return {
    _id: certificate._id,
    certificateNumber: formatCertificateNumber(certificate._id),
    issuedAt: certificate.issuedAt,
    expiresAt: certificate.expiresAt,
    isExpired: Boolean(certificate.expiresAt && certificate.expiresAt <= new Date()),
    isDueForRenewal,
    autoRenewCertificate: Boolean(program?.autoRenewCertificate),
    canRenewViaRetest,
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
// hardcoded/placeholder numbers with live counts and aggregates. When `actor`
// is a Department Admin, every people/enrollment/certificate count is scoped
// to their own department (see mwasalatDepartmentScope.js) — programs
// themselves aren't department-tagged yet, so activePrograms/draftPrograms/
// programsByType stay platform-wide even in that case.
const getAdminOverview = async (actor) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const scoped = mwasalatDepartmentScope.isDepartmentScoped(actor);
  const deptUserIds = scoped ? await mwasalatDepartmentScope.getDepartmentUserIds(actor.department) : null;
  const deptMatch = scoped ? { department: actor.department } : {};
  const deptLearnerMatch = scoped ? { learner: { $in: deptUserIds } } : {};
  // Strict "explicitly tagged to my department" match — deliberately NOT the
  // same "untagged = visible to everyone" rule listPublic()/getById() use for
  // learner access. An admin's own course counts/list should be a precise,
  // curated set, not every generic untagged course inflating every
  // department admin's numbers at once.
  const deptProgramMatch = scoped ? { departments: actor.department } : {};

  const [
    totalLearners, totalExternalLearners, totalInstructors, activePrograms, draftPrograms, totalCertificates,
    certificatesIssuedToday, certificatesIssuedThisMonth, newLearnersThisMonth, newExternalLearnersThisMonth, programs,
  ] = await Promise.all([
    MwasalatUser.countDocuments({ role: MWASALAT_ROLES.LEARNER, ...deptMatch }),
    // Kept separate from totalLearners — external learners are a paying public
    // audience, not internal training headcount, so admin stats shouldn't blend them.
    MwasalatUser.countDocuments({ role: MWASALAT_ROLES.EXTERNAL_LEARNER, ...deptMatch }),
    MwasalatUser.countDocuments({ role: MWASALAT_ROLES.INSTRUCTOR, ...deptMatch }),
    MwasalatProgram.countDocuments({ status: PROGRAM_STATUS.ACTIVE, ...deptProgramMatch }),
    MwasalatProgram.countDocuments({ status: PROGRAM_STATUS.DRAFT, ...deptProgramMatch }),
    MwasalatCertificate.countDocuments({ ...deptLearnerMatch }),
    MwasalatCertificate.countDocuments({ issuedAt: { $gte: todayStart }, ...deptLearnerMatch }),
    MwasalatCertificate.countDocuments({ issuedAt: { $gte: monthStart }, ...deptLearnerMatch }),
    MwasalatUser.countDocuments({ role: MWASALAT_ROLES.LEARNER, createdAt: { $gte: monthStart }, ...deptMatch }),
    MwasalatUser.countDocuments({ role: MWASALAT_ROLES.EXTERNAL_LEARNER, createdAt: { $gte: monthStart }, ...deptMatch }),
    MwasalatProgram.find({ status: { $ne: PROGRAM_STATUS.ARCHIVED }, ...deptProgramMatch }, { contentTypes: 1 }),
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
      role: MWASALAT_ROLES.LEARNER, createdAt: { $gte: start, $lt: end }, ...deptMatch,
    }))
  );
  const weeklyExternalSignups = await Promise.all(
    weeks.map(({ start, end }) => MwasalatUser.countDocuments({
      role: MWASALAT_ROLES.EXTERNAL_LEARNER, createdAt: { $gte: start, $lt: end }, ...deptMatch,
    }))
  );

  // Same 8-week windows, for the Certificates stat card's sparkline.
  const weeklyCertificates = await Promise.all(
    weeks.map(({ start, end }) => MwasalatCertificate.countDocuments({ issuedAt: { $gte: start, $lt: end }, ...deptLearnerMatch }))
  );

  // Completion funnel — where learners drop off between enrolling and
  // finishing a course. Same three-stage shape regardless of whether a
  // program has a quiz, since "completed" already accounts for that per-enrollment.
  const [totalEnrolled, openedContent, completedEnrollments] = await Promise.all([
    MwasalatEnrollment.countDocuments({ status: { $ne: ENROLLMENT_STATUS.REJECTED }, ...deptLearnerMatch }),
    MwasalatEnrollment.countDocuments({ contentOpenedAt: { $ne: null }, ...deptLearnerMatch }),
    MwasalatEnrollment.countDocuments({ status: ENROLLMENT_STATUS.COMPLETED, ...deptLearnerMatch }),
  ]);
  const funnel = [
    { label: 'Enrolled', value: totalEnrolled },
    { label: 'Opened Content', value: openedContent },
    { label: 'Completed', value: completedEnrollments },
  ];

  return {
    totalLearners, totalExternalLearners, totalInstructors, activePrograms, draftPrograms, totalCertificates,
    certificatesIssuedToday, certificatesIssuedThisMonth, newLearnersThisMonth, newExternalLearnersThisMonth,
    programsByType, weeklySignups, weeklyExternalSignups, weeklyCertificates, funnel,
  };
};

// Top 5 courses ranked by completion rate (completed / total enrollments) —
// backs the admin dashboard's "Top Performing Courses" panel. Courses with no
// enrollments are excluded (an undefined rate isn't a ranking). For a
// Department Admin, ranking is computed only from their department's
// enrollments — courses aren't department-tagged, so this reflects "how my
// department's learners are doing" rather than a department-owned course list.
const getTopCoursesByCompletionRate = async (actor) => {
  const scoped = mwasalatDepartmentScope.isDepartmentScoped(actor);
  // Direct program-department filter now that courses carry a real
  // `departments` field — ranks completion rate among a department's own
  // tagged courses, not just enrollments from that department's learners.
  const enrollmentMatch = { status: { $ne: ENROLLMENT_STATUS.REJECTED } };
  if (scoped) {
    const scopedPrograms = await MwasalatProgram.find({ departments: actor.department }, '_id');
    enrollmentMatch.program = { $in: scopedPrograms.map((p) => p._id) };
  }

  const enrollments = await MwasalatEnrollment.find(enrollmentMatch, 'program status');

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
// backs the admin dashboard's "Upcoming Classes" panel. For a Department
// Admin, scoped directly to programs tagged to their department (now that
// courses carry a real `departments` field).
const getUpcomingClasses = async (actor) => {
  const now = new Date();
  const scoped = mwasalatDepartmentScope.isDepartmentScoped(actor);
  const deptProgramMatch = scoped ? { departments: actor.department } : {};

  const programs = await MwasalatProgram.find({
    status: { $ne: PROGRAM_STATUS.ARCHIVED },
    $or: [
      { contentTypes: CONTENT_TYPES.LIVE, liveScheduledAt: { $gte: now } },
      { contentTypes: CONTENT_TYPES.ILT, iltScheduledAt: { $gte: now } },
    ],
    ...deptProgramMatch,
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
  const timezone = await getOrgTimezone();
  const { start: startOfDay, end: endOfDay } = getTodayBoundaryInTimezone(timezone);

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
// activity-log audit trail itself. For a Department Admin, enrollments/
// certificates are scoped to their department's learners; the platform-wide
// admin action log has no department axis to filter by, so it's left out of
// the scoped feed entirely rather than showing unscoped platform actions.
const getRecentActivityFeed = async (limit = 8, actor) => {
  const scoped = mwasalatDepartmentScope.isDepartmentScoped(actor);
  const deptUserIds = scoped ? await mwasalatDepartmentScope.getDepartmentUserIds(actor.department) : null;
  const deptLearnerMatch = scoped ? { learner: { $in: deptUserIds } } : {};

  const [enrollments, certificates, adminLogResult] = await Promise.all([
    MwasalatEnrollment.find({ ...deptLearnerMatch }).populate('learner', 'name').populate('program', 'title titleAr').sort({ purchasedAt: -1 }).limit(limit),
    MwasalatCertificate.find({ ...deptLearnerMatch }).populate('learner', 'name').populate('program', 'title titleAr').sort({ issuedAt: -1 }).limit(limit),
    scoped ? Promise.resolve({ logs: [] }) : mwasalatActivityLogService.list({ limit }),
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
const listAllForAdmin = async (actor) => {
  const scoped = mwasalatDepartmentScope.isDepartmentScoped(actor);
  const deptProgramMatch = scoped ? { departments: actor.department } : {};

  const [programs, feedback] = await Promise.all([
    MwasalatProgram.find({ ...deptProgramMatch })
      .populate('instructor', 'name email')
      .populate('departments', 'name nameAr')
      .sort({ createdAt: -1 }),
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
      audience: p.audience,
      departments: p.departments,
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
  assertHasAccess(enrollment);

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
  if (!isOwner) assertHasAccess(enrollment);

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
  assertHasAccess(enrollment);

  enrollment.videoFurthestSeconds = Math.max(enrollment.videoFurthestSeconds ?? 0, positionSeconds ?? 0);
  await registerActivity(programId, enrollment);

  const watchedEnough = durationSeconds > 0 && enrollment.videoFurthestSeconds >= durationSeconds * 0.9;
  if (watchedEnough) {
    await markContentOpened(learnerId, programId, CONTENT_TYPES.RECORDING);
  }

  return { videoFurthestSeconds: enrollment.videoFurthestSeconds, watchedEnough };
};

// ---------------------------------------------------------------------------
// Modular ("super course") modules/lessons — instructor authoring + learner
// progression. A modular course is any program with 'modular' in
// contentTypes; its content lives in program.modules[] instead of the flat
// pdf/recording/live/ilt fields above, and is never touched by them.
// ---------------------------------------------------------------------------

const isMediaLessonOpened = (lesson, lessonMediaProgress) => {
  const duration = lesson.type === LESSON_TYPES.AUDIO ? lesson.audioDurationSeconds : lesson.videoDurationSeconds;
  if (!duration) return false;
  const media = lessonMediaProgress?.find((m) => String(m.lessonId) === String(lesson._id));
  return Boolean(media && media.furthestSeconds >= duration * 0.9);
};

const isLessonOpened = (lesson, moduleProgress, lessonMediaProgress) => {
  const openedIds = moduleProgress?.lessonsOpened ?? [];
  if (openedIds.some((id) => String(id) === String(lesson._id))) return true;
  if (lesson.type === LESSON_TYPES.VIDEO || lesson.type === LESSON_TYPES.AUDIO) {
    return isMediaLessonOpened(lesson, lessonMediaProgress);
  }
  return false;
};

// Per-module unlock/completion, derived fresh every time from
// enrollment.moduleProgress + the sibling Quiz/Assignment collections —
// nothing about "unlocked" is ever stored. Module i unlocks only once module
// i-1 is complete; module 0 is always unlocked. A module is complete once
// every non-quiz/non-assignment lesson is opened AND (no quiz lesson OR it's
// been passed) AND (every assignment lesson, if any, has a passing submission).
const computeModuleStatuses = async (program, enrollment) => {
  const moduleIds = program.modules.map((m) => m._id);
  if (!moduleIds.length) return [];

  const [quizAttempts, assignmentSubmissions] = await Promise.all([
    enrollment
      ? MwasalatQuizAttempt.find({ learner: enrollment.learner, program: program._id, moduleId: { $in: moduleIds }, passed: true })
      : [],
    enrollment
      ? MwasalatAssignmentSubmission.find({ learner: enrollment.learner, program: program._id, moduleId: { $in: moduleIds }, passed: true })
      : [],
  ]);
  const passedQuizModuleIds = new Set(quizAttempts.map((a) => String(a.moduleId)));
  const passedAssignmentLessonIds = new Set(assignmentSubmissions.map((s) => String(s.lessonId)));

  let previousComplete = true;
  return program.modules
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((mod) => {
      const moduleProgress = enrollment?.moduleProgress?.find((mp) => String(mp.moduleId) === String(mod._id));
      const quizLesson = mod.lessons.find((l) => l.type === LESSON_TYPES.QUIZ);
      const assignmentLessons = mod.lessons.filter((l) => l.type === LESSON_TYPES.ASSIGNMENT);
      const contentLessons = mod.lessons.filter((l) => l.type !== LESSON_TYPES.QUIZ && l.type !== LESSON_TYPES.ASSIGNMENT);

      const contentComplete = contentLessons.every((l) => isLessonOpened(l, moduleProgress, enrollment?.lessonMediaProgress));
      const quizPassed = quizLesson ? passedQuizModuleIds.has(String(mod._id)) : true;
      const assignmentsPassed = assignmentLessons.every((l) => passedAssignmentLessonIds.has(String(l._id)));

      const completed = contentComplete && quizPassed && assignmentsPassed;
      const unlocked = previousComplete;
      previousComplete = completed;

      return {
        moduleId: mod._id,
        unlocked,
        completed,
        hasQuiz: Boolean(quizLesson),
        quizPassed,
        hasAssignment: assignmentLessons.length > 0,
        assignmentsPassed,
        lessons: mod.lessons.map((l) => ({
          lessonId: l._id,
          opened: l.type === LESSON_TYPES.QUIZ
            ? quizPassed
            : l.type === LESSON_TYPES.ASSIGNMENT
              ? passedAssignmentLessonIds.has(String(l._id))
              : isLessonOpened(l, moduleProgress, enrollment?.lessonMediaProgress),
        })),
      };
    });
};

// Whether every non-quiz/non-assignment lesson in `moduleId` has been opened —
// the gate a modular course's per-module quiz/assignment submission checks,
// the direct analogue of the legacy enrollment.contentOpenedAt gate.
const isModuleContentOpened = (program, enrollment, moduleId) => {
  const mod = program.modules.id(moduleId);
  if (!mod) return false;
  const moduleProgress = enrollment?.moduleProgress?.find((mp) => String(mp.moduleId) === String(moduleId));
  const contentLessons = mod.lessons.filter((l) => l.type !== LESSON_TYPES.QUIZ && l.type !== LESSON_TYPES.ASSIGNMENT);
  return contentLessons.every((l) => isLessonOpened(l, moduleProgress, enrollment?.lessonMediaProgress));
};

const uploadLessonMedia = async (file, { resourceType, folder, forceExtension }) => {
  const publicId = forceExtension
    ? `mwasalat/${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}.${forceExtension}`
    : `mwasalat/${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return uploadBuffer(file.buffer, { public_id: publicId, resource_type: resourceType });
};

const addModule = async (requesterId, requesterRole, programId, { title, titleAr }) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  assertOwnership(program, requesterId, requesterRole);
  if (!title?.trim()) throw new AppError('Module title is required', 400);

  program.modules.push({ title: title.trim(), titleAr: titleAr?.trim(), order: program.modules.length, lessons: [] });
  await program.save();
  return program;
};

const updateModule = async (requesterId, requesterRole, programId, moduleId, { title, titleAr }) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  assertOwnership(program, requesterId, requesterRole);

  const mod = program.modules.id(moduleId);
  if (!mod) throw new AppError('Module not found', 404);
  if (title !== undefined) {
    if (!title.trim()) throw new AppError('Module title is required', 400);
    mod.title = title.trim();
  }
  if (titleAr !== undefined) mod.titleAr = titleAr?.trim();

  await program.save();
  return program;
};

const removeModule = async (requesterId, requesterRole, programId, moduleId) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  assertOwnership(program, requesterId, requesterRole);

  const mod = program.modules.id(moduleId);
  if (!mod) throw new AppError('Module not found', 404);
  mod.deleteOne();
  program.modules.forEach((m, i) => { m.order = i; });
  await program.save();

  await Promise.all([
    MwasalatQuiz.deleteMany({ program: programId, moduleId }),
    MwasalatQuizAttempt.deleteMany({ program: programId, moduleId }),
    MwasalatAssignment.deleteMany({ program: programId, moduleId }),
    MwasalatAssignmentSubmission.deleteMany({ program: programId, moduleId }),
    MwasalatEnrollment.updateMany({ program: programId }, { $pull: { moduleProgress: { moduleId } } }),
  ]);

  return program;
};

const reorderModules = async (requesterId, requesterRole, programId, orderedModuleIds) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  assertOwnership(program, requesterId, requesterRole);

  if (!Array.isArray(orderedModuleIds) || orderedModuleIds.length !== program.modules.length) {
    throw new AppError('orderedModuleIds must include every module exactly once', 400);
  }
  orderedModuleIds.forEach((id, index) => {
    const mod = program.modules.id(id);
    if (!mod) throw new AppError('Module not found', 404);
    mod.order = index;
  });
  await program.save();
  return program;
};

const addLesson = async (requesterId, requesterRole, programId, moduleId, data, file) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  assertOwnership(program, requesterId, requesterRole);

  const mod = program.modules.id(moduleId);
  if (!mod) throw new AppError('Module not found', 404);

  const { type, title, titleAr } = data;
  if (!Object.values(LESSON_TYPES).includes(type)) throw new AppError('Invalid lesson type', 400);
  if (!title?.trim()) throw new AppError('Lesson title is required', 400);
  if (type === LESSON_TYPES.QUIZ && mod.lessons.some((l) => l.type === LESSON_TYPES.QUIZ)) {
    throw new AppError('A module can only have one quiz', 400);
  }

  const lesson = { type, title: title.trim(), titleAr: titleAr?.trim(), order: mod.lessons.length };

  if (type === LESSON_TYPES.INTRO) {
    if (!data.content?.trim()) throw new AppError('Introduction content is required', 400);
    lesson.content = data.content.trim();
    lesson.contentAr = data.contentAr?.trim();
  } else if (type === LESSON_TYPES.LINK) {
    if (!data.externalUrl?.trim()) throw new AppError('External link URL is required', 400);
    lesson.externalUrl = data.externalUrl.trim();
  } else if (type === LESSON_TYPES.VIDEO) {
    if (file) {
      const uploaded = await uploadLessonMedia(file, { resourceType: 'video', folder: 'lesson-videos' });
      lesson.videoPublicId = uploaded.public_id;
      lesson.videoDurationSeconds = uploaded.duration;
    } else if (data.videoLink?.trim()) {
      lesson.videoLink = data.videoLink.trim();
    } else {
      throw new AppError('A video link or an uploaded video is required', 400);
    }
  } else if (type === LESSON_TYPES.AUDIO) {
    if (!file) throw new AppError('An audio file is required', 400);
    const uploaded = await uploadLessonMedia(file, { resourceType: 'video', folder: 'lesson-audio' });
    lesson.audioPublicId = uploaded.public_id;
    lesson.audioDurationSeconds = uploaded.duration;
  } else if (type === LESSON_TYPES.PDF || type === LESSON_TYPES.PPT) {
    if (!file) throw new AppError('A file upload is required', 400);
    const ext = type === LESSON_TYPES.PDF ? 'pdf' : (file.originalname.slice(file.originalname.lastIndexOf('.') + 1) || 'pptx');
    const uploaded = await uploadLessonMedia(file, { resourceType: 'raw', folder: 'lesson-files', forceExtension: ext });
    lesson.fileUrl = uploaded.secure_url;
    lesson.fileName = file.originalname;
    lesson.filePublicId = uploaded.public_id;
  } else if (type === LESSON_TYPES.ASSIGNMENT) {
    if (!data.instructions?.trim()) throw new AppError('Assignment instructions are required', 400);
  }
  // quiz lessons carry no fields of their own — questions are saved separately
  // via the existing quiz builder, scoped to {program, moduleId}.

  mod.lessons.push(lesson);
  await program.save();

  const savedLesson = mod.lessons[mod.lessons.length - 1];

  if (type === LESSON_TYPES.ASSIGNMENT) {
    await MwasalatAssignment.create({
      program: programId,
      moduleId: mod._id,
      lessonId: savedLesson._id,
      title: title.trim(),
      instructions: data.instructions.trim(),
      instructionsAr: data.instructionsAr?.trim(),
      maxScore: data.maxScore ?? 100,
    });
  }

  return program;
};

const updateLesson = async (requesterId, requesterRole, programId, moduleId, lessonId, data, file) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  assertOwnership(program, requesterId, requesterRole);

  const mod = program.modules.id(moduleId);
  if (!mod) throw new AppError('Module not found', 404);
  const lesson = mod.lessons.id(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);

  if (data.title !== undefined) {
    if (!data.title.trim()) throw new AppError('Lesson title is required', 400);
    lesson.title = data.title.trim();
  }
  if (data.titleAr !== undefined) lesson.titleAr = data.titleAr?.trim();

  if (lesson.type === LESSON_TYPES.INTRO) {
    if (data.content !== undefined) lesson.content = data.content?.trim();
    if (data.contentAr !== undefined) lesson.contentAr = data.contentAr?.trim();
  } else if (lesson.type === LESSON_TYPES.LINK) {
    if (data.externalUrl !== undefined) lesson.externalUrl = data.externalUrl?.trim();
  } else if (lesson.type === LESSON_TYPES.VIDEO) {
    if (file) {
      const uploaded = await uploadLessonMedia(file, { resourceType: 'video', folder: 'lesson-videos' });
      lesson.videoPublicId = uploaded.public_id;
      lesson.videoDurationSeconds = uploaded.duration;
      lesson.videoLink = undefined;
    } else if (data.videoLink !== undefined) {
      lesson.videoLink = data.videoLink?.trim();
      lesson.videoPublicId = undefined;
      lesson.videoDurationSeconds = undefined;
    }
  } else if (lesson.type === LESSON_TYPES.AUDIO && file) {
    const uploaded = await uploadLessonMedia(file, { resourceType: 'video', folder: 'lesson-audio' });
    lesson.audioPublicId = uploaded.public_id;
    lesson.audioDurationSeconds = uploaded.duration;
  } else if ((lesson.type === LESSON_TYPES.PDF || lesson.type === LESSON_TYPES.PPT) && file) {
    const ext = lesson.type === LESSON_TYPES.PDF ? 'pdf' : (file.originalname.slice(file.originalname.lastIndexOf('.') + 1) || 'pptx');
    const uploaded = await uploadLessonMedia(file, { resourceType: 'raw', folder: 'lesson-files', forceExtension: ext });
    lesson.fileUrl = uploaded.secure_url;
    lesson.fileName = file.originalname;
    lesson.filePublicId = uploaded.public_id;
  }

  await program.save();

  if (lesson.type === LESSON_TYPES.ASSIGNMENT
    && (data.title !== undefined || data.instructions !== undefined || data.instructionsAr !== undefined || data.maxScore !== undefined)) {
    await MwasalatAssignment.findOneAndUpdate(
      { program: programId, moduleId, lessonId },
      {
        ...(data.title !== undefined ? { title: data.title.trim() } : {}),
        ...(data.instructions !== undefined ? { instructions: data.instructions.trim() } : {}),
        ...(data.instructionsAr !== undefined ? { instructionsAr: data.instructionsAr?.trim() } : {}),
        ...(data.maxScore !== undefined ? { maxScore: data.maxScore } : {}),
      }
    );
  }

  return program;
};

const removeLesson = async (requesterId, requesterRole, programId, moduleId, lessonId) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  assertOwnership(program, requesterId, requesterRole);

  const mod = program.modules.id(moduleId);
  if (!mod) throw new AppError('Module not found', 404);
  const lesson = mod.lessons.id(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);

  lesson.deleteOne();
  mod.lessons.forEach((l, i) => { l.order = i; });
  await program.save();

  await Promise.all([
    MwasalatQuiz.deleteMany({ program: programId, moduleId }),
    MwasalatQuizAttempt.deleteMany({ program: programId, moduleId }),
    MwasalatAssignment.deleteMany({ program: programId, moduleId, lessonId }),
    MwasalatAssignmentSubmission.deleteMany({ program: programId, moduleId, lessonId }),
    MwasalatEnrollment.updateMany({ program: programId }, { $pull: { 'moduleProgress.$[].lessonsOpened': lessonId } }),
    MwasalatEnrollment.updateMany({ program: programId }, { $pull: { lessonMediaProgress: { lessonId } } }),
  ]);

  return program;
};

const reorderLessons = async (requesterId, requesterRole, programId, moduleId, orderedLessonIds) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  assertOwnership(program, requesterId, requesterRole);

  const mod = program.modules.id(moduleId);
  if (!mod) throw new AppError('Module not found', 404);
  if (!Array.isArray(orderedLessonIds) || orderedLessonIds.length !== mod.lessons.length) {
    throw new AppError('orderedLessonIds must include every lesson exactly once', 400);
  }
  orderedLessonIds.forEach((id, index) => {
    const lesson = mod.lessons.id(id);
    if (!lesson) throw new AppError('Lesson not found', 404);
    lesson.order = index;
  });
  await program.save();
  return program;
};

const getCourseForLearner = async (learnerId, programId) => {
  const [program, enrollment] = await Promise.all([
    MwasalatProgram.findById(programId),
    MwasalatEnrollment.findOne({ learner: learnerId, program: programId }),
  ]);
  if (!program) throw new AppError('Program not found', 404);
  assertHasAccess(enrollment);

  const statuses = await computeModuleStatuses(program, enrollment);
  const statusByModule = new Map(statuses.map((s) => [String(s.moduleId), s]));

  return {
    modules: program.modules
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((mod) => {
        const status = statusByModule.get(String(mod._id));
        const openedByLesson = new Map(status.lessons.map((l) => [String(l.lessonId), l.opened]));
        return {
          _id: mod._id,
          title: mod.title,
          titleAr: mod.titleAr,
          unlocked: status.unlocked,
          completed: status.completed,
          hasQuiz: status.hasQuiz,
          quizPassed: status.quizPassed,
          hasAssignment: status.hasAssignment,
          assignmentsPassed: status.assignmentsPassed,
          lessons: mod.lessons
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((lesson) => ({
              _id: lesson._id,
              type: lesson.type,
              title: lesson.title,
              titleAr: lesson.titleAr,
              content: lesson.content,
              contentAr: lesson.contentAr,
              videoLink: lesson.videoLink,
              hasVideoUpload: Boolean(lesson.videoPublicId),
              videoDurationSeconds: lesson.videoDurationSeconds,
              fileUrl: lesson.fileUrl,
              fileName: lesson.fileName,
              hasAudioUpload: Boolean(lesson.audioPublicId),
              audioDurationSeconds: lesson.audioDurationSeconds,
              externalUrl: lesson.externalUrl,
              opened: openedByLesson.get(String(lesson._id)) ?? false,
            })),
        };
      }),
  };
};

const markLessonOpened = async (learnerId, programId, moduleId, lessonId) => {
  const [enrollment, program] = await Promise.all([
    MwasalatEnrollment.findOne({ learner: learnerId, program: programId }),
    MwasalatProgram.findById(programId),
  ]);
  assertHasAccess(enrollment);
  if (!program) throw new AppError('Program not found', 404);

  let moduleProgress = enrollment.moduleProgress.find((mp) => String(mp.moduleId) === String(moduleId));
  if (!moduleProgress) {
    enrollment.moduleProgress.push({ moduleId, lessonsOpened: [] });
    moduleProgress = enrollment.moduleProgress[enrollment.moduleProgress.length - 1];
  }
  if (!moduleProgress.lessonsOpened.some((id) => String(id) === String(lessonId))) {
    moduleProgress.lessonsOpened.push(lessonId);
  }

  // registerActivity persists the enrollment (streak bookkeeping always
  // saves) — this write rides along on that same save.
  await registerActivity(programId, enrollment);

  const statuses = await computeModuleStatuses(program, enrollment);
  const thisModuleStatus = statuses.find((s) => String(s.moduleId) === String(moduleId));
  if (thisModuleStatus?.completed && !moduleProgress.completedAt) {
    moduleProgress.completedAt = new Date();
    await enrollment.save();
  }

  if (statuses.length > 0 && statuses.every((s) => s.completed)) {
    await maybeCompleteEnrollment(learnerId, programId);
  }

  return { statuses };
};

// Furthest-position tracking for a module's video/audio lesson — same
// only-ever-increases + 90%-auto-open convention as the legacy
// updateVideoProgress, just keyed per-lesson instead of a single scalar.
const updateLessonMediaProgress = async (learnerId, programId, moduleId, lessonId, positionSeconds, durationSeconds) => {
  const enrollment = await MwasalatEnrollment.findOne({ learner: learnerId, program: programId });
  assertHasAccess(enrollment);

  let media = enrollment.lessonMediaProgress.find((m) => String(m.lessonId) === String(lessonId));
  if (!media) {
    enrollment.lessonMediaProgress.push({ lessonId, furthestSeconds: 0 });
    media = enrollment.lessonMediaProgress[enrollment.lessonMediaProgress.length - 1];
  }
  media.furthestSeconds = Math.max(media.furthestSeconds ?? 0, positionSeconds ?? 0);
  await registerActivity(programId, enrollment);

  const watchedEnough = durationSeconds > 0 && media.furthestSeconds >= durationSeconds * 0.9;
  if (watchedEnough) {
    await markLessonOpened(learnerId, programId, moduleId, lessonId);
  }

  return { furthestSeconds: media.furthestSeconds, watchedEnough };
};

const getLessonMediaUrl = async (requesterId, programId, moduleId, lessonId) => {
  const program = await MwasalatProgram.findById(programId);
  if (!program) throw new AppError('Program not found', 404);
  const mod = program.modules.id(moduleId);
  const lesson = mod?.lessons.id(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);

  const publicId = lesson.type === LESSON_TYPES.AUDIO ? lesson.audioPublicId : lesson.videoPublicId;
  if (!publicId) throw new AppError('This lesson has no uploaded media', 404);

  const enrollment = await MwasalatEnrollment.findOne({ learner: requesterId, program: programId });
  const isOwner = String(program.instructor) === String(requesterId);
  if (!isOwner) assertHasAccess(enrollment);

  const url = cloudinary.url(publicId, {
    resource_type: 'video',
    type: 'authenticated',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 2 * 60 * 60, // 2 hours, same as legacy getVideoUrl
  });

  const media = enrollment?.lessonMediaProgress?.find((m) => String(m.lessonId) === String(lessonId));
  const durationSeconds = lesson.type === LESSON_TYPES.AUDIO ? lesson.audioDurationSeconds : lesson.videoDurationSeconds;

  return { url, durationSeconds, furthestSeconds: media?.furthestSeconds ?? 0 };
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
    .populate('program', 'title instructor autoRenewCertificate');

  let sent = 0;
  for (const certificate of dueCertificates) {
    const willAutoRenew = Boolean(certificate.program?.autoRenewCertificate);
    const expiresLabel = certificate.expiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    if (certificate.learner?.email) {
      // eslint-disable-next-line no-await-in-loop
      await sendEmail({
        to: certificate.learner.email,
        subject: willAutoRenew
          ? `Your certificate for ${certificate.program?.title} will be renewed automatically`
          : `Your certificate for ${certificate.program?.title} expires soon`,
        html: certificateExpiringTemplate({
          name: certificate.learner.name,
          courseTitle: certificate.program?.title,
          certificateNumber: formatCertificateNumber(certificate._id),
          expiresAt: certificate.expiresAt,
          certificateUrl: `${process.env.CLIENT_URL}/learner/programs/${certificate.program?._id}/certificate`,
          willAutoRenew,
        }),
      }).catch((err) => logger.error(`[mwasalat-program] Certificate expiry email failed for ${certificate.learner.email}: ${err.message}`));
    }

    if (certificate.learner?._id) {
      // eslint-disable-next-line no-await-in-loop
      await mwasalatNotificationService.notifyUsers(certificate.program?.instructor, [certificate.learner._id], {
        title: willAutoRenew ? 'Certificate renewing soon' : 'Certificate expiring soon',
        message: willAutoRenew
          ? `Your certificate for "${certificate.program?.title}" expires on ${expiresLabel} and will be renewed automatically — no action needed.`
          : `Your certificate for "${certificate.program?.title}" expires on ${expiresLabel}. Retake and pass the course assessment to renew it before it expires.`,
        type: 'certificate_expiry',
      }).catch((err) => logger.error(`[mwasalat-program] Certificate expiry notification failed for learner ${certificate.learner._id}: ${err.message}`));
    }

    certificate.expiryReminderSentAt = now;
    // eslint-disable-next-line no-await-in-loop
    await certificate.save();
    sent += 1;
  }

  return sent;
};

// Runs daily — for programs with autoRenewCertificate enabled, silently extends any
// certificate expiring within the next 7 days by another certificateValidityMonths
// period instead of letting it lapse. Programs without autoRenewCertificate rely on
// the learner re-passing the quiz instead (see reissueCertificateFromRetest below).
const autoRenewExpiringCertificates = async () => {
  const now = new Date();
  const renewalCutoff = new Date(now.getTime() + 7 * DAY_MS);

  const dueCertificates = await MwasalatCertificate.find({
    expiresAt: { $gt: now, $lte: renewalCutoff },
  })
    .populate('learner', 'name email')
    .populate('program', 'title instructor autoRenewCertificate certificateValidityMonths');

  let renewed = 0;
  for (const certificate of dueCertificates) {
    if (!certificate.program?.autoRenewCertificate || !certificate.program?.certificateValidityMonths) continue; // eslint-disable-line no-continue

    const newExpiresAt = addMonths(certificate.expiresAt, certificate.program.certificateValidityMonths);
    certificate.expiresAt = newExpiresAt;
    certificate.expiryReminderSentAt = undefined;
    // eslint-disable-next-line no-await-in-loop
    await certificate.save();
    renewed += 1;

    if (certificate.learner?._id) {
      // eslint-disable-next-line no-await-in-loop
      await mwasalatNotificationService.notifyUsers(certificate.program.instructor, [certificate.learner._id], {
        title: 'Certificate renewed',
        message: `Your certificate for "${certificate.program.title}" was automatically renewed and is now valid until ${newExpiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
        type: 'certificate_renewed',
      }).catch((err) => logger.error(`[mwasalat-program] Certificate auto-renewal notification failed for learner ${certificate.learner._id}: ${err.message}`));
    }
  }

  return renewed;
};

// For non-auto-renew certifications, retaking and passing the assessment again
// reissues the certificate — but only once it's actually due for renewal (within
// 30 days of expiry, same window as the reminder above), so retakes don't let a
// learner push a fresh certificate's expiry date out indefinitely. Called from
// mwasalatQuizService.submitAttempt on every passing attempt.
const reissueCertificateFromRetest = async (learnerId, programId) => {
  const [program, certificate] = await Promise.all([
    MwasalatProgram.findById(programId, 'title autoRenewCertificate certificateValidityMonths'),
    MwasalatCertificate.findOne({ learner: learnerId, program: programId }),
  ]);
  if (!program?.certificateValidityMonths || program.autoRenewCertificate) return null;
  if (!certificate?.expiresAt) return null;

  const renewalWindow = new Date(Date.now() + 30 * DAY_MS);
  if (certificate.expiresAt > renewalWindow) return null;

  const issuedAt = new Date();
  certificate.issuedAt = issuedAt;
  certificate.expiresAt = addMonths(issuedAt, program.certificateValidityMonths);
  certificate.expiryReminderSentAt = undefined;
  await certificate.save();

  const learner = await MwasalatUser.findById(learnerId);
  if (learner?.email) {
    sendEmail({
      to: learner.email,
      subject: `Your certificate for ${program.title} has been renewed`,
      html: certificateIssuedTemplate({
        name: learner.name,
        courseTitle: program.title,
        certificateNumber: formatCertificateNumber(certificate._id),
        issuedAt: certificate.issuedAt,
        expiresAt: certificate.expiresAt,
        certificateUrl: `${process.env.CLIENT_URL}/learner/programs/${programId}/certificate`,
      }),
    }).catch((err) => logger.error(`[mwasalat-program] Certificate renewal email failed for ${learner.email}: ${err.message}`));
  }

  return certificate;
};

export const mwasalatProgramService = {
  aiAutofill, createLiveMeeting, create, update, remove, cancelScheduledDeletion, archiveExpired, runScheduledDeletions, listMine, listPublic, enroll, listMyEnrollments, toggleStar,
  approveEnrollment, rejectEnrollment,
  getById, getLearners, getMyRoster, getFeedback, getStats, checkIn, markAttendance, getAttendance,
  completeClass, isClassSessionCompleted,
  submitFeedback, getCompletionStatus, maybeCompleteEnrollment, markContentOpened, getMyCertificate, verifyCertificate, getAchievements,
  getVideoUrl, updateVideoProgress, sendCertificateExpiryReminders, autoRenewExpiringCertificates, reissueCertificateFromRetest,
  registerActivity, computeEngagementAndNudge, sendEncouragement, sendWeeklyInstructorDigests,
  getAdminOverview, listAllCertificates, listAllForAdmin, getInstructorDetail, listInstructorSummaries,
  getTopCoursesByCompletionRate, getUpcomingClasses, getMyTodaySchedule, getRecentActivityFeed,
  assertHasAccess, runDeadlineSweep, computeDueAt, syncMandatoryEnrollmentsForLearners,
  // Modular ("super course") modules/lessons
  addModule, updateModule, removeModule, reorderModules,
  addLesson, updateLesson, removeLesson, reorderLessons,
  getCourseForLearner, markLessonOpened, updateLessonMediaProgress, getLessonMediaUrl,
  isModuleContentOpened, computeModuleStatuses,
};
