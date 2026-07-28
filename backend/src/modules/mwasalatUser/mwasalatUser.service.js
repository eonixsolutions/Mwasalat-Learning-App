import crypto from 'crypto';
import mongoose from 'mongoose';
import MwasalatUser from './mwasalatUser.model.js';
import MwasalatDepartment from '../mwasalatDepartment/mwasalatDepartment.model.js';
import { AppError } from '../../utils/AppError.js';
import { MWASALAT_ROLES } from './mwasalatUser.constants.js';
import { sendEmail } from '../../utils/mailer.js';
import { instructorInviteTemplate, platformAdminInviteTemplate, staffInviteTemplate, accountBlockedTemplate, bulkImportInviteTemplate } from './mwasalatEmailTemplates.js';
import logger from '../../utils/logger.js';
import { mwasalatActivityLogService } from '../mwasalatActivityLog/mwasalatActivityLog.service.js';
import { parseCsv } from '../../utils/csv.js';
import { mwasalatDepartmentScope } from './mwasalatDepartmentScope.js';
import MwasalatEnrollment from '../mwasalatProgram/mwasalatEnrollment.model.js';
import MwasalatProgram from '../mwasalatProgram/mwasalatProgram.model.js';
import { ENROLLMENT_STATUS } from '../mwasalatProgram/mwasalatProgram.constants.js';
import { mwasalatProgramService } from '../mwasalatProgram/mwasalatProgram.service.js';
import { mwasalatNotificationService } from '../mwasalatNotification/mwasalatNotification.service.js';

// Admin roles are deliberately excluded — a spreadsheet shouldn't be able to mint
// super_admin/platform_admin accounts; those are still created by hand.
// Instructors are onboarded via invite only (see inviteInstructor) — bulk import is learner-only.
const ALLOWED_IMPORT_ROLES = [MWASALAT_ROLES.LEARNER];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_IMPORT_ROWS = 500;

// Platform Admin operates every non-super-admin tier of account and is walled
// off from Super Admin/Platform Admin accounts entirely — it should never even
// be able to discover who the other platform/super admins are via a role filter.
const PLATFORM_ADMIN_MANAGED_ROLES = [
  MWASALAT_ROLES.DEPARTMENT_ADMIN, MWASALAT_ROLES.SUPERVISOR, MWASALAT_ROLES.INSTRUCTOR,
  MWASALAT_ROLES.IT_SUPPORT, MWASALAT_ROLES.LEARNER, MWASALAT_ROLES.EXTERNAL_LEARNER,
];

const listByRole = async (role, actor) => {
  if (actor?.role === MWASALAT_ROLES.PLATFORM_ADMIN) {
    if (role && !PLATFORM_ADMIN_MANAGED_ROLES.includes(role)) {
      throw new AppError('You do not have permission to view this data', 403);
    }
    const filter = role ? { role } : { role: { $in: PLATFORM_ADMIN_MANAGED_ROLES } };
    return MwasalatUser.find(filter).sort({ createdAt: -1 }).populate('department', 'name nameAr');
  }

  // Same role tier as Platform Admin (never super/platform admins), narrowed
  // further to just this actor's own department.
  if (mwasalatDepartmentScope.isDepartmentScoped(actor)) {
    if (role && !PLATFORM_ADMIN_MANAGED_ROLES.includes(role)) {
      throw new AppError('You do not have permission to view this data', 403);
    }
    const filter = role
      ? { role, department: actor.department }
      : { role: { $in: PLATFORM_ADMIN_MANAGED_ROLES }, department: actor.department };
    return MwasalatUser.find(filter).sort({ createdAt: -1 }).populate('department', 'name nameAr');
  }

  const filter = role ? { role } : {};
  return MwasalatUser.find(filter).sort({ createdAt: -1 }).populate('department', 'name nameAr');
};

