import { studentRepository } from './student.repository.js';
import { paymentRepository } from '../payment/payment.repository.js';
import { batchRepository } from '../batch/batch.repository.js';
import { staffRepository } from '../staff/staff.repository.js';
import { msgraphService } from '../../services/msgraph.service.js';
import { AppError } from '../../utils/AppError.js';
import { STUDENT_STATUS, ROLES, NOTIFICATION_TYPES } from '../../constants/index.js';
import { sendEmail } from '../../utils/mailer.js';
import { accountActivatedTemplate } from '../../utils/emailTemplates.js';
import { notifyUser, notifyRole } from '../notification/notification.service.js';

const listStudents = async ({ status, isApproved, batch, page = 1, limit = 20 } = {}) => {
  const filter = {};
  if (status) filter.studentStatus = status;
  if (isApproved !== undefined && isApproved !== '') {
    filter.isApproved = isApproved === 'true' || isApproved === true;
  }
  if (batch) filter.batch = batch;

  const skip = (page - 1) * limit;
  const [students, total] = await Promise.all([
    studentRepository.findAll(filter, { skip, limit }),
    studentRepository.countAll(filter),
  ]);

  return {
    students,
    pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / limit) },
  };
};

const getStudentById = async (id) => {
  const student = await studentRepository.findById(id);
  if (!student) throw new AppError('Student not found', 404);
  return student;
};

const approveStudent = async (id, reviewerId) => {
  const student = await studentRepository.findById(id);
  if (!student) throw new AppError('Student not found', 404);
  if (student.isApproved) throw new AppError('Student is already approved', 400);

  const rollNumber = await studentRepository.getNextRollNumber(student.batch?._id ?? student.batch ?? null);
  const updated = await studentRepository.updateById(id, { isApproved: true, registrationFeePaid: true, rollNumber });

  // Auto-approve any pending registration fee payment so the student isn't blocked at login
  const pendingPayment = await paymentRepository.findPendingByStudent(student._id);
  if (pendingPayment && reviewerId) {
    await paymentRepository.approve(pendingPayment._id, reviewerId);
  }

  const userName = student.user?.name;
  const userEmail = student.user?.email;
  const userId = student.user?._id ?? student.user;

  if (userEmail && userName) {
    const loginUrl = `${process.env.CLIENT_URL}/login`;
    await sendEmail({
      to: userEmail,
      subject: 'Your Eonix account is now active!',
      html: accountActivatedTemplate({ name: userName, loginUrl }),
    }).catch(() => {});
  }

  if (userId) {
    await notifyUser(userId, {
      type:       NOTIFICATION_TYPES.ACCOUNT_ACTIVATED,
      title:      'Account Activated',
      message:    'Your account has been approved. You can now log in and start your learning journey!',
      targetRole: ROLES.STUDENT,
    }).catch(() => {});
  }

  // Auto-create fee account if a fee structure exists for this course
  const { feesService } = await import('../fees/fees.service.js');
  feesService.createFeeAccount(student._id, student.course?._id ?? student.course, student.enrollmentDate)
    .catch(() => {});

  return updated;
};

const updateStudentStatus = async (id, status) => {
  if (!Object.values(STUDENT_STATUS).includes(status)) {
    throw new AppError('Invalid student status', 400);
  }
  const student = await studentRepository.findById(id);
  if (!student) throw new AppError('Student not found', 404);
  return studentRepository.updateById(id, { studentStatus: status });
};

const updateStudent = async (id, data) => {
  const student = await studentRepository.findById(id);
  if (!student) throw new AppError('Student not found', 404);

  const allowed = ['currentWeek', 'notes', 'mentorshipMode', 'batch', 'registrationFeePaid'];
  const updates = {};
  allowed.forEach((key) => { if (data[key] !== undefined) updates[key] = data[key]; });

  return studentRepository.updateById(id, updates);
};

