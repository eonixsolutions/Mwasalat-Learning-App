# Mwasalat LMS — Roles & Responsibilities

**Scope:** this document describes the role model as it exists in the live codebase today (`backend/src/modules/mwasalatUser/`, `frontend/src/constants/mwasalatRoles.js`). It does not cover the original Eonix academy role model (super_admin / branch_admin / branch_coordinator / technical_mentor / communication_mentor / student) — that backend was removed from the working tree when the Mwasalat white-label module was added and now survives only in git history.

There are **8 roles**, split into two groups:

- **Staff roles** — `super_admin`, `platform_admin`, `department_admin`, `supervisor`, `instructor`, `it_support`
- **Learner roles** — `learner`, `external_learner`

---

## 1. Role hierarchy at a glance

| Tier | Roles | What they own |
|---|---|---|
| Executive / Platform | Super Admin, Platform Admin, Department Admin | Platform configuration, people, content oversight |
| Operational | Supervisor, Instructor, IT Support | Team oversight, teaching, technical health |
| Learning | Learner, External Learner | Course consumption |

All staff roles share one admin-style dashboard shell (`MwasalatAdminLayout`) except Supervisor, Instructor, and IT Support, which each get a purpose-built layout scoped to their one job.

---

## 2. Role-by-role detail

### Super Admin
**Dashboard:** `/admin/dashboard` · **Scope:** global, including finance

The only role with unrestricted authority over the platform, including money and oversight of every other admin.

- Exclusive access to platform-wide revenue: transactions, revenue summary, sales report (`mwasalatPayment.routes.js`)
- Sole role that can view the audit/activity log covering Platform Admin actions (`mwasalatActivityLog.routes.js`)
- Only role that can provision, edit, or block/unblock the (single) Platform Admin account — only one may exist at a time (`mwasalatUser.service.js`)
- Can override authorship checks anywhere in the platform — edit, delete, approve enrollment, or mark attendance on *any* instructor's program, and moderate any discussion thread, regardless of who owns it (`mwasalatProgram.service.js`, `mwasalatDiscussion.service.js`)
- Everything Platform Admin can do, plus the above

### Platform Admin
**Dashboard:** `/admin/dashboard` · **Scope:** global, excluding finance

The day-to-day platform operator. Deliberately walled off from two things: seeing/managing Super Admins, and touching money.

- Invites Instructors and other staff (Department Admin, Supervisor, IT Support)
- Assigns department and supervisor to any user
- Manages groups, cohorts, categories, and departments
- Sends platform-wide notifications and announcements
- Edits platform settings
- Cannot: view revenue/transactions/sales reports, see the Super Admin/Platform Admin roster, or view the platform activity log — all explicitly gated to Super Admin only

### Department Admin
**Dashboard:** shares the admin layout · **Scope:** own department only

A scoped variant of Platform Admin — every list, dashboard overview, and report they touch is filtered down to their own department automatically (`mwasalatDepartmentScope.js`).

- Views people, programs, enrollments, and certificates — but only within their department
- Sole write action: bulk-imports learners via CSV, auto-scoped to their department, with automatic enrollment into that department's mandatory courses
- Cannot: invite instructors/staff, assign departments or supervisors, or block/unblock accounts — those stay Platform-Admin-and-above only

### Supervisor
**Dashboard:** `/supervisor/dashboard` · **Scope:** own direct reports

A line-manager role with no content-authoring or people-admin rights of its own — purely oversight of the people who list them as their supervisor.

- Read-only "My Team" roster showing each direct report's enrollment and completion progress, including overdue mandatory courses
- Can manually escalate an overdue direct report to Platform Admin
- **Known gap:** a formal sign-off/approval workflow for enrollments is not yet built — today the role is read-only-plus-escalate, not an approval gate

### Instructor
**Dashboard:** `/instructor/dashboard` · **Scope:** own authored courses

The course author and teacher. Full ownership of everything they create; no visibility into programs they don't own (enforced by an ownership check that only Super Admin can bypass).

- Creates, AI-autofills, and edits their own programs, modules, and lessons; can schedule live (Zoom) classes
- Runs teaching operations: today's schedule, class roster, attendance marking, completing live sessions
- Grades assignment submissions with feedback; builds and manages quizzes
- Moderates their own course's discussion threads (pin, resolve, delete)
- Chats 1:1 with enrolled learners and with admins

### IT Support
**Dashboard:** `/it-support/dashboard` · **Scope:** read-only, platform health

Deliberately the narrowest staff role — visibility with no authoring or people-admin power.

- Views a platform health snapshot: database health, uptime, active/blocked/invited user counts, recent account lockouts
- Views the activity log's online-user metric (shared with Super Admin/Platform Admin)
- No content authoring, no user management actions of its own

### Learner
**Dashboard:** `/learner/dashboard` · **Scope:** self; department/cohort-targeted catalog

The standard internal course consumer.

- Browses and pays for courses (Stripe checkout), consumes lessons/videos, submits quizzes and assignments, earns certificates
- Chats with instructors and admins; bookmarks courses; submits feedback; checks in to live classes
- Catalog is targeted: sees a program if it's untargeted, or matches their department, or matches a group they belong to; blocked from programs marked external-only
- Subject to mandatory-course auto-enrollment, with overdue courses escalated to their supervisor

### External Learner
**Dashboard:** `/learner/dashboard` (same as Learner) · **Scope:** self; non-internal-only catalog

Functionally identical to Learner, kept as a separate role purely so reporting can distinguish internal staff from external/contractor learners.

- Same feature set as Learner, but sees a narrower catalog — blocked from any program marked internal-only (no department/group targeting logic applies)
- Excluded from CSV bulk-import (import is internal-Learner-only)

---

## 3. Capability matrix

| Capability | Super Admin | Platform Admin | Dept. Admin | Supervisor | Instructor | IT Support | Learner | Ext. Learner |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Manage finance / revenue | ✅ | – | – | – | – | – | – | – |
| Manage all people & departments | ✅ | ✅ | dept. only | – | – | – | – | – |
| Invite staff (instructors, etc.) | ✅ | ✅ | – | – | – | – | – | – |
| Author / edit own courses | ✅ (any) | – | – | – | ✅ | – | – | – |
| Grade & moderate own course | ✅ (any) | – | – | – | ✅ | – | – | – |
| View team / escalate overdue | – | – | – | ✅ | – | – | – | – |
| View platform health / audit log | ✅ | activity only, no revenue | – | – | – | health + activity | – | – |
| Enroll / learn / earn certificates | – | – | – | – | – | – | ✅ | ✅ |

---

## 4. Notes for stakeholders

- **Naming caution:** if anyone references the old Eonix PRD, note that its `super_admin` is a *different, unrelated* role from Mwasalat's `super_admin` — same name, completely different scope (branch-based academy admin vs. department/platform-based LMS admin with finance oversight).
- **Supervisor approval workflow is not yet implemented** — it currently reads team progress and can escalate, but cannot formally approve/reject enrollments or completions. Flag this if a stakeholder asks about manager sign-off.
- **Department Admin scoping** is enforced centrally in one place (`mwasalatDepartmentScope.js`), so it applies consistently across people, program, enrollment, certificate, and activity-log queries.