const inviteInstructor = async ({ name, email }, actor) => {
  const existing = await MwasalatUser.findOne({ email });
  if (existing) throw new AppError('A user with this email already exists', 409);

  const invitationToken = crypto.randomBytes(32).toString('hex');
  const placeholderPassword = crypto.randomBytes(16).toString('hex');

  const user = await MwasalatUser.create({
    name,
    email,
    password: placeholderPassword,
    role: MWASALAT_ROLES.INSTRUCTOR,
    isActive: true,
    passwordSet: false,
    invitationToken,
    invitationExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const setPasswordUrl = `${process.env.CLIENT_URL}/instructor/set-password/${invitationToken}`;
  await sendEmail({
    to: email,
    subject: 'You\'re invited to Mwasalat Learning Platform',
    html: instructorInviteTemplate({ name, setPasswordUrl }),
  });

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'invite_instructor', targetType: 'MwasalatUser', targetId: user._id, metadata: { email },
  });

  return user;
};

// Super Admin's one and only write action — provisioning the single operator
// it delegates day-to-day platform control to. Only one platform_admin
// account may exist at a time (enforced below); if that account is still
// pending (hasn't set a password yet), calling this again re-sends its
// invite instead of erroring, so a mistyped/expired invite isn't a dead end.
const invitePlatformAdmin = async ({ name, email }, actor) => {
  const existingAdmin = await MwasalatUser.findOne({ role: MWASALAT_ROLES.PLATFORM_ADMIN });

  if (existingAdmin) {
    if (existingAdmin.email !== email || existingAdmin.passwordSet) {
      throw new AppError('A platform admin already exists — edit the existing account instead.', 409);
    }

    existingAdmin.name = name;
    existingAdmin.invitationToken = crypto.randomBytes(32).toString('hex');
    existingAdmin.invitationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await existingAdmin.save();

    const resendUrl = `${process.env.CLIENT_URL}/set-password/${existingAdmin.invitationToken}`;
    await sendEmail({
      to: email,
      subject: 'You\'re invited to Mwasalat Learning Platform',
      html: platformAdminInviteTemplate({ name, setPasswordUrl: resendUrl }),
    });

    mwasalatActivityLogService.record({
      actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
      action: 'resend_platform_admin_invite', targetType: 'MwasalatUser', targetId: existingAdmin._id, metadata: { email },
    });

    return existingAdmin;
  }

  const existingByEmail = await MwasalatUser.findOne({ email });
  if (existingByEmail) throw new AppError('A user with this email already exists', 409);

  const invitationToken = crypto.randomBytes(32).toString('hex');
  const placeholderPassword = crypto.randomBytes(16).toString('hex');

  const user = await MwasalatUser.create({
    name,
    email,
    password: placeholderPassword,
    role: MWASALAT_ROLES.PLATFORM_ADMIN,
    isActive: true,
    passwordSet: false,
    invitationToken,
    invitationExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const setPasswordUrl = `${process.env.CLIENT_URL}/set-password/${invitationToken}`;
  await sendEmail({
    to: email,
    subject: 'You\'re invited to Mwasalat Learning Platform',
    html: platformAdminInviteTemplate({ name, setPasswordUrl }),
  });

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'invite_platform_admin', targetType: 'MwasalatUser', targetId: user._id, metadata: { email },
  });

  return user;
};

// Super Admin's other write action on Platform Admin — correcting the single
// account's name/email after it's been provisioned. Scoped to platform_admin
// targets only so this can't be used to rename an arbitrary user.
//
// Email is the login identity, so changing it doesn't just overwrite a field —
// it re-runs the same invite/set-password flow the account was originally
// provisioned through (passwordSet: false, fresh invitationToken, a new email
// sent). Silently repointing an already-verified session at an address nobody
// has confirmed they control would defeat the point of the invite step in the
// first place. Reassigning `password` here also trips the pre-save hook that
// bumps tokenVersion (mwasalatUser.model.js), invalidating any refresh tokens
// already issued under the old identity — same as resetPassword.
const updatePlatformAdmin = async (id, { name, email }, actor) => {
  const target = await MwasalatUser.findById(id).select('+tokenVersion');
  if (!target) throw new AppError('User not found', 404);
  if (target.role !== MWASALAT_ROLES.PLATFORM_ADMIN) {
    throw new AppError('You do not have permission to perform this action', 403);
  }

  const emailChanged = email !== target.email;
  if (emailChanged) {
    const existingByEmail = await MwasalatUser.findOne({ email });
    if (existingByEmail) throw new AppError('A user with this email already exists', 409);
  }

  target.name = name;

  if (emailChanged) {
    target.email = email;
    target.password = crypto.randomBytes(16).toString('hex');
    target.passwordSet = false;
    target.invitationToken = crypto.randomBytes(32).toString('hex');
    target.invitationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const user = await target.save();

  if (emailChanged) {
    const setPasswordUrl = `${process.env.CLIENT_URL}/set-password/${user.invitationToken}`;
    await sendEmail({
      to: email,
      subject: 'You\'re invited to Mwasalat Learning Platform',
      html: platformAdminInviteTemplate({ name, setPasswordUrl }),
    });
  }

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: emailChanged ? 'update_platform_admin_email' : 'update_platform_admin',
    targetType: 'MwasalatUser', targetId: user._id, metadata: { name, email },
  });

  // tokenVersion was only loaded to let the pre-save hook bump it correctly —
  // strip it back out so it doesn't leak into the API response (every other
  // route leaves it unselected for exactly this reason).
  user.tokenVersion = undefined;

  return user;
};

