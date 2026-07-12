# EONIX ACADEMY WEB APP – PRD

---

## Header

| Field | Value |
|---|---|
| Product Name | Eonix Academy Web Application |
| Organization | Eonix Solutions |
| Document Owner | Nafeesath Musfira |
| Date | 4th May 2026 |
| Version | v1.0 |
| Status | Draft |

---

# 1. Overview & Problem Statement

## Problem

Eonix Academy currently manages student learning, task tracking, reviews, and progress using manual coordination, fragmented tools, and human follow-ups.

This leads to:

- Missed tasks and deadlines
- Lack of structured progression
- Heavy dependency on mentors/admins
- Poor visibility of student progress
- Inconsistent evaluation and discipline

## Solution

Build a centralized web application that:

- Controls learning access based on rules (payment, progress, reviews)
- Tracks student performance in real time
- Automates review scheduling and evaluation
- Reduces manual effort for mentors and admins
- Enforces a structured, disciplined learning system

---

# 2. Goals & Success Metrics

## Business Goals

- Reduce manual coordination by 70%
- Improve student completion rate and learning quality
- Standardize academic evaluation
- Improve student placement outcomes

## User Goals

### Students

- Clearly know what to do daily
- Track progress easily
- Move forward only when ready
- Improve problem-solving and logic-building skills through regular coding practice (LeetCode)

### Mentors

- Evaluate efficiently
- Track student progress without manual follow-up

### Admins

- Monitor batches and performance centrally

## Success Metrics

- % of students completing weekly tasks on time
- Review pass rate
- Course completion rate
- Drop rate
- Avg time for mentor evaluation
- Payment completion rate
- Student placement rate (%)
- Average time to placement after course completion
- Average LeetCode completion rate per student (%)
- Consistency of daily coding practice (streak / active days)

> Note: Placement-related metrics are influenced by external factors such as market conditions and student performance but are tracked as key business outcomes.

---

# 3. Target Users / Personas

## Public User (Guest)

### Role & Context
A prospective student exploring the Eonix platform before enrollment.

### Key Goals

- Understand course structure and outcomes
- Evaluate credibility of the institute
- Register easily

### Pain Points

- Lack of clarity about course value
- Uncertainty before committing

## Student

### Role & Context
An enrolled learner following a structured training program with daily tasks and reviews.

### Key Goals

- Clearly understand daily tasks
- Track progress and performance
- Improve logic-building through regular practice
- Progress to next levels smoothly

### Pain Points

- Lack of consistency and discipline
- Confusion about next steps
- Delays in evaluation

## Technical Mentor

### Role & Context
Responsible for evaluating student tasks, managing reviews, and tracking academic progress.

### Key Goals

- Evaluate tasks efficiently
- Track student performance easily
- Manage review schedules

### Pain Points

- Manual tracking of student progress
- Time-consuming evaluation process
- Lack of centralized data

## Communication Mentor

### Role & Context
Handles communication training, sessions, and interview preparation for students.

### Key Goals

- Conduct structured communication sessions
- Track communication progress
- Maintain session records

### Pain Points

- Lack of structured tracking system
- Difficulty monitoring student improvement

## Branch Coordinator

### Role & Context
Manages student onboarding, attendance, and operational tracking at branch level.

### Key Goals

- Approve student registrations
- Track student activity and attendance
- Maintain operational visibility

### Pain Points

- Manual tracking processes
- Lack of real-time updates

## Branch Admin

### Role & Context
Oversees branch operations including students, mentors, and batch management.

### Key Goals

- Monitor batch performance
- Manage students and staff
- Ensure smooth branch operations

### Pain Points

- Limited centralized control
- Difficulty tracking multiple batches

## Super Admin

### Role & Context
System-level authority managing all branches, roles, and configurations.

### Key Goals

- Maintain system-wide control
- Configure roles and permissions
- Monitor performance across branches

### Pain Points

- Managing scale and complexity
- Ensuring consistency across branches

---

# 4. Scope & Features (User Stories)

## Authentication & Access Control

### User Story 1
As a user, I want to log in securely so that I can access my role-specific dashboard.

**Priority:** Must-have (MVP)

#### Acceptance Criteria

- User can log in using valid credentials
- Role-based access is enforced
- Unauthorized users cannot access restricted pages

### User Story 2
As a system, I want to restrict access based on role and status so that users only access permitted features.

**Priority:** Must-have (MVP)

#### Acceptance Criteria

- Access is granted based on user role
- Access is restricted for inactive/exited users
- Students with "Dropped" status cannot log in
- Users cannot access features outside their role permissions

### User Story 3
As a user, I want to verify my email so that my account is securely activated.

