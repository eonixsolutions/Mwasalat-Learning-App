import { Router } from 'express';
import { mwasalatUserController } from './mwasalatUser.controller.js';
import { mwasalatAuthMiddleware } from '../mwasalatAuth/mwasalatAuth.middleware.js';
import { MWASALAT_ROLES } from './mwasalatUser.constants.js';
import { uploadCsv } from '../../middlewares/upload.js';
import { validate } from '../../middlewares/validate.js';
import {
  inviteUserSchema, inviteStaffSchema, setActiveSchema, assignDepartmentSchema, assignSupervisorSchema,
  updatePlatformAdminSchema,
} from './mwasalatUser.validation.js';

const router = Router();

router.use(mwasalatAuthMiddleware.authenticate);

const bothAdmins = mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN, MWASALAT_ROLES.PLATFORM_ADMIN);
const platformAdminOnly = mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.PLATFORM_ADMIN);
const superAdminOnly = mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN);
// Bulk import is exclusively Department Admin's — each row lands in the
// actor's own department (see bulkImport in the service), which only makes
// sense for the one role that actually has a department. Platform Admin
// manages people one at a time via invite instead.
const departmentAdminOnly = mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.DEPARTMENT_ADMIN);
// Read-only variant of bothAdmins for Department Admin — same view access,
// scoped to their own department in the service layer; not granted the
// write actions below (block/unblock, department/supervisor assignment).
const peopleViewers = mwasalatAuthMiddleware.authorize(
  MWASALAT_ROLES.SUPER_ADMIN, MWASALAT_ROLES.PLATFORM_ADMIN, MWASALAT_ROLES.DEPARTMENT_ADMIN
);

// Viewing the people list is shared; Super Admin's query is unrestricted,
// Platform Admin's is scoped to instructor/learner, and Department Admin's is
// further scoped to their own department — all in the service layer.
router.get('/', peopleViewers, mwasalatUserController.list);

// IT Support's read-only landing snapshot — platform health + account-status
// counts. Super Admin can also reach it (same convention as the activity-log route).
router.get(
  '/it-support/overview',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPER_ADMIN, MWASALAT_ROLES.IT_SUPPORT),
  mwasalatUserController.getItSupportOverview
);

// Supervisor's read-only "My Team" roster — direct reports (via the
// `supervisor` field) plus their enrollment/completion progress.
router.get(
  '/my-team/overview',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPERVISOR),
  mwasalatUserController.getMyTeamOverview
);

// Supervisor's manual escalation of an overdue mandatory-course direct
// report to Platform Admin — not automatic, the supervisor's own call.
router.post(
  '/my-team/escalate',
  mwasalatAuthMiddleware.authorize(MWASALAT_ROLES.SUPERVISOR),
  mwasalatUserController.escalateOverdueToAdmin
);

// Platform Admin runs day-to-day people ops.
router.post('/invite-instructor', platformAdminOnly, validate(inviteUserSchema), mwasalatUserController.inviteInstructor);
router.post('/invite-staff', platformAdminOnly, validate(inviteStaffSchema), mwasalatUserController.inviteStaff);
// Department Admin's one write action — bulk-importing their own department's
// learners (auto-scoped, see mwasalatUser.service.js bulkImport).
router.post('/bulk-import', departmentAdminOnly, uploadCsv, mwasalatUserController.bulkImport);

// Blocking/unblocking is shared at the route level; the service enforces which
// tier of account each actor may target (Platform Admin -> instructor/learner,
// Super Admin -> platform_admin only).
router.patch('/:id/active', bothAdmins, validate(setActiveSchema), mwasalatUserController.setActive);

// Department-Based Access / Supervisor-to-Employee Mapping — Platform Admin
// assigns both; Super Admin is exempt from department scoping so it's excluded here.
router.patch('/:id/department', platformAdminOnly, validate(assignDepartmentSchema), mwasalatUserController.assignDepartment);
router.patch('/:id/supervisor', platformAdminOnly, validate(assignSupervisorSchema), mwasalatUserController.assignSupervisor);

// Super Admin's write actions on the single Platform Admin account: provision
// (or resend the pending invite) and edit its name/email.
router.post('/invite-platform-admin', superAdminOnly, validate(inviteUserSchema), mwasalatUserController.invitePlatformAdmin);
router.patch('/platform-admin/:id', superAdminOnly, validate(updatePlatformAdminSchema), mwasalatUserController.updatePlatformAdmin);

export default router;