// Provisions the three staff roles added alongside Department-Based Access:
// Department Admin, Supervisor, IT Support. Mirrors inviteInstructor's flow —
// Platform Admin is the only role allowed to create these (see routes).
const INVITABLE_STAFF_ROLES = [MWASALAT_ROLES.DEPARTMENT_ADMIN, MWASALAT_ROLES.SUPERVISOR, MWASALAT_ROLES.IT_SUPPORT];

const inviteStaff = async ({ name, email, role, department }, actor) => {
  if (!INVITABLE_STAFF_ROLES.includes(role)) {
    throw new AppError(`Role must be one of: ${INVITABLE_STAFF_ROLES.join(', ')}`, 400);
  }
  if (role === MWASALAT_ROLES.DEPARTMENT_ADMIN && !department) {
    throw new AppError('A department must be selected for a department admin', 400);
  }

  const existing = await MwasalatUser.findOne({ email });
  if (existing) throw new AppError('A user with this email already exists', 409);

  if (department) {
    const dept = await MwasalatDepartment.findById(department);
    if (!dept) throw new AppError('Selected department not found', 400);
  }

  const invitationToken = crypto.randomBytes(32).toString('hex');
  const placeholderPassword = crypto.randomBytes(16).toString('hex');

  const user = await MwasalatUser.create({
    name,
    email,
    password: placeholderPassword,
    role,
    department: department || null,
    isActive: true,
    passwordSet: false,
    invitationToken,
    invitationExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const setPasswordUrl = `${process.env.CLIENT_URL}/set-password/${invitationToken}`;
  await sendEmail({
    to: email,
    subject: 'You\'re invited to Mwasalat Learning Platform',
    html: staffInviteTemplate({ name, role, setPasswordUrl }),
  });

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'invite_staff', targetType: 'MwasalatUser', targetId: user._id, metadata: { email, role },
  });

  return user;
};

// Department-Based Access — assigns which department a user's queries get
// scoped to (see mwasalatDepartmentScope.js). Super Admin/Platform Admin only;
// a department admin can't reassign their own or others' department.
const assignDepartment = async (id, departmentId, actor) => {
  const target = await MwasalatUser.findById(id);
  if (!target) throw new AppError('User not found', 404);

  if (departmentId) {
    const dept = await MwasalatDepartment.findById(departmentId);
    if (!dept) throw new AppError('Selected department not found', 400);
  }

  target.department = departmentId || null;
  await target.save();

  // Moving an internal learner into a department should immediately land any
  // mandatory course already assigned to it (or open to all internal
  // learners) — mirrors the same sync bulkImport runs for newly-created rows.
  if (target.role === MWASALAT_ROLES.LEARNER && departmentId) {
    try {
      await mwasalatProgramService.syncMandatoryEnrollmentsForLearners([target._id], { departmentId });
    } catch (err) {
      logger.error(`[mwasalat-user] Mandatory auto-enroll failed after department assignment for ${target._id}: ${err.message}`);
    }
  }

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'assign_department', targetType: 'MwasalatUser', targetId: target._id, metadata: { departmentId: departmentId || null },
  });

  return target;
};