const assignBatch = async (studentId, batchId, requestingUser) => {
  const student = await studentRepository.findById(studentId);
  if (!student) throw new AppError('Student not found', 404);

  const batch = await batchRepository.findById(batchId);
  if (!batch) throw new AppError('Batch not found', 404);
  if (!batch.isActive) throw new AppError('Cannot assign an inactive batch', 400);

  // Coordinators and branch admins can only assign batches from their own branches
  if (requestingUser.role !== ROLES.SUPER_ADMIN) {
    const staff = await staffRepository.findStaffByUserId(requestingUser._id);
    if (!staff) throw new AppError('Staff profile not found', 403);
    const allowedBranches = staff.branches.map((b) => b.toString());
    if (!allowedBranches.includes(batch.branch._id?.toString() ?? batch.branch.toString())) {
      throw new AppError('You can only assign batches from your branches', 403);
    }
  }

  return studentRepository.updateById(studentId, { batch: batchId });
};

const getMyProfile = async (userId) => {
  const student = await studentRepository.findByUserId(userId);
  if (!student) throw new AppError('Student profile not found', 404);
  return student;
};

const updateMyProfile = async (userId, data) => {
  const student = await studentRepository.findByUserId(userId);
  if (!student) throw new AppError('Student profile not found', 404);

  const studentAllowed = ['leetcodeUsername', 'mentorshipMode', 'microsoftEmail'];
  const studentUpdates = {};
  studentAllowed.forEach((key) => { if (data[key] !== undefined) studentUpdates[key] = data[key]; });

  const User = (await import('../user/user.model.js')).default;
  const userUpdates = {};
  if (data.phone?.trim()) userUpdates.phone = data.phone.trim();

  const [updated] = await Promise.all([
    studentRepository.updateById(student._id, studentUpdates),
    Object.keys(userUpdates).length ? User.findByIdAndUpdate(userId, userUpdates) : Promise.resolve(),
  ]);

  // Notify staff so their students cache refreshes (e.g. Microsoft email now visible in coordinator drawer)
  if (studentUpdates.microsoftEmail !== undefined) {
    import('../../sockets/socket.js').then(async ({ getIO }) => {
      const staffUsers = await User.find({
        roles: { $in: [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.BRANCH_COORDINATOR] },
      }).select('_id').lean();
      const io = getIO();
      staffUsers.forEach(u => io.to(`user:${u._id}`).emit('student_profile_updated', { studentId: student._id }));
    }).catch(() => {});
  }

  return updated;
};

const setMicrosoftEmail = async (studentId, microsoftEmail) => {
  const student = await studentRepository.findById(studentId);
  if (!student) throw new AppError('Student not found', 404);
  return studentRepository.updateById(studentId, { microsoftEmail });
};

const reshareTaskSheet = async (studentId) => {
  const student = await studentRepository.findById(studentId);
  if (!student) throw new AppError('Student not found', 404);
  if (student.taskSheetStatus !== 'done') throw new AppError('Task sheet has not been provisioned yet', 400);

  const batchId = student.batch?._id ?? student.batch;
  if (!batchId) throw new AppError('Student has no batch assigned', 400);

  let folderId = student.taskSheetFolderId;

  // Folder ID missing (student provisioned before the field was added) — look it up by path
  if (!folderId) {
    const batchName   = student.batch?.name;
    const studentName = student.user?.name;
    if (!batchName || !studentName) {
      throw new AppError('Cannot recover folder path — batch or student name is missing. Re-provision the task sheet.', 400);
    }
    const folderPath = `Eonix App Files/Students/${batchName}/${studentName}`;
    const item = await msgraphService.lookupFolderByPath(folderPath);
    if (!item?.id) {
      throw new AppError(`Folder not found at "${folderPath}" in OneDrive. Re-provision the task sheet.`, 400);
    }
    folderId = item.id;
    await studentRepository.updateById(student._id, { taskSheetFolderId: folderId });
  }

  // Use user.roles (authoritative) — staff.role is only the registration role and may not reflect manageRoles additions
  const User = (await import('../user/user.model.js')).default;
  const Staff = (await import('../staff/staff.model.js')).default;

  const techMentorUserIds = await User.find({ roles: ROLES.TECHNICAL_MENTOR }).distinct('_id');
  const staffFilter = { user: { $in: techMentorUserIds }, isApproved: true, microsoftEmail: { $nin: [null, ''] } };

  // Prefer mentors assigned to this batch; fall back to any tech mentor with email
  let technicalMentors = await Staff.find({ ...staffFilter, batches: batchId }).select('microsoftEmail').lean();
  if (!technicalMentors.length) {
    technicalMentors = await Staff.find(staffFilter).select('microsoftEmail').lean();
  }

  if (!technicalMentors.length) {
    throw new AppError("No technical mentors with a Microsoft email found. Set the mentor's Microsoft email in Staff → My Profile.", 400);
  }

  const results = await Promise.allSettled(
    technicalMentors.map((m) =>
      msgraphService.shareWithUser(folderId, m.microsoftEmail, 'read', 'Task sheet access granted for student on Eonix.')
    )
  );

  const shared = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  return { shared, failed };
};

