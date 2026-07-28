# Eonix Student Management Platform — CLAUDE.md

> Production MERN stack app for Eonix Solutions (academy@eonixsolutions.in).
> Manages: student applications, onboarding, auth, courses, fees, notifications, mentors, dashboards, admin operations, attendance, assignments, communication.

---

## Stack

| Layer       | Tech                                                                   |
| ----------- | ---------------------------------------------------------------------- |
| Backend     | Node.js, Express, MongoDB/Mongoose, Socket.io, JWT, Nodemailer, Multer |
| Frontend    | React 18, Vite, Tailwind CSS, Zustand, TanStack Query, React Hook Form |
| UI          | Lucide React, Headless UI, clsx + tailwind-merge                       |
| File Upload | Cloudinary via multer-storage-cloudinary                               |

---

## Architecture

### Application Flow
```
Route → Controller → Service → Repository/Model → Database
```

### Backend: `backend/src/modules/<name>/`
Every module has: `routes`, `controller`, `service`, `repository`, `validation`, `model` (+ `middleware` if needed).

### Frontend: `frontend/src/`
```
api/          axios instance + interceptors (auto token refresh)
pages/        route-level page components
components/   shared UI (ui/) + module-specific components
layouts/      AuthLayout, DashboardLayout, Sidebar
hooks/        custom React hooks
store/        Zustand stores (authStore, notificationStore)
services/     API call wrappers (use api/axios.js)
context/      React Context (AuthContext)
routes/       AppRoutes, ProtectedRoute
utils/        cn(), sidebarLinks, etc.
constants/    ROUTES, ROLES, ROLE_DASHBOARD
```

---

## Coding Rules

### Controllers
- Thin: request/response only, call service, return standardized response
- Use `asyncHandler` wrapper — no try/catch needed
- Use `successResponse()` from `utils/response.js`

### Services
- All business logic lives here
- Throw `AppError` with status code on failure
- Never send HTTP responses directly

### Repositories
- DB queries and aggregations only
- Simple modules may query models directly inside services

### Models
- Always: `{ timestamps: true }`, validation, indexing
- Soft delete when required
- `select: false` on sensitive fields (password, tokens)

---

## API Response Format

```json
// Success
{ "success": true, "message": "...", "data": {}, "error": null }

// Error
{ "success": false, "message": "...", "data": null, "error": {} }
```

---

## Roles (from PRD)

| Role | Constant | Dashboard |
|------|----------|-----------|
| Super Admin | `super_admin` | `/admin/dashboard` |
| Branch Admin | `branch_admin` | `/branch-admin/dashboard` |
| Branch Coordinator | `branch_coordinator` | `/coordinator/dashboard` |
| Technical Mentor | `technical_mentor` | `/mentor/dashboard` |
| Communication Mentor | `communication_mentor` | `/comm-mentor/dashboard` |
| Student | `student` | `/student/dashboard` |

Staff roles = all except `student`. Self-registration form is **students only**. Staff accounts are created by admins.

## Authentication

- JWT access token (15m) + refresh token (7d, httpOnly cookie)
- Auth middleware: `authMiddleware.authenticate` / `authMiddleware.authorize(...roles)`
- Student onboarding: register → email verify → branch coordinator approval → active

## Student Status (`studentStatus` field)

| Value | Meaning |
|-------|---------|
| `active` | Normal access |
| `dropped` | No login allowed — show "enrollment dropped" error |
| `graduated` | Completed program |

## Access Control Rules (PRD Section 4.1)

| Condition | Access Outcome |
|-----------|---------------|
| Fee unpaid + validity expired | Dashboard + payment only |
| Fee pending within validity | Full access + mandatory daily fee reminder modal |
| Tasks incomplete | Next week locked |
| Review failed | Next week locked |
| Review not completed | Next week locked |
| LeetCode hold active | Limited to completed content only |
| `studentStatus = dropped` | No login — blocked at auth |