// Supervisor-to-Employee Mapping — sets which supervisor approves this
// learner's enrollments/completions (see mwasalatProgram.service.js).
const assignSupervisor = async (id, supervisorId, actor) => {
  const target = await MwasalatUser.findById(id);
  if (!target) throw new AppError('User not found', 404);

  if (supervisorId) {
    if (supervisorId === id) throw new AppError('A user cannot be their own supervisor', 400);
    const supervisor = await MwasalatUser.findById(supervisorId);
    if (!supervisor || supervisor.role !== MWASALAT_ROLES.SUPERVISOR) {
      throw new AppError('Selected supervisor is not a valid supervisor account', 400);
    }
  }

  target.supervisor = supervisorId || null;
  await target.save();

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'assign_supervisor', targetType: 'MwasalatUser', targetId: target._id, metadata: { supervisorId: supervisorId || null },
  });

  return target;
};

// Each admin tier may only act on the tier it's responsible for: Platform
// Admin runs day-to-day staff/learner accounts, Super Admin's sole action is
// governing Platform Admin accounts. Enforced here, not just hidden in the UI.
const ALLOWED_ACTIVE_TARGETS = {
  [MWASALAT_ROLES.PLATFORM_ADMIN]: PLATFORM_ADMIN_MANAGED_ROLES,
  [MWASALAT_ROLES.SUPER_ADMIN]: [MWASALAT_ROLES.PLATFORM_ADMIN],
};

const setActive = async (id, isActive, reason, actor) => {
  if (!isActive && !reason?.trim()) {
    throw new AppError('A reason is required to block a user', 400);
  }

  const target = await MwasalatUser.findById(id);
  if (!target) throw new AppError('User not found', 404);

  const allowedTargetRoles = ALLOWED_ACTIVE_TARGETS[actor?.role] ?? [];
  if (!allowedTargetRoles.includes(target.role)) {
    throw new AppError('You do not have permission to perform this action', 403);
  }

  target.isActive = isActive;
  const user = await target.save();

  if (!isActive) {
    sendEmail({
      to: user.email,
      subject: 'Your Mwasalat Learning Platform account has been blocked',
      html: accountBlockedTemplate({ name: user.name, reason: reason.trim() }),
    }).catch((err) => logger.error(`[mwasalat-user] Block notification email failed for ${user.email}: ${err.message}`));
  }

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: isActive ? 'unblock_user' : 'block_user', targetType: 'MwasalatUser', targetId: user._id,
    metadata: { targetName: user.name, reason: isActive ? undefined : reason?.trim() },
  });

  return user;
};