const provisionTaskSheet = async (studentId) => {
  const student = await studentRepository.findById(studentId);
  if (!student) throw new AppError('Student not found', 404);
  if (student.course?.reviewType !== 'screening')
    throw new AppError('Task sheet provisioning is only for Zero2Code students. Other courses use shared task sheets.', 400);
  if (!student.batch) throw new AppError('Assign the student to a batch before provisioning task sheets', 400);
  if (!student.microsoftEmail) throw new AppError('Set the student\'s Microsoft account email before provisioning', 400);
  if (student.taskSheetStatus === 'provisioning') throw new AppError('Provisioning is already in progress', 409);

  // Block provisioning if a fee structure exists but the student hasn't paid any installment yet
  const FeeAccount = (await import('../fees/fee-account.model.js')).default;
  const feeAccount = await FeeAccount.findOne({ student: student._id }).select('accessValidUntilWeek').lean();
  if (feeAccount && feeAccount.accessValidUntilWeek === 0) {
    throw new AppError('Student has not paid any fee installment yet. Task sheets cannot be provisioned until at least the first installment is approved.', 403);
  }

  const studentName = student.user?.name;
  if (!studentName) throw new AppError('Student user name not found', 400);

  const batchName  = student.batch?.name ?? 'Unassigned';
  const rollNumber = student.rollNumber;
  const folderName = rollNumber
    ? `${String(rollNumber).padStart(3, '0')} - ${studentName}`
    : studentName;

  await studentRepository.updateById(studentId, { taskSheetStatus: 'provisioning' });

  try {
    const batchId = student.batch?._id ?? student.batch;
    const { folderUrl, folderId, fileUrls } = await msgraphService.provisionStudentFolder({
      studentName: folderName,
      batchName,
      microsoftEmail: student.microsoftEmail,
    });

    // Share with batch coordinator/mentor (read-only) if they have a Microsoft email set
    if (batchId) {
      const batchStaff = await staffRepository.findStaffByBatchWithMicrosoftEmail(batchId);
      for (const staff of batchStaff) {
        try {
          await msgraphService.shareWithUser(folderId, staff.microsoftEmail, 'read',
            `A student's task sheet folder has been shared with you for review on Eonix.`);
        } catch {
          // Non-fatal — provisioning succeeds even if staff sharing fails
        }
      }
    }

    const result = await studentRepository.updateById(studentId, {
      taskSheetUrl: folderUrl,
      taskSheetFolderId: folderId,
      taskSheetStatus: 'done',
      taskSheetProvisionedAt: new Date(),
      taskSheetFiles: fileUrls ?? [],
    });

    // Notify the student so their Task Sheets page reflects the change instantly
    const studentUserId = student.user?._id ?? student.user;
    if (studentUserId) {
      notifyUser(studentUserId, {
        type:       NOTIFICATION_TYPES.TASK_SHEET_PROVISIONED,
        title:      'Task Sheets Ready!',
        message:    'Your personal task sheet folder has been set up. Head to Task Sheets to get started.',
        targetRole: ROLES.STUDENT,
      }).catch(() => {});
    }

    return result;
  } catch (err) {
    await studentRepository.updateById(studentId, { taskSheetStatus: 'error' });
    throw new AppError(`Provisioning failed: ${err.message}`, 500);
  }
};

const resetTaskSheet = async (studentId) => {
  const student = await studentRepository.findById(studentId);
  if (!student) throw new AppError('Student not found', 404);
  return studentRepository.updateById(studentId, {
    taskSheetStatus: 'none',
    taskSheetUrl: null,
    taskSheetProvisionedAt: null,
    taskSheetFiles: [],
  });
};