## Key Business Rules

- **Daily fee reminder modal**: shown on first app open each day when fee is `pending` or `overdue`. Must be acknowledged. Tracks dismissal in localStorage by date.
- **Branch Coordinator approves students**: `isApproved` field is set by coordinator, not admin.
- **Dropped students cannot login**: checked in `auth.service.js` before issuing tokens.
- **Multi-branch**: users have a `branch` ref field; all queries should be branch-scoped for non-super-admin roles.

---

## Frontend Patterns

- Functional components + hooks only
- TanStack Query for all server state (API caching, invalidation, pagination)
- Zustand for client state (auth, notifications)
- React Hook Form for all forms
- `cn()` utility for conditional classnames
- Use components from `components/ui/` (Button, Input, Modal, Card, Badge, Spinner)

---

## Primary Color

Tailwind `teal` (primary-600 = `#0d9488`). Brand is teal/clean white. Avoid dark backgrounds. Rounded corners (`rounded-xl`, `rounded-2xl`), good spacing, clear hierarchy.

---

## Naming

| Type        | Convention       | Example                  |
| ----------- | ---------------- | ------------------------ |
| Files       | kebab-case       | `auth.service.js`        |
| Variables   | camelCase        | `accessToken`            |
| Classes     | PascalCase       | `User`, `AppError`       |
| Constants   | UPPER_SNAKE_CASE | `JWT_ACCESS_SECRET`      |
| React comp  | PascalCase file  | `DashboardLayout.jsx`    |

---

## Security

- Hash passwords with bcryptjs (rounds: 12)
- Sanitize inputs, validate at API boundary
- Secrets in `.env` only, never hardcode
- Secure httpOnly cookies for refresh token
- Rate limit API endpoints

---

## To Generate a New Module

Use the `/new-module <name>` skill. It scaffolds all required backend + frontend files following the architecture above.

---

## Feature Tracker Maintenance

`frontend/public/LMS_Feature_Categorized_Tracker.xlsx` is the canonical LMS feature-completion tracker
(this file replaces the old `Client_LMS_Feature_Tracker_With_Descriptions.xlsx` — use this one only).
It has 4 sheets: **Development**, **Hosting_DevOps**, **Client_Dependencies**, **Support_PostGoLive**.
Each sheet has the same columns: `No.`, `Module`, `Feature`, `Description`, `Priority`, `Status`, `Remarks`.

**Whenever a coding task finishes and it changes whether a tracked feature is implemented** — a new
feature built, a `Not Started`/`Partial` row becomes usable, a gap gets closed, an integration goes from
undocumented/conditional to fully wired — update that row's `Status` / `Remarks` (and `Description` /
`Priority` if still blank) columns to match reality as part of finishing the task. Don't wait to be asked again.

- Match rows by **(Sheet, Module, Feature)** text, not row position.
- `Status` values: `Done`, `Partial`, `Not Started`.
- `Client_Dependencies` and `Support_PostGoLive` rows are mostly things the client provides or pure
  process/service deliverables (training, helpdesk, SSO/LDAP creds, etc.) rather than app code — judge
  `Status` by whether the codebase is *built to support/consume* them, and say so explicitly in `Remarks`
  when a row has no code surface at all (e.g. "process/service deliverable, not a code feature").
- `Remarks` should be a short, specific, evidence-based note (what actually exists, named files/behavior,
  and any real remaining gap) — never a generic "implemented" with no detail.
- Write with a library that preserves existing formatting (header styling, column widths, cell colors) —
  e.g. `exceljs` — not raw XML edits or a plain CSV re-save.
- The file is a real `.xlsx` a human may have open in Excel at the time. If the write fails with `EBUSY`
  (Windows file lock), tell the user to close it and retry — don't silently skip the update.
- Skip this for trivial changes that don't map to any tracker row (typo fixes, refactors, internal
  cleanup with no user-facing capability change).