// CSV columns: name, email, role (optional, must be 'learner' if present), phone (optional).
// Learner-only — instructors are onboarded via inviteInstructor. Each created row goes
// through the same invite/set-password flow: an account exists immediately but stays
// inactive-for-login until the person sets their own password.
// Department Admin-only (see routes) — every row created lands in the actor's own
// department, so imported learners are visible in their department roster immediately
// instead of needing a manual department assignment afterward.
const bulkImport = async (fileBuffer, actor) => {
  if (!actor?.department) throw new AppError('Your account has no department assigned — contact Platform Admin', 400);

  const rows = parseCsv(fileBuffer.toString('utf8'));
  if (!rows.length) throw new AppError('CSV file is empty', 400);

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const nameIdx = header.indexOf('name');
  const emailIdx = header.indexOf('email');
  const roleIdx = header.indexOf('role');
  const phoneIdx = header.indexOf('phone');
  if (nameIdx === -1 || emailIdx === -1 || phoneIdx === -1) {
    throw new AppError('CSV must include "name", "email", and "phone" columns', 400);
  }

  const dataRows = rows.slice(1).filter((r) => r.some((cell) => cell.trim() !== ''));
  if (!dataRows.length) throw new AppError('CSV has no data rows', 400);
  if (dataRows.length > MAX_IMPORT_ROWS) throw new AppError(`CSV is limited to ${MAX_IMPORT_ROWS} rows per import`, 400);

  const results = { created: 0, skipped: 0, skippedRows: [], errors: [] };
  const createdLearnerIds = [];

  for (let i = 0; i < dataRows.length; i += 1) {
    const row = dataRows[i];
    const rowNumber = i + 2; // account for the header row, 1-indexed
    const name = row[nameIdx]?.trim();
    const email = row[emailIdx]?.trim().toLowerCase();
    const roleRaw = roleIdx !== -1 ? row[roleIdx]?.trim().toLowerCase() : '';
    const phone = row[phoneIdx]?.trim();
    const role = roleRaw || MWASALAT_ROLES.LEARNER;

    if (!name || !email || !phone) {
      results.errors.push({ row: rowNumber, email, reason: 'Missing name, email, or phone' });
      continue; // eslint-disable-line no-continue
    }
    if (!EMAIL_REGEX.test(email)) {
      results.errors.push({ row: rowNumber, email, reason: 'Invalid email format' });
      continue; // eslint-disable-line no-continue
    }
    if (!ALLOWED_IMPORT_ROLES.includes(role)) {
      results.errors.push({ row: rowNumber, email, reason: `Role must be one of: ${ALLOWED_IMPORT_ROLES.join(', ')}` });
      continue; // eslint-disable-line no-continue
    }

    // eslint-disable-next-line no-await-in-loop
    const existing = await MwasalatUser.findOne({ email });
    if (existing) {
      results.skipped += 1;
      results.skippedRows.push({ row: rowNumber, email, reason: 'An account with this email already exists' });
      continue; // eslint-disable-line no-continue
    }

    const invitationToken = crypto.randomBytes(32).toString('hex');
    const placeholderPassword = crypto.randomBytes(16).toString('hex');

    // eslint-disable-next-line no-await-in-loop
    const createdUser = await MwasalatUser.create({
      name,
      email,
      phone,
      role,
      department: actor.department,
      password: placeholderPassword,
      isActive: true,
      passwordSet: false,
      invitationToken,
      invitationExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    if (role === MWASALAT_ROLES.LEARNER) createdLearnerIds.push(createdUser._id);

    const setPasswordUrl = `${process.env.CLIENT_URL}/set-password/${invitationToken}`;
    sendEmail({
      to: email,
      subject: 'Your Mwasalat Learning Platform account is ready',
      html: bulkImportInviteTemplate({ name, role, setPasswordUrl }),
    }).catch((err) => logger.error(`[mwasalat-user] Bulk import invite email failed for ${email}: ${err.message}`));

    results.created += 1;
  }

  // Every imported learner lands in actor.department — land any mandatory
  // course already assigned to it (or open to all internal learners) on them
  // immediately, same as a fresh account should never have to go find it.
  if (createdLearnerIds.length) {
    try {
      await mwasalatProgramService.syncMandatoryEnrollmentsForLearners(createdLearnerIds, { departmentId: actor.department });
    } catch (err) {
      logger.error(`[mwasalat-user] Mandatory auto-enroll failed after bulk import: ${err.message}`);
    }
  }

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'bulk_import_users', targetType: 'MwasalatUser',
    metadata: { created: results.created, skipped: results.skipped, errorCount: results.errors.length },
  });

  return results;
};

const MONGOOSE_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

// Read-only operational snapshot for the IT Support dashboard — platform
// health plus account-status counts, no business/content data (matches the
// role's scope: activity logs, user status, system health, nothing else).
const getItSupportOverview = async () => {
  const dbState = MONGOOSE_STATES[mongoose.connection.readyState] || 'unknown';
  const isUp = mongoose.connection.readyState === 1;

  const [active, blocked, invited, recentLockouts] = await Promise.all([
    MwasalatUser.countDocuments({ isActive: true }),
    MwasalatUser.countDocuments({ isActive: false }),
    // Invited-but-not-yet-activated: local accounts (invite/bulk-import) that
    // haven't set a password yet. Google sign-ins also start passwordSet:false
    // but were never "invited" — excluded so this count means what it says.
    MwasalatUser.countDocuments({ passwordSet: false, authProvider: 'local' }),
    MwasalatUser.find({ lockedUntil: { $gt: new Date() } })
      .select('name email role +lockedUntil +failedLoginAttempts')
      .sort({ lockedUntil: -1 })
      .limit(10),
  ]);

  return {
    health: { status: isUp ? 'ok' : 'degraded', uptimeSeconds: Math.floor(process.uptime()), db: dbState },
    userCounts: { active, blocked, invited },
    recentLockouts,
  };
};

