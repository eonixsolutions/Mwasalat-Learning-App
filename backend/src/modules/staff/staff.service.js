import crypto from 'crypto';
import { staffRepository } from './staff.repository.js';
import { authRepository } from '../auth/auth.repository.js';
import { studentRepository } from '../student/student.repository.js';
import { AppError } from '../../utils/AppError.js';
import { ROLES } from '../../constants/index.js';

const INVITABLE_ROLES = [
  ROLES.BRANCH_ADMIN,
  ROLES.BRANCH_COORDINATOR,
  ROLES.TECHNICAL_MENTOR,
  ROLES.COMMUNICATION_MENTOR,
];

const INVITE_EXPIRY_DAYS = 7;

// ── Invites ──────────────────────────────────────────────────────

const createInvite = async ({ role, email, createdBy }) => {
  if (email) {
    const existing = await authRepository.findByEmail(email);
    if (existing) {
      throw new AppError(
        'This email is already registered. Use the Manage Roles option on the Staff page to add roles to existing staff.',
        409
      );
    }
  }
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  return staffRepository.createInvite({ token, role, email: email || null, createdBy, expiresAt });
};

const validateInvite = async (token) => {
  const invite = await staffRepository.findInviteByToken(token);
  if (!invite) throw new AppError('Invalid invite link', 400);
  if (invite.isRevoked) throw new AppError('This invite link has been revoked', 400);
  if (invite.isUsed) throw new AppError('This invite link has already been used', 400);
  if (invite.expiresAt < new Date()) throw new AppError('This invite link has expired', 400);
  return invite;
};

const listInvites = async ({ role, isUsed, page = 1, limit = 20 } = {}) => {
  const filter = {};
  if (role) filter.role = role;
  if (isUsed !== undefined && isUsed !== '') filter.isUsed = isUsed === 'true' || isUsed === true;

  const skip = (page - 1) * limit;
  const [invites, total] = await Promise.all([
    staffRepository.findAllInvites(filter, { skip, limit }),
    staffRepository.countInvites(filter),
  ]);
  return { invites, pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / limit) } };
};

const revokeInvite = async (id) => {
  const invite = await staffRepository.updateInviteById(id, { isRevoked: true });
  if (!invite) throw new AppError('Invite not found', 404);
  return invite;
};

// ── Staff ────────────────────────────────────────────────────────

const listStaff = async ({ role, isApproved, isRejected, page = 1, limit = 20 } = {}) => {
  const filter = {};

  let approvalsQuery = false;
  if (isApproved !== undefined && isApproved !== '') {
    const val = isApproved === 'true' || isApproved === true;
    filter.isApproved = val ? true : { $ne: true };
    if (!val) approvalsQuery = true;
  }
  if (isRejected !== undefined && isRejected !== '') {
    const val = isRejected === 'true' || isRejected === true;
    filter.isRejected = val ? true : { $ne: true };
  }

  const skip = (page - 1) * limit;

  // For the approvals tab (unapproved staff), only show email-verified users
  // When filtering by role, check user.roles (authoritative array) instead of staff.role (original registration role)
  // so that users with multiple roles appear in all relevant tabs
  let findFn, countFn;
  if (approvalsQuery) {
    findFn = (f, opts) => staffRepository.findVerifiedPendingStaff(f, opts);
    countFn = (f) => staffRepository.countVerifiedPendingStaff(f);
  } else if (role) {
    findFn = (f, opts) => staffRepository.findAllStaffByRole(role, f, opts);
    countFn = (f) => staffRepository.countStaffByRole(role, f);
  } else {
    findFn = staffRepository.findAllStaff;
    countFn = staffRepository.countStaff;
  }

  const [staff, total] = await Promise.all([
    findFn(filter, { skip, limit }),
    countFn(filter),
  ]);
  return { staff, pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / limit) } };
};

const approveStaff = async (id, approvedBy) => {
  const staff = await staffRepository.findStaffById(id);
  if (!staff) throw new AppError('Staff member not found', 404);
  if (staff.isApproved) throw new AppError('Staff member is already approved', 400);
  if (staff.isRejected) throw new AppError('Cannot approve a rejected staff member', 400);
  return staffRepository.updateStaffById(id, {
    isApproved: true,
    approvedBy,
    approvedAt: new Date(),
  });
};

const rejectStaff = async (id, rejectedBy) => {
  const staff = await staffRepository.findStaffById(id);
  if (!staff) throw new AppError('Staff member not found', 404);
  if (staff.isRejected) throw new AppError('Staff member is already rejected', 400);
  if (staff.isApproved) throw new AppError('Cannot reject an already approved staff member', 400);
  return staffRepository.updateStaffById(id, {
    isRejected: true,
    rejectedBy,
    rejectedAt: new Date(),
  });
};

const assignStaff = async (id, { branches, batches }) => {
  const staff = await staffRepository.findStaffById(id);
  if (!staff) throw new AppError('Staff member not found', 404);
  if (!staff.isApproved) throw new AppError('Cannot assign branches to an unapproved staff member', 400);
  return staffRepository.updateStaffById(id, { branches, batches });
};

