import { Routes, Route, Navigate, Outlet, useParams, useLocation } from 'react-router-dom';
import MwasalatLandingPage from '../pages/mwasalat/MwasalatLandingPage.jsx';
import MwasalatLogin from '../pages/mwasalat/MwasalatLogin.jsx';
import MwasalatStaffLogin from '../pages/mwasalat/MwasalatStaffLogin.jsx';
import MwasalatAdminDashboard from '../pages/mwasalat/MwasalatAdminDashboard.jsx';
import MwasalatLearnersPage from '../pages/mwasalat/MwasalatLearnersPage.jsx';
import MwasalatAdminLearnerDetailPage from '../pages/mwasalat/MwasalatAdminLearnerDetailPage.jsx';
import MwasalatInstructorsPage from '../pages/mwasalat/MwasalatInstructorsPage.jsx';
import MwasalatAdminInstructorDetailPage from '../pages/mwasalat/MwasalatAdminInstructorDetailPage.jsx';
import MwasalatSetPasswordPage from '../pages/mwasalat/MwasalatSetPasswordPage.jsx';
import MwasalatInstructorDashboard from '../pages/mwasalat/MwasalatInstructorDashboard.jsx';
import MwasalatInstructorProgramsPage from '../pages/mwasalat/MwasalatInstructorProgramsPage.jsx';
import MwasalatInstructorCalendarPage from '../pages/mwasalat/MwasalatInstructorCalendarPage.jsx';
import MwasalatAddCoursePage from '../pages/mwasalat/MwasalatAddCoursePage.jsx';
import MwasalatProgramDetailPage from '../pages/mwasalat/MwasalatProgramDetailPage.jsx';
import MwasalatEditCoursePage from '../pages/mwasalat/MwasalatEditCoursePage.jsx';
import MwasalatRegister from '../pages/mwasalat/MwasalatRegister.jsx';
import MwasalatLearnerDashboard from '../pages/mwasalat/MwasalatLearnerDashboard.jsx';
import MwasalatLearnerCalendarPage from '../pages/mwasalat/MwasalatLearnerCalendarPage.jsx';
import MwasalatCoursesCatalogPage from '../pages/mwasalat/MwasalatCoursesCatalogPage.jsx';
import MwasalatForgotPasswordPage from '../pages/mwasalat/MwasalatForgotPasswordPage.jsx';
import MwasalatCheckInPage from '../pages/mwasalat/MwasalatCheckInPage.jsx';
import MwasalatQuizPage from '../pages/mwasalat/MwasalatQuizPage.jsx';
import MwasalatAssignmentPage from '../pages/mwasalat/MwasalatAssignmentPage.jsx';
import MwasalatCoursePlayerPage from '../pages/mwasalat/MwasalatCoursePlayerPage.jsx';
import MwasalatWatchRecordingPage from '../pages/mwasalat/MwasalatWatchRecordingPage.jsx';
import MwasalatCompletedCoursesPage from '../pages/mwasalat/MwasalatCompletedCoursesPage.jsx';
import MwasalatCertificatePage from '../pages/mwasalat/MwasalatCertificatePage.jsx';
import MwasalatLearnerCourseDetailPage from '../pages/mwasalat/MwasalatLearnerCourseDetailPage.jsx';
import MwasalatLearnerChatPage from '../pages/mwasalat/MwasalatLearnerChatPage.jsx';
import MwasalatInstructorChatPage from '../pages/mwasalat/MwasalatInstructorChatPage.jsx';
import MwasalatInstructorAdminChatPage from '../pages/mwasalat/MwasalatInstructorAdminChatPage.jsx';
import MwasalatLearnerDiscussionPage from '../pages/mwasalat/MwasalatLearnerDiscussionPage.jsx';
import MwasalatInstructorDiscussionPage from '../pages/mwasalat/MwasalatInstructorDiscussionPage.jsx';
import MwasalatInstructorStudentsPage from '../pages/mwasalat/MwasalatInstructorStudentsPage.jsx';
import MwasalatInstructorAtRiskPage from '../pages/mwasalat/MwasalatInstructorAtRiskPage.jsx';
import MwasalatAchievementsPage from '../pages/mwasalat/MwasalatAchievementsPage.jsx';
import MwasalatTranscriptPage from '../pages/mwasalat/MwasalatTranscriptPage.jsx';
import MwasalatLearnerProfilePage from '../pages/mwasalat/MwasalatLearnerProfilePage.jsx';
import MwasalatInstructorProfilePage from '../pages/mwasalat/MwasalatInstructorProfilePage.jsx';
import MwasalatAdminProfilePage from '../pages/mwasalat/MwasalatAdminProfilePage.jsx';
import MwasalatAdminProgramsPage from '../pages/mwasalat/MwasalatAdminProgramsPage.jsx';
import MwasalatAdminCategoriesPage from '../pages/mwasalat/MwasalatAdminCategoriesPage.jsx';
import MwasalatAdminCertificatesPage from '../pages/mwasalat/MwasalatAdminCertificatesPage.jsx';
import MwasalatAdminPaymentsPage from '../pages/mwasalat/MwasalatAdminPaymentsPage.jsx';
import MwasalatAdminSalesReportPage from '../pages/mwasalat/MwasalatAdminSalesReportPage.jsx';
import MwasalatAdminQuizResultsPage from '../pages/mwasalat/MwasalatAdminQuizResultsPage.jsx';
import MwasalatAdminActivityLogPage from '../pages/mwasalat/MwasalatAdminActivityLogPage.jsx';
import MwasalatAdminAnnouncementsPage from '../pages/mwasalat/MwasalatAdminAnnouncementsPage.jsx';
import MwasalatAdminRemindersPage from '../pages/mwasalat/MwasalatAdminRemindersPage.jsx';
import MwasalatAdminSettingsPage from '../pages/mwasalat/MwasalatAdminSettingsPage.jsx';
import MwasalatAdminPlatformAdminsPage from '../pages/mwasalat/MwasalatAdminPlatformAdminsPage.jsx';
import MwasalatAdminChatPage from '../pages/mwasalat/MwasalatAdminChatPage.jsx';
import MwasalatVerifyCertificatePage from '../pages/mwasalat/MwasalatVerifyCertificatePage.jsx';
import MwasalatAllCoursesPage from '../pages/mwasalat/MwasalatAllCoursesPage.jsx';
import MwasalatAdminDepartmentsPage from '../pages/mwasalat/MwasalatAdminDepartmentsPage.jsx';
import MwasalatAdminCohortsPage from '../pages/mwasalat/MwasalatAdminCohortsPage.jsx';
import MwasalatAdminStaffPage from '../pages/mwasalat/MwasalatAdminStaffPage.jsx';
import MwasalatItSupportDashboard from '../pages/mwasalat/MwasalatItSupportDashboard.jsx';
import MwasalatItSupportAdminChatPage from '../pages/mwasalat/MwasalatItSupportAdminChatPage.jsx';
import MwasalatSupervisorDashboard from '../pages/mwasalat/MwasalatSupervisorDashboard.jsx';
import MwasalatSupervisorAdminChatPage from '../pages/mwasalat/MwasalatSupervisorAdminChatPage.jsx';
import { useMwasalatAuthStore } from '../store/mwasalatAuthStore.js';
import { MWASALAT_ROLE_LOGIN } from '../constants/mwasalatRoles.js';

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
      {/* IT Support's one read-only slice — its own dashboard plus activity logs, no admin CRUD. */}
      <Route element={<MwasalatProtectedRoute allowedRoles={['super_admin', 'it_support']} />}>
        <Route path="/admin/activity-log" element={<MwasalatAdminActivityLogPage />} />
        <Route path="/it-support/dashboard" element={<MwasalatItSupportDashboard />} />
        <Route path="/it-support/chat" element={<MwasalatItSupportAdminChatPage />} />
      </Route>
      {/* Supervisor's one read-only slice — direct-reports roster + progress. */}
      <Route element={<MwasalatProtectedRoute allowedRoles={['supervisor']} />}>
        <Route path="/supervisor/dashboard" element={<MwasalatSupervisorDashboard />} />
        <Route path="/supervisor/chat" element={<MwasalatSupervisorAdminChatPage />} />
      </Route>
      <Route element={<MwasalatProtectedRoute allowedRoles={['instructor']} />}>
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
      <Route element={<MwasalatProtectedRoute allowedRoles={['learner', 'external_learner']} />}>
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
      {/* Backward-compat: every old /mwasalat/... link (issued certificate QR
          codes, check-in QR codes, unexpired invite emails) keeps working
          indefinitely — see MwasalatLegacyPathRedirect above. */}
      <Route path="/mwasalat/*" element={<MwasalatLegacyPathRedirect />} />
      <Route path="*" element={<NotFoundRedirect />} />
    </Routes>
  );
}
