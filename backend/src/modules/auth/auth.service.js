import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { authRepository } from './auth.repository.js';
import { AppError } from '../../utils/AppError.js';
import { sendEmail } from '../../utils/mailer.js';
import { verifyEmailTemplate, resetPasswordTemplate } from '../../utils/emailTemplates.js';
import logger from '../../utils/logger.js';
import { ROLES } from '../../constants/index.js';
import { uploadBuffer } from '../../config/cloudinary.js';
import { paymentRepository } from '../payment/payment.repository.js';
import User from '../user/user.model.js';
import Staff from '../staff/staff.model.js';
import { notifyUser } from '../notification/notification.service.js';
import { NOTIFICATION_TYPES } from '../../constants/index.js';

const STAFF_ROLES = [
  ROLES.BRANCH_ADMIN,
  ROLES.BRANCH_COORDINATOR,
  ROLES.TECHNICAL_MENTOR,
  ROLES.COMMUNICATION_MENTOR,
];

const generateAccessToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  });

const generateRefreshToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });

const register = async ({ name, email, password, phone, courseId, branchId, location, educationQualification, mentorshipMode, paymentMethod, transactionId, studentNote }, file) => {
  const course = await authRepository.findActiveCourseById(courseId);
  if (!course) throw new AppError('Selected course is not available', 400);

  const existing = await authRepository.findByEmail(email);
  if (existing) throw new AppError('Email already in use', 409);

  const uploaded = await uploadBuffer(file.buffer, {
    folder: 'eonix/payment-receipts',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  });

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const user = await authRepository.create({
    name,
    email,
    password,
    phone,
    roles: [ROLES.STUDENT],
    emailVerificationToken: verificationToken,
  });

  const studentProfile = await authRepository.createStudentProfile({
    user: user._id,
    course: courseId,
    ...(branchId ? { branch: branchId } : {}),
    location,
    educationQualification,
    mentorshipMode,
  });

  await paymentRepository.create({
    user:            user._id,
    student:         studentProfile._id,
    type:            'registration_fee',
    amount:          1000,
    currency:        'inr',
    status:          'pending_review',
    receiptUrl:      uploaded.secure_url,
    receiptPublicId: uploaded.public_id,
    paymentMethod:   paymentMethod || 'other',
    transactionId:   transactionId ?? '',
    studentNote:     studentNote ?? '',
  });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
  await sendEmail({
    to: email,
    subject: 'Verify your Eonix account',
    html: verifyEmailTemplate({ name, verifyUrl }),
  });

  // Super admins always get notified
  const superAdmins = await User.find({ roles: 'super_admin', isActive: true }).select('_id');

  // Branch coordinators + branch admins: scope to the student's branch if provided, else notify all.
  // Queried separately (rather than one combined role-$in query) so a staff member who holds
  // BOTH roles gets a correctly-tagged notification for each — a single combined query can only
  // report one role per recipient, and guessing from their full roles array picks the wrong one
  // for multi-role staff (their notification then gets tagged with a role that's not the one
  // they were actively viewing, so it silently disappears from that role's notification list).
  const baseBranchFilter = {
    isApproved: true,
    ...(branchId ? { branches: branchId } : {}),
  };
  const [coordinators, branchAdmins] = await Promise.all([
    Staff.find({ ...baseBranchFilter, role: ROLES.BRANCH_COORDINATOR }).select('user'),
    Staff.find({ ...baseBranchFilter, role: ROLES.BRANCH_ADMIN }).select('user'),
  ]);

  const recipients = [
    ...superAdmins.map((u) => ({ id: u._id, targetRole: ROLES.SUPER_ADMIN })),
    ...branchAdmins.map((s) => ({ id: s.user, targetRole: ROLES.BRANCH_ADMIN })),
    ...coordinators.map((s) => ({ id: s.user, targetRole: ROLES.BRANCH_COORDINATOR })),
  ];

  await Promise.all(
    recipients.map(({ id, targetRole }) =>
      notifyUser(id, {
        type:    NOTIFICATION_TYPES.STUDENT_REGISTRATION,
        title:   'New Student Registration',
        message: `${name} has registered and submitted a payment receipt. Review and approve their account.`,
        data:    { studentUserId: user._id, studentName: name, phone, courseId, branchId: branchId ?? null },
        targetRole,
      })
    )
  );

  return { id: user._id, name: user.name, email: user.email };
};