**Priority:** Must-have (MVP)

#### Acceptance Criteria

- Verification email is sent after registration
- User can verify account via link
- Account remains inactive until verification
- Expired/invalid links are handled properly

### User Story 4
As a user, I want to reset my password if I forget it so that I can regain access.

**Priority:** Must-have (MVP)

#### Acceptance Criteria

- User can request password reset via email
- Reset link is sent securely
- Link has expiry time
- User can set a new password
- Old password becomes invalid

### User Story 5
As a user, I want to change my password so that I can maintain account security.

**Priority:** Must-have (MVP)

#### Acceptance Criteria

- User can change password from profile/settings
- Old password verification is required
- Password update confirmation is shown

---

# 4.1 Access Control Summary Table

| Condition | Access Outcome |
|---|---|
| Fee unpaid (expired) | Only dashboard + payment access |
| Tasks incomplete | Next week locked |
| Review failed | Next week locked |
| LeetCode hold active | Access limited to completed content |
| Student status = Dropped | No access |
| Review not completed | Next week locked |
| Fee pending (within validity period) | Mandatory daily reminder modal before access |

---

# 5. User Flows / UX Notes

## Key UX Rules

- Always show current status (Locked / Unlocked)
- Show clear reason for restriction
- Prevent invalid actions instead of allowing errors

## Mandatory Popups

- Daily mandatory fee reminder modal for students with pending payment
- LeetCode Hold notification/alert
- Access restriction alerts/notice

## UX Principles

- System should be self-guiding (minimal manual support needed)
- Users should always know:
  - What to do next
  - Why something is locked
- Avoid hidden rules — everything should be visible

---

# 6. Non-Functional Requirements

## Performance

- Page load time should be ≤ 3 seconds on standard internet connections
- Dashboard data should load within 2 seconds after login
- API response time should be ≤ 1 second for standard requests

## Security

- Only authenticated users can access protected routes
- Role-Based Access Control (RBAC) must be enforced across all modules
- Sensitive data (passwords, tokens) must be encrypted
- Password reset and verification links must have expiry time
- Sessions must expire after inactivity

## Scalability

- System should support multiple branches and batches simultaneously
- Architecture should handle increasing number of users without performance degradation

## Reliability

- System uptime should be ≥ 99%
- All critical actions must be logged (audit logs)
- Data should be backed up daily
- System should prevent data loss during failures

## Compatibility

- Application should support latest versions of Chrome, Edge, and Firefox
- Responsive design for desktop, tablet, and mobile screens

## Usability

- UI should be simple and intuitive for non-technical users
- Users should be able to complete key actions in minimal steps
- Error messages should be clear and actionable

---

# 7. Assumptions, Dependencies, Constraints

## Assumptions

- Students will regularly log in and update their daily progress
- Mentors will evaluate tasks and update statuses on time
- Coordinators will review and approve student registrations promptly

## Dependencies

- Payment Gateway Integration
- Email/Notification Service
- Hosting Infrastructure
- Database System
- Deployment & DevOps Pipeline

## Constraints

- System must strictly enforce access control rules
- MVP must be built within limited timeline using phased development approach
- Must support multi-branch structure from initial release

---

# 8. Risks & Open Questions

## Risks

- Mentor delays in task evaluation may block student progression
- Complex access rules may confuse users
- Payment gateway failures may incorrectly restrict access
- Notification failures may cause missed tasks or reviews

## Open Questions

- Should mentor identity always remain hidden from students?
- Should review be allowed without full task completion in special cases?
- Do we need a mobile application in MVP or later phase?

---

# 9. Release Criteria & Timeline

## MVP Release Criteria

### Functional Criteria

- Student onboarding flow is fully functional
- Learning flow is implemented and accessible based on rules
- Task submission and mentor evaluation workflow is complete
- Review scheduling and result flow is working
- Payment-based access control is enforced correctly

### Quality Criteria

- No critical or blocking bugs present
- All core user flows are tested end-to-end
- Access control rules behave correctly under all conditions

### Readiness Criteria

- Basic user documentation is available
- Deployment environment is stable and production-ready
- Monitoring/logging is enabled for key system actions

## Suggested Timeline

### Phase 1: MVP Release

Core modules:
- Authentication
- Student onboarding
- Dashboard
- Learning module
- Task management
- LeetCode tracking
- Review & scheduling
- Payment & access control
- Notifications
- Batch & branch management

### Phase 2: Operational Enhancements

- Projects module
- Attendance & leave management
- Basic reports & analytics
- Staff task management

### Phase 3: Advanced System Features

- Advanced analytics and reporting
- System configuration & automation
- Performance optimizations
- Potential mobile application