const updateMyProfile = async (userId, data) => {
  const staff = await staffRepository.findStaffByUserId(userId);
  if (!staff) throw new AppError('Staff profile not found', 404);

  const staffUpdates = {};
  const userUpdates  = {};

  if (data.microsoftEmail !== undefined) staffUpdates.microsoftEmail = data.microsoftEmail || null;
  if (data.phone?.trim())                userUpdates.phone = data.phone.trim();

  const prevEmail = staff.microsoftEmail;
  const newEmail  = staffUpdates.microsoftEmail;

  const User = (await import('../user/user.model.js')).default;
  await Promise.all([
    Object.keys(staffUpdates).length ? staffRepository.updateStaffById(staff._id, staffUpdates) : Promise.resolve(),
    Object.keys(userUpdates).length  ? User.findByIdAndUpdate(userId, userUpdates)               : Promise.resolve(),
  ]);

  // Retroactively share task sheets when a technical mentor sets their Microsoft email for the first time
  const updatedUser = await User.findById(userId).select('roles').lean();
  if (newEmail && newEmail !== prevEmail && updatedUser?.roles?.includes(ROLES.TECHNICAL_MENTOR)) {
    const batchIds = (staff.batches ?? []).map((b) => b._id ?? b);
    if (batchIds.length) {
      const Student = (await import('../student/student.model.js')).default;
      const { msgraphService } = await import('../../services/msgraph.service.js');
      const students = await Student.find({
        batch: { $in: batchIds },
        taskSheetStatus: 'done',
        taskSheetFolderId: { $ne: null },
      }).select('taskSheetFolderId').lean();
      Promise.allSettled(
        students.map((s) =>
          msgraphService.shareWithUser(
            s.taskSheetFolderId,
            newEmail,
            'read',
            'Task sheet access granted for your students on Eonix.'
          )
        )
      ).catch(() => {});
    }
  }

  return staffRepository.findStaffById(staff._id);
};

const getMyProfile = async (userId) => {
  const staff = await staffRepository.findStaffByUserId(userId);
  if (!staff) throw new AppError('Staff profile not found', 404);
  return staffRepository.findStaffById(staff._id);
};

const manageRoles = async (staffId, { action, role }) => {
  if (!INVITABLE_ROLES.includes(role)) throw new AppError('Invalid role', 400);

  const staff = await staffRepository.findStaffWithUserById(staffId);
  if (!staff) throw new AppError('Staff member not found', 404);

  const userId = staff.user._id ?? staff.user;
  const userRoles = staff.user.roles ?? [];

  if (action === 'add') {
    if (userRoles.includes(role)) throw new AppError('User already has this role', 409);
    await authRepository.addRoleToUser(userId, role);
    const newRoles = [...userRoles, role];
    import('../../sockets/socket.js').then(({ emitToUser }) => {
      emitToUser(userId.toString(), 'roles_updated', { roles: newRoles });
    }).catch(() => {});
    return { roles: newRoles };
  }

  if (action === 'remove') {
    if (!userRoles.includes(role)) throw new AppError('User does not have this role', 400);
    if (userRoles.length <= 1) throw new AppError('Cannot remove the only role from a user', 400);
    await authRepository.removeRoleFromUser(userId, role);
    const newRoles = userRoles.filter((r) => r !== role);
    import('../../sockets/socket.js').then(({ emitToUser }) => {
      emitToUser(userId.toString(), 'roles_updated', { roles: newRoles });
    }).catch(() => {});
    return { roles: newRoles };
  }

  throw new AppError('action must be "add" or "remove"', 400);
};

const setMicrosoftEmail = async (staffId, microsoftEmail) => {
  const staff = await staffRepository.findStaffById(staffId);
  if (!staff) throw new AppError('Staff not found', 404);
  await staffRepository.updateStaffById(staffId, { microsoftEmail });

  // Retroactively share task sheet folders for all provisioned students in this mentor's batches
  if (microsoftEmail && staff.role === 'technical_mentor') {
    const batchIds = (staff.batches ?? []).map((b) => b._id ?? b);
    if (batchIds.length) {
      const Student = (await import('../student/student.model.js')).default;
      const { msgraphService } = await import('../../services/msgraph.service.js');
      const students = await Student.find({
        batch: { $in: batchIds },
        taskSheetStatus: 'done',
        taskSheetFolderId: { $ne: null },
      }).select('taskSheetFolderId').lean();

      Promise.allSettled(
        students.map((s) =>
          msgraphService.shareWithUser(
            s.taskSheetFolderId,
            microsoftEmail,
            'read',
            'Task sheet access granted for your students on Eonix.'
          )
        )
      ).catch(() => {});
    }
  }

  return staff;
};

const getMyStudents = async (userId, { page = 1, limit = 20, search = '' } = {}) => {
  const staff = await staffRepository.findStaffByUserId(userId);
  if (!staff) throw new AppError('Staff profile not found', 404);

  const batchIds = (staff.batches ?? []).map((b) => b._id ?? b);
  if (!batchIds.length) return { students: [], pagination: { total: 0, page: 1, limit, pages: 0 } };

  const filter = { batch: { $in: batchIds }, isApproved: true };
  if (search) filter['$or'] = []; // handled below via populate — simple name search needs aggregation; skip for now

  const skip = (page - 1) * limit;
  const [students, total] = await Promise.all([
    studentRepository.findAll(filter, { skip, limit }),
    studentRepository.countAll(filter),
  ]);
  return { students, pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / limit) } };
};

const getMyCourses = async (userId) => {
  const staff = await staffRepository.findStaffByUserId(userId);
  if (!staff) throw new AppError('Staff profile not found', 404);

  const batchIds = (staff.batches ?? []).map((b) => b._id ?? b);
  if (!batchIds.length) return [];

  const Student = (await import('../student/student.model.js')).default;
  const Course  = (await import('../course/course.model.js')).default;

  const courseIds = await Student.distinct('course', { batch: { $in: batchIds }, isApproved: true });
  if (!courseIds.length) return [];

  return Course.find({ _id: { $in: courseIds } }).lean();
};

export const staffService = {
  createInvite,
  assignStaff,
  validateInvite,
  listInvites,
  revokeInvite,
  listStaff,
  approveStaff,
  rejectStaff,
  manageRoles,
  getMyProfile,
  updateMyProfile,
  getMyStudents,
  getMyCourses,
  setMicrosoftEmail,
};
