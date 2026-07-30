import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useParams, useLocation } from 'react-router-dom';
import MwasalatRouteLoader from '../components/mwasalat/MwasalatRouteLoader.jsx';
import { useMwasalatAuthStore } from '../store/mwasalatAuthStore.js';
import { MWASALAT_ROLE_LOGIN } from '../constants/mwasalatRoles.js';

// Every page is a separate lazy chunk instead of one ~1MB eager bundle — the
// initial load (even /login) no longer waits on every role's pages
// downloading, and Rollup automatically splits at each of these import()
// boundaries with no vite.config.js change needed.
const MwasalatLandingPage = lazy(() => import('../pages/mwasalat/MwasalatLandingPage.jsx'));
const MwasalatLogin = lazy(() => import('../pages/mwasalat/MwasalatLogin.jsx'));
const MwasalatStaffLogin = lazy(() => import('../pages/mwasalat/MwasalatStaffLogin.jsx'));
const MwasalatAdminDashboard = lazy(() => import('../pages/mwasalat/MwasalatAdminDashboard.jsx'));
const MwasalatLearnersPage = lazy(() => import('../pages/mwasalat/MwasalatLearnersPage.jsx'));
const MwasalatAdminLearnerDetailPage = lazy(() => import('../pages/mwasalat/MwasalatAdminLearnerDetailPage.jsx'));
const MwasalatInstructorsPage = lazy(() => import('../pages/mwasalat/MwasalatInstructorsPage.jsx'));
const MwasalatAdminInstructorDetailPage = lazy(() => import('../pages/mwasalat/MwasalatAdminInstructorDetailPage.jsx'));
const MwasalatSetPasswordPage = lazy(() => import('../pages/mwasalat/MwasalatSetPasswordPage.jsx'));
const MwasalatInstructorDashboard = lazy(() => import('../pages/mwasalat/MwasalatInstructorDashboard.jsx'));
const MwasalatInstructorProgramsPage = lazy(() => import('../pages/mwasalat/MwasalatInstructorProgramsPage.jsx'));
const MwasalatInstructorCalendarPage = lazy(() => import('../pages/mwasalat/MwasalatInstructorCalendarPage.jsx'));
const MwasalatAddCoursePage = lazy(() => import('../pages/mwasalat/MwasalatAddCoursePage.jsx'));
const MwasalatProgramDetailPage = lazy(() => import('../pages/mwasalat/MwasalatProgramDetailPage.jsx'));
const MwasalatEditCoursePage = lazy(() => import('../pages/mwasalat/MwasalatEditCoursePage.jsx'));
const MwasalatRegister = lazy(() => import('../pages/mwasalat/MwasalatRegister.jsx'));
const MwasalatLearnerDashboard = lazy(() => import('../pages/mwasalat/MwasalatLearnerDashboard.jsx'));
const MwasalatLearnerCalendarPage = lazy(() => import('../pages/mwasalat/MwasalatLearnerCalendarPage.jsx'));
const MwasalatCoursesCatalogPage = lazy(() => import('../pages/mwasalat/MwasalatCoursesCatalogPage.jsx'));
const MwasalatForgotPasswordPage = lazy(() => import('../pages/mwasalat/MwasalatForgotPasswordPage.jsx'));
const MwasalatCheckInPage = lazy(() => import('../pages/mwasalat/MwasalatCheckInPage.jsx'));
const MwasalatQuizPage = lazy(() => import('../pages/mwasalat/MwasalatQuizPage.jsx'));
const MwasalatAssignmentPage = lazy(() => import('../pages/mwasalat/MwasalatAssignmentPage.jsx'));
const MwasalatCoursePlayerPage = lazy(() => import('../pages/mwasalat/MwasalatCoursePlayerPage.jsx'));
const MwasalatWatchRecordingPage = lazy(() => import('../pages/mwasalat/MwasalatWatchRecordingPage.jsx'));
const MwasalatCompletedCoursesPage = lazy(() => import('../pages/mwasalat/MwasalatCompletedCoursesPage.jsx'));
const MwasalatCertificatePage = lazy(() => import('../pages/mwasalat/MwasalatCertificatePage.jsx'));
const MwasalatLearnerCourseDetailPage = lazy(() => import('../pages/mwasalat/MwasalatLearnerCourseDetailPage.jsx'));
const MwasalatLearnerChatPage = lazy(() => import('../pages/mwasalat/MwasalatLearnerChatPage.jsx'));
const MwasalatInstructorChatPage = lazy(() => import('../pages/mwasalat/MwasalatInstructorChatPage.jsx'));
const MwasalatInstructorAdminChatPage = lazy(() => import('../pages/mwasalat/MwasalatInstructorAdminChatPage.jsx'));
const MwasalatLearnerDiscussionPage = lazy(() => import('../pages/mwasalat/MwasalatLearnerDiscussionPage.jsx'));
const MwasalatInstructorDiscussionPage = lazy(() => import('../pages/mwasalat/MwasalatInstructorDiscussionPage.jsx'));
const MwasalatInstructorStudentsPage = lazy(() => import('../pages/mwasalat/MwasalatInstructorStudentsPage.jsx'));
const MwasalatInstructorAtRiskPage = lazy(() => import('../pages/mwasalat/MwasalatInstructorAtRiskPage.jsx'));
const MwasalatAchievementsPage = lazy(() => import('../pages/mwasalat/MwasalatAchievementsPage.jsx'));
const MwasalatTranscriptPage = lazy(() => import('../pages/mwasalat/MwasalatTranscriptPage.jsx'));
const MwasalatLearnerProfilePage = lazy(() => import('../pages/mwasalat/MwasalatLearnerProfilePage.jsx'));
const MwasalatInstructorProfilePage = lazy(() => import('../pages/mwasalat/MwasalatInstructorProfilePage.jsx'));
const MwasalatAdminProfilePage = lazy(() => import('../pages/mwasalat/MwasalatAdminProfilePage.jsx'));
const MwasalatAdminProgramsPage = lazy(() => import('../pages/mwasalat/MwasalatAdminProgramsPage.jsx'));
const MwasalatAdminCategoriesPage = lazy(() => import('../pages/mwasalat/MwasalatAdminCategoriesPage.jsx'));
const MwasalatAdminCertificatesPage = lazy(() => import('../pages/mwasalat/MwasalatAdminCertificatesPage.jsx'));
const MwasalatAdminPaymentsPage = lazy(() => import('../pages/mwasalat/MwasalatAdminPaymentsPage.jsx'));
const MwasalatAdminSalesReportPage = lazy(() => import('../pages/mwasalat/MwasalatAdminSalesReportPage.jsx'));
const MwasalatAdminQuizResultsPage = lazy(() => import('../pages/mwasalat/MwasalatAdminQuizResultsPage.jsx'));
const MwasalatAdminActivityLogPage = lazy(() => import('../pages/mwasalat/MwasalatAdminActivityLogPage.jsx'));
const MwasalatAdminAnnouncementsPage = lazy(() => import('../pages/mwasalat/MwasalatAdminAnnouncementsPage.jsx'));
const MwasalatAdminRemindersPage = lazy(() => import('../pages/mwasalat/MwasalatAdminRemindersPage.jsx'));
const MwasalatAdminSettingsPage = lazy(() => import('../pages/mwasalat/MwasalatAdminSettingsPage.jsx'));
const MwasalatAdminPlatformAdminsPage = lazy(() => import('../pages/mwasalat/MwasalatAdminPlatformAdminsPage.jsx'));
const MwasalatAdminChatPage = lazy(() => import('../pages/mwasalat/MwasalatAdminChatPage.jsx'));
const MwasalatVerifyCertificatePage = lazy(() => import('../pages/mwasalat/MwasalatVerifyCertificatePage.jsx'));
const MwasalatAllCoursesPage = lazy(() => import('../pages/mwasalat/MwasalatAllCoursesPage.jsx'));
const MwasalatAdminDepartmentsPage = lazy(() => import('../pages/mwasalat/MwasalatAdminDepartmentsPage.jsx'));
const MwasalatAdminCohortsPage = lazy(() => import('../pages/mwasalat/MwasalatAdminCohortsPage.jsx'));
const MwasalatAdminStaffPage = lazy(() => import('../pages/mwasalat/MwasalatAdminStaffPage.jsx'));
const MwasalatItSupportDashboard = lazy(() => import('../pages/mwasalat/MwasalatItSupportDashboard.jsx'));
const MwasalatItSupportAdminChatPage = lazy(() => import('../pages/mwasalat/MwasalatItSupportAdminChatPage.jsx'));
const MwasalatSupervisorDashboard = lazy(() => import('../pages/mwasalat/MwasalatSupervisorDashboard.jsx'));
const MwasalatSupervisorAdminChatPage = lazy(() => import('../pages/mwasalat/MwasalatSupervisorAdminChatPage.jsx'));
const MwasalatLearnerLayoutShell = lazy(() => import('../layouts/MwasalatLearnerLayoutShell.jsx'));
const MwasalatAdminLayoutShell = lazy(() => import('../layouts/MwasalatAdminLayoutShell.jsx'));
const MwasalatInstructorLayoutShell = lazy(() => import('../layouts/MwasalatInstructorLayoutShell.jsx'));
const MwasalatSupervisorLayoutShell = lazy(() => import('../layouts/MwasalatSupervisorLayoutShell.jsx'));
const MwasalatItSupportLayoutShell = lazy(() => import('../layouts/MwasalatItSupportLayoutShell.jsx'));

function MwasalatProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user } = useMwasalatAuthStore();
  if (!isAuthenticated || !user) {
    // Every allowedRoles array here is homogeneous (all-staff or all-learner),
    // so the first entry's login page is always the right one — this must
    // never fall back to the learner /login for a staff-only group, since
    // /staff/login is the only place IP restriction is enforced.
    const loginPath = allowedRoles?.length ? MWASALAT_ROLE_LOGIN[allowedRoles[0]] : '/login';
    return <Navigate to={loginPath} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function NotFoundRedirect() {
  return <Navigate to="/" replace />;
}

// Backward-compat for every already-issued /mwasalat/... link (certificate QR
// codes, check-in QR codes, unexpired invite emails) — every old path maps
// 1:1 to the new one minus the leading /mwasalat segment, so a single
// wildcard redirect covers all of them indefinitely. `location.search` is
// reattached explicitly since the wildcard `*` param only captures the path.
function MwasalatLegacyPathRedirect() {
  const { '*': rest } = useParams();
  const { search } = useLocation();
  return <Navigate to={`/${rest}${search}`} replace />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<MwasalatRouteLoader />}>
    <Routes>
      <Route path="/" element={<MwasalatLandingPage />} />
      <Route path="/login" element={<MwasalatLogin />} />
      <Route path="/register" element={<Navigate to="/register/external" replace />} />
      <Route path="/register/external" element={<MwasalatRegister />} />
      <Route path="/forgot-password" element={<MwasalatForgotPasswordPage />} />
      <Route path="/staff/login" element={<MwasalatStaffLogin />} />
      <Route path="/instructor/set-password/:token" element={<MwasalatSetPasswordPage />} />
      <Route path="/set-password/:token" element={<MwasalatSetPasswordPage />} />
      <Route path="/verify/:id" element={<MwasalatVerifyCertificatePage />} />
      {/* MwasalatAdminLayoutShell mounts once per session for the whole Admin
          family, gated by the broad union of every role below — the 3
          narrower guards nested inside it (tri-role / super_admin-only /
          super_admin+it_support) preserve the original defense-in-depth,
          they just no longer each carry their own copy of the layout chrome. */}
      <Route element={<MwasalatProtectedRoute allowedRoles={['super_admin', 'platform_admin', 'department_admin', 'it_support']} />}>
        <Route element={<MwasalatAdminLayoutShell />}>
          <Route element={<MwasalatProtectedRoute allowedRoles={['super_admin', 'platform_admin', 'department_admin']} />}>
            <Route path="/admin/dashboard" element={<MwasalatAdminDashboard />} />
            <Route path="/admin/chat" element={<MwasalatAdminChatPage />} />
            <Route path="/admin/learners" element={<MwasalatLearnersPage />} />
            <Route path="/admin/learners/:id" element={<MwasalatAdminLearnerDetailPage />} />
            <Route path="/admin/instructors" element={<MwasalatInstructorsPage />} />
            <Route path="/admin/instructors/:id" element={<MwasalatAdminInstructorDetailPage />} />
            <Route path="/admin/staff" element={<MwasalatAdminStaffPage />} />
            <Route path="/admin/departments" element={<MwasalatAdminDepartmentsPage />} />
            <Route path="/admin/cohorts" element={<MwasalatAdminCohortsPage />} />
            <Route path="/admin/profile" element={<MwasalatAdminProfilePage />} />
            <Route path="/admin/programs" element={<MwasalatAdminProgramsPage />} />
            <Route path="/admin/categories" element={<MwasalatAdminCategoriesPage />} />
            <Route path="/admin/certificates" element={<MwasalatAdminCertificatesPage />} />
            <Route path="/admin/quiz-results" element={<MwasalatAdminQuizResultsPage />} />
            <Route path="/admin/announcements" element={<MwasalatAdminAnnouncementsPage />} />
            <Route path="/admin/reminders" element={<MwasalatAdminRemindersPage />} />
            <Route path="/admin/settings" element={<MwasalatAdminSettingsPage />} />
          </Route>
          {/* Revenue and platform-admin governance are Super Admin's alone — kept in
              a separate protected block so Platform Admin never even reaches these
              routes client-side. */}
          <Route element={<MwasalatProtectedRoute allowedRoles={['super_admin']} />}>
            <Route path="/admin/payments" element={<MwasalatAdminPaymentsPage />} />
            <Route path="/admin/sales-report" element={<MwasalatAdminSalesReportPage />} />
            <Route path="/admin/platform-admins" element={<MwasalatAdminPlatformAdminsPage />} />
          </Route>
          <Route element={<MwasalatProtectedRoute allowedRoles={['super_admin', 'it_support']} />}>
            <Route path="/admin/activity-log" element={<MwasalatAdminActivityLogPage />} />
          </Route>
        </Route>
      </Route>
      {/* IT Support's own dashboard/chat — separate Shell from the Admin family
          above, since navigating between the two is a genuinely different layout. */}
      <Route element={<MwasalatProtectedRoute allowedRoles={['super_admin', 'it_support']} />}>
        <Route element={<MwasalatItSupportLayoutShell />}>
          <Route path="/it-support/dashboard" element={<MwasalatItSupportDashboard />} />
          <Route path="/it-support/chat" element={<MwasalatItSupportAdminChatPage />} />
        </Route>
      </Route>
      {/* Supervisor's one read-only slice — direct-reports roster + progress. */}
      <Route element={<MwasalatProtectedRoute allowedRoles={['supervisor']} />}>
        <Route element={<MwasalatSupervisorLayoutShell />}>
          <Route path="/supervisor/dashboard" element={<MwasalatSupervisorDashboard />} />
          <Route path="/supervisor/chat" element={<MwasalatSupervisorAdminChatPage />} />
        </Route>
      </Route>
      <Route element={<MwasalatProtectedRoute allowedRoles={['instructor']} />}>
        <Route element={<MwasalatInstructorLayoutShell />}>
          <Route path="/instructor/dashboard" element={<MwasalatInstructorDashboard />} />
          <Route path="/instructor/chat" element={<MwasalatInstructorAdminChatPage />} />
          <Route path="/instructor/students" element={<MwasalatInstructorStudentsPage />} />
          <Route path="/instructor/at-risk" element={<MwasalatInstructorAtRiskPage />} />
          <Route path="/instructor/programs" element={<MwasalatInstructorProgramsPage />} />
          <Route path="/instructor/calendar" element={<MwasalatInstructorCalendarPage />} />
          <Route path="/instructor/programs/new" element={<MwasalatAddCoursePage />} />
          <Route path="/instructor/programs/:id" element={<MwasalatProgramDetailPage />} />
          <Route path="/instructor/programs/:id/edit" element={<MwasalatEditCoursePage />} />
          <Route path="/instructor/programs/:id/watch" element={<MwasalatWatchRecordingPage />} />
          <Route path="/instructor/programs/:id/chat/:learnerId" element={<MwasalatInstructorChatPage />} />
          <Route path="/instructor/programs/:id/discussion" element={<MwasalatInstructorDiscussionPage />} />
          <Route path="/instructor/profile" element={<MwasalatInstructorProfilePage />} />
        </Route>
      </Route>
      <Route element={<MwasalatProtectedRoute allowedRoles={['learner', 'external_learner']} />}>
        {/* MwasalatLearnerLayoutShell mounts once per session here, instead of
            once per page — its <Outlet/> swaps only the leaf page below. */}
        <Route element={<MwasalatLearnerLayoutShell />}>
          <Route path="/learner/dashboard" element={<MwasalatLearnerDashboard />} />
          <Route path="/learner/all-courses" element={<MwasalatAllCoursesPage />} />
          <Route path="/learner/calendar" element={<MwasalatLearnerCalendarPage />} />
          <Route path="/learner/courses" element={<MwasalatCoursesCatalogPage />} />
          <Route path="/learner/completed" element={<MwasalatCompletedCoursesPage />} />
          <Route path="/learner/achievements" element={<MwasalatAchievementsPage />} />
          <Route path="/learner/transcript" element={<MwasalatTranscriptPage />} />
          <Route path="/learner/profile" element={<MwasalatLearnerProfilePage />} />
          <Route path="/learner/check-in/:id" element={<MwasalatCheckInPage />} />
          <Route path="/learner/programs/:id" element={<MwasalatLearnerCourseDetailPage />} />
          <Route path="/learner/programs/:id/chat" element={<MwasalatLearnerChatPage />} />
          <Route path="/learner/programs/:id/discussion" element={<MwasalatLearnerDiscussionPage />} />
          <Route path="/learner/programs/:id/watch" element={<MwasalatWatchRecordingPage />} />
          <Route path="/learner/programs/:id/quiz" element={<MwasalatQuizPage />} />
          <Route path="/learner/programs/:id/assignment" element={<MwasalatAssignmentPage />} />
          <Route path="/learner/programs/:id/learn" element={<MwasalatCoursePlayerPage />} />
          <Route path="/learner/programs/:id/certificate" element={<MwasalatCertificatePage />} />
        </Route>
      </Route>
      {/* Backward-compat: every old /mwasalat/... link (issued certificate QR
          codes, check-in QR codes, unexpired invite emails) keeps working
          indefinitely — see MwasalatLegacyPathRedirect above. */}
      <Route path="/mwasalat/*" element={<MwasalatLegacyPathRedirect />} />
      <Route path="*" element={<NotFoundRedirect />} />
    </Routes>
    </Suspense>
  );
}