// Direct-reports roster + enrollment/completion progress for the Supervisor
// dashboard's "My Team" panel — read-only, no approval/sign-off gate (that's
// a separate, not-yet-built manager-approval workflow). Reuses the existing
// `supervisor` field on MwasalatUser (see mwasalatUser.model.js), which was
// already wired up for exactly this by an earlier session.
const getMyTeamOverview = async (actor) => {
  const reports = await MwasalatUser.find(
    { supervisor: actor._id }, 'name email role isActive lastLogin'
  ).sort({ name: 1 });
  const reportIds = reports.map((r) => r._id);

  const enrollments = await MwasalatEnrollment.find(
    { learner: { $in: reportIds }, status: { $ne: ENROLLMENT_STATUS.REJECTED } },
    'learner program status purchasedAt approvedAt reactivatedAt'
  );

  // Only mandatory courses with a deadline can ever produce an overdue row —
  // narrow the program lookup to just those before computing due dates.
  const programIds = [...new Set(enrollments.map((e) => e.program.toString()))];
  const mandatoryPrograms = await MwasalatProgram.find(
    { _id: { $in: programIds }, isMandatory: true, expectedCompletionDays: { $ne: null } },
    'title titleAr expectedCompletionDays'
  );
  const mandatoryProgramById = new Map(mandatoryPrograms.map((p) => [p._id.toString(), p]));

  const statsByLearner = {};
  const overdueByLearner = {};
  enrollments.forEach((e) => {
    const key = e.learner.toString();
    statsByLearner[key] ??= { enrolledCount: 0, completedCount: 0 };
    statsByLearner[key].enrolledCount += 1;
    if (e.status === ENROLLMENT_STATUS.COMPLETED) {
      statsByLearner[key].completedCount += 1;
      return;
    }

    const program = mandatoryProgramById.get(e.program.toString());
    if (!program) return;
    const dueAt = mwasalatProgramService.computeDueAt(e, program);
    if (!dueAt || Date.now() < dueAt.getTime()) return;

    overdueByLearner[key] ??= [];
    overdueByLearner[key].push({
      programId: program._id, title: program.title, titleAr: program.titleAr, dueAt,
    });
  });

  return reports.map((r) => ({
    _id: r._id,
    name: r.name,
    email: r.email,
    role: r.role,
    isActive: r.isActive,
    lastLogin: r.lastLogin,
    enrolledCount: statsByLearner[r._id.toString()]?.enrolledCount ?? 0,
    completedCount: statsByLearner[r._id.toString()]?.completedCount ?? 0,
    overdueCourses: overdueByLearner[r._id.toString()] ?? [],
  }));
};

// Manual, supervisor-triggered escalation (not automatic) — the daily
// deadline sweep only ever notifies the supervisor; deciding whether/when to
// involve Platform Admin is the supervisor's own call. Verifies the target is
// actually one of this supervisor's direct reports before fanning out.
const escalateOverdueToAdmin = async (supervisorId, learnerId, programId, actor) => {
  const learner = await MwasalatUser.findOne({ _id: learnerId, supervisor: supervisorId }, 'name email');
  if (!learner) throw new AppError('This learner is not one of your direct reports', 403);

  const program = await MwasalatProgram.findById(programId, 'title');
  if (!program) throw new AppError('Program not found', 404);

  const admins = await MwasalatUser.find({ role: MWASALAT_ROLES.PLATFORM_ADMIN, isActive: true }, '_id');
  if (!admins.length) throw new AppError('No active Platform Admin account to notify', 404);

  const notification = await mwasalatNotificationService.notifyUsers(
    supervisorId,
    admins.map((a) => a._id),
    {
      title: 'Supervisor escalation: overdue mandatory course',
      message: `${actor?.name ?? 'A supervisor'} reports that ${learner.name} (${learner.email}) has not completed "${program.title}", which is past its deadline.`,
      type: 'supervisor_escalation',
    }
  );

  mwasalatActivityLogService.record({
    actorId: actor?._id, actorName: actor?.name, actorRole: actor?.role,
    action: 'escalate_overdue_to_admin', targetType: 'MwasalatUser', targetId: learner._id,
    metadata: { learnerName: learner.name, programTitle: program.title },
  });

  return notification;
};

export const mwasalatUserService = {
  listByRole, inviteInstructor, invitePlatformAdmin, updatePlatformAdmin, inviteStaff, setActive, bulkImport,
  assignDepartment, assignSupervisor, getItSupportOverview, getMyTeamOverview, escalateOverdueToAdmin,
};