const registerWithInvite = async ({ token, name, email, password, phone }) => {
  const { staffService } = await import('../staff/staff.service.js');
  const invite = await staffService.validateInvite(token);

  if (invite.email && invite.email !== email.toLowerCase()) {
    throw new AppError('This invite was issued for a different email address', 400);
  }

  const { staffRepository } = await import('../staff/staff.repository.js');

  const existing = await authRepository.findByEmail(email);
  if (existing) {
    if (existing.roles.includes(invite.role)) {
      throw new AppError('This role is already assigned to your account', 409);
    }
    await authRepository.addRoleToUser(existing._id, invite.role);

    const existingStaff = await authRepository.findStaffByUserId(existing._id);
    if (!existingStaff) {
      await authRepository.createStaffProfile({
        user: existing._id,
        role: invite.role,
        invitedBy: invite.createdBy,
        isApproved: !!invite.email,
      });
    }

    await staffRepository.updateInviteById(invite._id, {
      isUsed: true,
      usedBy: existing._id,
      usedAt: new Date(),
    });

    return { id: existing._id, name: existing.name, email: existing.email, role: invite.role, roleAdded: true };
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const user = await authRepository.create({
    name,
    email,
    password,
    phone,
    roles: [invite.role],
    emailVerificationToken: verificationToken,
  });

  await authRepository.createStaffProfile({
    user: user._id,
    role: invite.role,
    invitedBy: invite.createdBy,
    isApproved: !!invite.email,
  });

  await staffRepository.updateInviteById(invite._id, {
    isUsed: true,
    usedBy: user._id,
    usedAt: new Date(),
  });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
  await sendEmail({
    to: email,
    subject: 'Verify your Eonix account',
    html: verifyEmailTemplate({ name, verifyUrl }),
  });

  return { id: user._id, name: user.name, email: user.email, role: invite.role };
};

const login = async ({ email, password, activeRole }, ip) => {
  const user = await authRepository.findByEmailWithPassword(email);
  if (!user) throw new AppError('Invalid email or password', 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  if (!user.isEmailVerified) throw new AppError('Please verify your email before logging in', 403);

  const role = activeRole ?? (user.roles.length === 1 ? user.roles[0] : null);

  if (!role) {
    return { requiresRolePicker: true, roles: user.roles };
  }

  if (!user.roles.includes(role)) {
    throw new AppError('Your account does not have this role', 403);
  }

  let courseName = null;
  let studentProfile = null;
  let studentStatus = null;
  if (role === ROLES.STUDENT) {
    studentProfile = await authRepository.findStudentByUserId(user._id);
    if (!studentProfile) throw new AppError('Student profile not found. Contact support.', 403);
    if (studentProfile.studentStatus === 'dropped')
      throw new AppError('Your enrollment has been dropped. Please contact Eonix Solutions.', 403);
    // Graduated students are allowed to log in so they can request a new course
    if (studentProfile.studentStatus !== 'graduated') {
      if (!studentProfile.isApproved) {
        if (!studentProfile.registrationFeePaid && !studentProfile.isReEnrollment) {
          const pendingPayment = await paymentRepository.findPendingByStudent(studentProfile._id);
          if (pendingPayment) {
            throw new AppError(
              'Your payment screenshot is under review. We\'ll notify you once your account is activated.',
              403, null, 'PAYMENT_PENDING_REVIEW'
            );
          }
          throw new AppError('Please complete your registration fee payment.', 402, null, 'REGISTRATION_FEE_PENDING');
        }
        throw new AppError('Your account is pending coordinator approval. You\'ll receive an email once activated.', 403, null, 'ACCOUNT_APPROVAL_PENDING');
      }
    }
    studentStatus = studentProfile.studentStatus;
    await studentProfile.populate('course', 'name reviewType screenings');
    courseName = studentProfile.course?.name ?? null;
  }

  if (STAFF_ROLES.includes(role)) {
    const staffProfile = await authRepository.findStaffByUserId(user._id);
    if (!staffProfile) throw new AppError('Staff profile not found. Contact support.', 403);
    if (staffProfile.isRejected) throw new AppError('Your account registration was not approved. Please contact your administrator.', 403, null, 'STAFF_REJECTED');
    if (!staffProfile.isApproved) throw new AppError('Your account is pending admin approval.', 403, null, 'STAFF_APPROVAL_PENDING');
  }

  if (!user.isActive) throw new AppError('Your account has been deactivated. Contact support.', 403);

  const accessToken = generateAccessToken(user._id, role);
  const refreshToken = generateRefreshToken(user._id, role);

  await authRepository.addRefreshToken(user._id, refreshToken);
  await authRepository.updateLastLogin(user._id);

  logger.info(`Login: ${user.email} (role: ${role}) from ${ip}`);

  const courseExtra = {
    ...(courseName ? {
      courseName,
      courseReviewType: studentProfile?.course?.reviewType  ?? null,
      courseScreenings: studentProfile?.course?.screenings  ?? [],
    } : {}),
    ...(studentStatus ? { studentStatus } : {}),
  };
  return { accessToken, refreshToken, user: { ...user.toJSON(), role, ...courseExtra } };
};

const logout = async (userId, refreshToken) => {
  if (refreshToken) await authRepository.removeRefreshToken(userId, refreshToken);
};

const refreshAccessToken = async (token) => {
  if (!token) throw new AppError('Refresh token required', 401);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await authRepository.findById(decoded.id);
  if (!user) throw new AppError('User not found', 404);

  const tokenExists = user.refreshTokens?.some((t) => t.token === token);
  if (!tokenExists) throw new AppError('Refresh token revoked', 401);

  // decoded.role is set for tokens issued after the multi-role migration.
  // For old tokens without role, fall back to the DB roles array.
  // Use the raw MongoDB document to avoid Mongoose applying the ['student'] default
  // to users that haven't been migrated yet.
  let role = decoded.role;
  if (!role) {
    const rawUser = await import('../user/user.model.js').then(({ default: User }) =>
      User.collection.findOne({ _id: user._id })
    );
    role = rawUser?.roles?.[0] ?? rawUser?.role ?? user.roles[0];
  }
  return { accessToken: generateAccessToken(user._id, role) };
};

const switchRole = async (userId, newRole) => {
  const user = await authRepository.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  if (!user.roles.includes(newRole)) throw new AppError('Your account does not have this role', 403);

  if (STAFF_ROLES.includes(newRole)) {
    const staffProfile = await authRepository.findStaffByUserId(userId);
    if (!staffProfile) throw new AppError('Staff profile not found', 403);
    if (!staffProfile.isApproved) throw new AppError('Your account is pending admin approval.', 403);
  }

  const accessToken = generateAccessToken(userId, newRole);
  const refreshToken = generateRefreshToken(userId, newRole);
  await authRepository.addRefreshToken(userId, refreshToken);

  return { accessToken, refreshToken, user: { ...user.toJSON(), role: newRole } };
};

const verifyEmail = async (token) => {
  const user = await authRepository.findByVerificationToken(token);
  if (!user) throw new AppError('Invalid or expired verification token', 400);
  if (!user.isEmailVerified) await authRepository.markEmailVerified(user._id);

  if (user.roles.some((r) => STAFF_ROLES.includes(r))) {
    const staffProfile = await authRepository.findStaffByUserId(user._id);
    if (staffProfile && !staffProfile.isApproved && !staffProfile.isRejected) {
      const { notifyAdmins } = await import('../notification/notification.service.js');
      const primaryRole = user.roles.find((r) => STAFF_ROLES.includes(r));
      const roleLabel = primaryRole.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      await notifyAdmins({
        type: 'STAFF_APPROVAL_REQUEST',
        title: 'New Staff Registration',
        message: `${user.name} has registered as ${roleLabel} and is pending your approval.`,
        data: { staffUserId: user._id, role: primaryRole, name: user.name },
      });
    }
  }

  return { email: user.email, roles: user.roles };
};

const forgotPassword = async (email) => {
  const user = await authRepository.findByEmail(email);
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  await authRepository.setPasswordResetToken(user._id, resetToken, expiry);

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  await sendEmail({
    to: email,
    subject: 'Reset your Eonix password',
    html: resetPasswordTemplate({ resetUrl }),
  });
};

const resetPassword = async (token, newPassword) => {
  const user = await authRepository.findByPasswordResetToken(token);
  if (!user || user.passwordResetExpiry < new Date())
    throw new AppError('Invalid or expired reset token', 400);
  await authRepository.updatePassword(user._id, newPassword);
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await authRepository.findByIdWithPassword(userId);
  if (!user) throw new AppError('User not found', 404);
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect', 400);
  await authRepository.updatePassword(user._id, newPassword);
};

export const authService = {
  register,
  registerWithInvite,
  login,
  logout,
  refreshAccessToken,
  switchRole,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
};