// ── Academic Summary ─────────────────────────────────────────────────────────

const deriveAttendanceStatus = (mins) => {
  if (mins >= 360) return 'present';
  if (mins >= 180) return 'half_day';
  return 'absent';
};

const getAcademicSummary = async (studentId, requesterRole) => {
  const student = await studentRepository.findById(studentId);
  if (!student) throw new AppError('Student not found', 404);

  const isCode2Career = student.course?.slug?.includes('code2career');
  const canSeeFullPayment = [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.BRANCH_COORDINATOR].includes(requesterRole);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Stage 1: resolve all modules in parallel (ES module cache means no duplicate work)
  const [
    { reviewRepository },
    { default: AppUsage },
    { default: Attendance },
    { default: LeaveRequest },
    { leetcodeRepository },
  ] = await Promise.all([
    import('../review/review.repository.js'),
    import('../attendance/app-usage.model.js'),
    import('../attendance/attendance.model.js'),
    import('../leave/leave.model.js'),
    import('../leetcode/leetcode.repository.js'),
  ]);

  // Stage 2: all DB queries in parallel
  const [reviews, usageRecs, overrideRecs, upcomingLeaves, payments, lcSubmissions] = await Promise.all([
    reviewRepository.findAllByStudent(student._id),
    AppUsage.find({ student: student._id, date: { $gte: monthStart, $lte: monthEnd } }).select('date activeMinutes').lean(),
    Attendance.find({ student: student._id, date: { $gte: monthStart, $lte: monthEnd } }).select('date status').lean(),
    LeaveRequest.find({ student: student._id, status: 'approved', endDate: { $gte: now } }).sort({ startDate: 1 }).limit(5).lean(),
    paymentRepository.findByStudent(student._id),
    isCode2Career ? leetcodeRepository.findStudentSubmissions(student._id) : Promise.resolve([]),
  ]);

  // Attendance — derive status per day, apply manual overrides
  const overrideMap = {};
  overrideRecs.forEach(r => { overrideMap[new Date(r.date).toISOString().split('T')[0]] = r.status; });

  let attPresent = 0, attHalfDay = 0, attAbsent = 0;
  usageRecs.forEach(u => {
    const day    = new Date(u.date).toISOString().split('T')[0];
    const status = overrideMap[day] ?? deriveAttendanceStatus(u.activeMinutes);
    if (status === 'present')   attPresent++;
    else if (status === 'half_day') attHalfDay++;
    else                            attAbsent++;
  });

  // LeetCode (code2career only)
  let leetcode = null;
  if (isCode2Career) {
    const onTimeCount = lcSubmissions.filter(s => s.daysLate === 0).length;
    const recent = [...lcSubmissions]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(s => ({ title: s.problem?.title, order: s.problem?.order, daysLate: s.daysLate, submittedAt: s.createdAt }));
    leetcode = {
      username:       student.leetcodeUsername,
      hold:           student.leetcodeHold,
      list:           student.leetcodeList,
      totalSubmitted: lcSubmissions.length,
      onTimeCount,
      lateCount:      lcSubmissions.length - onTimeCount,
      recent,
    };
  }

  // Payment — mentors see hold flag only; admins/branch admins see full list
  const hasOutstandingFee = !student.registrationFeePaid ||
    payments.some(p => p.status === 'pending_review');
  const payment = canSeeFullPayment
    ? { hasOutstandingFee, payments }
    : { hasOutstandingFee };

  return {
    student,
    courseProgress: {
      currentWeek:      student.currentWeek,
      currentStreak:    student.currentStreak,
      longestStreak:    student.longestStreak,
      lastActivityDate: student.lastActivityDate,
      enrollmentDate:   student.enrollmentDate,
      taskSheetStatus:  student.taskSheetStatus,
      taskSheetUrl:     student.taskSheetUrl,
    },
    screenings:    reviews.filter(r => r.reviewType === 'screening'),
    weeklyReviews: reviews.filter(r => r.reviewType === 'weekly'),
    leetcode,
    attendance: {
      present: attPresent,
      halfDay: attHalfDay,
      absent:  attAbsent,
      month:   monthStart.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
    },
    leaves:  upcomingLeaves,
    payment,
  };
};

const getMyEnrollments = async (userId) => studentRepository.findAllByUserId(userId);

const requestReEnrollment = async (userId, { courseId, mentorshipMode, paymentMethod, transactionId, studentNote }, file) => {
  const { uploadBuffer } = await import('../../config/cloudinary.js');
  const Course = (await import('../course/course.model.js')).default;
  const course = await Course.findOne({ _id: courseId, isActive: true });
  if (!course) throw new AppError('Selected course is not available', 400);

  // Ensure user has graduated from a previous course
  const existing = await studentRepository.findAllByUserId(userId);
  const graduatedRecord = existing.find(e => e.studentStatus === STUDENT_STATUS.GRADUATED);
  if (!graduatedRecord) {
    throw new AppError('Only graduated students can request a new course enrollment', 403);
  }

  // Prevent duplicate pending request for the same course (ignore dropped = rejected attempts)
  const duplicate = existing.find(
    e => e.course?._id?.toString() === courseId &&
         e.studentStatus !== STUDENT_STATUS.GRADUATED &&
         e.studentStatus !== STUDENT_STATUS.DROPPED
  );
  if (duplicate) throw new AppError('You already have an active or pending enrollment in this course', 409);

  // Resolve the first installment amount from the course's fee structure
  const { feesRepository } = await import('../fees/fees.repository.js');
  const feeStructure = await feesRepository.findStructureByCourse(courseId);
  const firstInstallment = feeStructure?.installments?.find(i => i.installmentNumber === 1);
  if (!firstInstallment) throw new AppError('No fee structure found for this course. Contact your coordinator.', 400);

  // Upload payment receipt to Cloudinary
  const uploaded = await uploadBuffer(file.buffer, {
    folder: 'eonix/payment-receipts',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  });

  const Student = (await import('./student.model.js')).default;
  const enrollment = await Student.create({
    user:                  userId,
    course:                courseId,
    branch:                graduatedRecord.branch?._id ?? graduatedRecord.branch ?? null,
    location:              graduatedRecord.location ?? null,
    educationQualification: graduatedRecord.educationQualification ?? null,
    mentorshipMode:        mentorshipMode ?? graduatedRecord.mentorshipMode ?? 'online',
    isApproved:            false,
    registrationFeePaid:   false,
    studentStatus:         STUDENT_STATUS.ACTIVE,
    isReEnrollment:        true,
  });

  // Payment represents the first course installment (re-enrollment has no separate registration fee)
  await paymentRepository.create({
    user:              userId,
    student:           enrollment._id,
    type:              'registration_fee',  // keeps the coordinator approval UI working
    amount:            firstInstallment.amount,
    currency:          feeStructure.currency?.toLowerCase() ?? 'inr',
    status:            'pending_review',
    receiptUrl:        uploaded.secure_url,
    receiptPublicId:   uploaded.public_id,
    paymentMethod:     paymentMethod || 'other',
    transactionId:     transactionId ?? '',
    studentNote:       studentNote ?? '',
  });

  // Notify coordinators and admins about the re-enrollment request
  notifyRole(
    [ROLES.BRANCH_COORDINATOR, ROLES.BRANCH_ADMIN, ROLES.SUPER_ADMIN],
    {
      type:    NOTIFICATION_TYPES.ENROLLMENT_REQUESTED,
      title:   'Re-Enrollment Request',
      message: `A graduated student has requested enrollment in ${course.name}. Please review and approve.`,
      data:    { studentId: enrollment._id, courseId, courseName: course.name },
    }
  ).catch(() => {});

  return enrollment;
};

export const studentService = {
  listStudents,
  assignBatch,
  getStudentById,
  getMyProfile,
  updateMyProfile,
  approveStudent,
  updateStudentStatus,
  updateStudent,
  setMicrosoftEmail,
  provisionTaskSheet,
  reshareTaskSheet,
  resetTaskSheet,
  getAcademicSummary,
  getMyEnrollments,
  requestReEnrollment,
};
