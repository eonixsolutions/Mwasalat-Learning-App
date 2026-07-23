import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import MwasalatLandingPage from '../pages/mwasalat/MwasalatLandingPage.jsx';
import MwasalatLogin from '../pages/mwasalat/MwasalatLogin.jsx';
import MwasalatAdminLogin from '../pages/mwasalat/MwasalatAdminLogin.jsx';
import MwasalatInstructorLogin from '../pages/mwasalat/MwasalatInstructorLogin.jsx';
import MwasalatAdminDashboard from '../pages/mwasalat/MwasalatAdminDashboard.jsx';
import MwasalatLearnersPage from '../pages/mwasalat/MwasalatLearnersPage.jsx';
import MwasalatAdminLearnerDetailPage from '../pages/mwasalat/MwasalatAdminLearnerDetailPage.jsx';
import MwasalatInstructorsPage from '../pages/mwasalat/MwasalatInstructorsPage.jsx';
import MwasalatAdminInstructorDetailPage from '../pages/mwasalat/MwasalatAdminInstructorDetailPage.jsx';
import MwasalatSetPasswordPage from '../pages/mwasalat/MwasalatSetPasswordPage.jsx';
import MwasalatInstructorDashboard from '../pages/mwasalat/MwasalatInstructorDashboard.jsx';
import MwasalatAddCoursePage from '../pages/mwasalat/MwasalatAddCoursePage.jsx';
import MwasalatProgramDetailPage from '../pages/mwasalat/MwasalatProgramDetailPage.jsx';
import MwasalatEditCoursePage from '../pages/mwasalat/MwasalatEditCoursePage.jsx';
import MwasalatRegister from '../pages/mwasalat/MwasalatRegister.jsx';
import MwasalatLearnerDashboard from '../pages/mwasalat/MwasalatLearnerDashboard.jsx';
import MwasalatCoursesCatalogPage from '../pages/mwasalat/MwasalatCoursesCatalogPage.jsx';
import MwasalatForgotPasswordPage from '../pages/mwasalat/MwasalatForgotPasswordPage.jsx';
import MwasalatResetPasswordPage from '../pages/mwasalat/MwasalatResetPasswordPage.jsx';
import MwasalatCheckInPage from '../pages/mwasalat/MwasalatCheckInPage.jsx';
import MwasalatQuizPage from '../pages/mwasalat/MwasalatQuizPage.jsx';
import MwasalatFeedbackPage from '../pages/mwasalat/MwasalatFeedbackPage.jsx';
import MwasalatWatchRecordingPage from '../pages/mwasalat/MwasalatWatchRecordingPage.jsx';
import MwasalatCompletedCoursesPage from '../pages/mwasalat/MwasalatCompletedCoursesPage.jsx';
import MwasalatCertificatePage from '../pages/mwasalat/MwasalatCertificatePage.jsx';
import MwasalatLearnerCourseDetailPage from '../pages/mwasalat/MwasalatLearnerCourseDetailPage.jsx';
import MwasalatLearnerChatPage from '../pages/mwasalat/MwasalatLearnerChatPage.jsx';
import MwasalatInstructorChatPage from '../pages/mwasalat/MwasalatInstructorChatPage.jsx';
import MwasalatLearnerDiscussionPage from '../pages/mwasalat/MwasalatLearnerDiscussionPage.jsx';
import MwasalatInstructorDiscussionPage from '../pages/mwasalat/MwasalatInstructorDiscussionPage.jsx';
import MwasalatInstructorStudentsPage from '../pages/mwasalat/MwasalatInstructorStudentsPage.jsx';
import MwasalatInstructorAtRiskPage from '../pages/mwasalat/MwasalatInstructorAtRiskPage.jsx';
import MwasalatAchievementsPage from '../pages/mwasalat/MwasalatAchievementsPage.jsx';
import MwasalatLearnerProfilePage from '../pages/mwasalat/MwasalatLearnerProfilePage.jsx';
import MwasalatInstructorProfilePage from '../pages/mwasalat/MwasalatInstructorProfilePage.jsx';
import MwasalatAdminProfilePage from '../pages/mwasalat/MwasalatAdminProfilePage.jsx';
import MwasalatAdminProgramsPage from '../pages/mwasalat/MwasalatAdminProgramsPage.jsx';
import MwasalatAdminCertificatesPage from '../pages/mwasalat/MwasalatAdminCertificatesPage.jsx';
import MwasalatAdminPaymentsPage from '../pages/mwasalat/MwasalatAdminPaymentsPage.jsx';
import MwasalatAdminSalesReportPage from '../pages/mwasalat/MwasalatAdminSalesReportPage.jsx';
import MwasalatAdminQuizResultsPage from '../pages/mwasalat/MwasalatAdminQuizResultsPage.jsx';
import MwasalatAdminActivityLogPage from '../pages/mwasalat/MwasalatAdminActivityLogPage.jsx';
import MwasalatAdminAnnouncementsPage from '../pages/mwasalat/MwasalatAdminAnnouncementsPage.jsx';
import MwasalatAdminSettingsPage from '../pages/mwasalat/MwasalatAdminSettingsPage.jsx';
import MwasalatVerifyCertificatePage from '../pages/mwasalat/MwasalatVerifyCertificatePage.jsx';
import MwasalatAllCoursesPage from '../pages/mwasalat/MwasalatAllCoursesPage.jsx';
import { useMwasalatAuthStore } from '../store/mwasalatAuthStore.js';

const MWASALAT_ROLE_LOGIN = {
  super_admin: '/mwasalat/admin/login',
  instructor: '/mwasalat/instructor/login',
  learner: '/mwasalat/login',
};

function MwasalatProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user } = useMwasalatAuthStore();
  if (!isAuthenticated || !user) {
    const loginPath = allowedRoles?.length === 1 ? MWASALAT_ROLE_LOGIN[allowedRoles[0]] : '/mwasalat/login';
    return <Navigate to={loginPath} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/mwasalat" replace />;
  }
  return <Outlet />;
}

function NotFoundRedirect() {
  return <Navigate to="/" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MwasalatLandingPage />} />
      <Route path="/mwasalat" element={<MwasalatLandingPage />} />
      <Route path="/mwasalat/login" element={<MwasalatLogin />} />
      <Route path="/mwasalat/register" element={<MwasalatRegister />} />
      <Route path="/mwasalat/forgot-password" element={<MwasalatForgotPasswordPage />} />
      <Route path="/mwasalat/reset-password/:token" element={<MwasalatResetPasswordPage />} />
      <Route path="/mwasalat/admin/login" element={<MwasalatAdminLogin />} />
      <Route path="/mwasalat/instructor/login" element={<MwasalatInstructorLogin />} />
      <Route path="/mwasalat/instructor/set-password/:token" element={<MwasalatSetPasswordPage />} />
      <Route path="/mwasalat/verify/:id" element={<MwasalatVerifyCertificatePage />} />
      <Route element={<MwasalatProtectedRoute allowedRoles={['super_admin']} />}>
        <Route path="/mwasalat/admin/dashboard" element={<MwasalatAdminDashboard />} />
        <Route path="/mwasalat/admin/learners" element={<MwasalatLearnersPage />} />
        <Route path="/mwasalat/admin/learners/:id" element={<MwasalatAdminLearnerDetailPage />} />
        <Route path="/mwasalat/admin/instructors" element={<MwasalatInstructorsPage />} />
        <Route path="/mwasalat/admin/instructors/:id" element={<MwasalatAdminInstructorDetailPage />} />
        <Route path="/mwasalat/admin/profile" element={<MwasalatAdminProfilePage />} />
        <Route path="/mwasalat/admin/programs" element={<MwasalatAdminProgramsPage />} />
        <Route path="/mwasalat/admin/certificates" element={<MwasalatAdminCertificatesPage />} />
        <Route path="/mwasalat/admin/payments" element={<MwasalatAdminPaymentsPage />} />
        <Route path="/mwasalat/admin/sales-report" element={<MwasalatAdminSalesReportPage />} />
        <Route path="/mwasalat/admin/quiz-results" element={<MwasalatAdminQuizResultsPage />} />
        <Route path="/mwasalat/admin/activity-log" element={<MwasalatAdminActivityLogPage />} />
        <Route path="/mwasalat/admin/announcements" element={<MwasalatAdminAnnouncementsPage />} />
        <Route path="/mwasalat/admin/settings" element={<MwasalatAdminSettingsPage />} />
      </Route>
      <Route element={<MwasalatProtectedRoute allowedRoles={['instructor']} />}>
        <Route path="/mwasalat/instructor/dashboard" element={<MwasalatInstructorDashboard />} />
        <Route path="/mwasalat/instructor/students" element={<MwasalatInstructorStudentsPage />} />
        <Route path="/mwasalat/instructor/at-risk" element={<MwasalatInstructorAtRiskPage />} />
        <Route path="/mwasalat/instructor/programs/new" element={<MwasalatAddCoursePage />} />
        <Route path="/mwasalat/instructor/programs/:id" element={<MwasalatProgramDetailPage />} />
        <Route path="/mwasalat/instructor/programs/:id/edit" element={<MwasalatEditCoursePage />} />
        <Route path="/mwasalat/instructor/programs/:id/watch" element={<MwasalatWatchRecordingPage />} />
        <Route path="/mwasalat/instructor/programs/:id/chat/:learnerId" element={<MwasalatInstructorChatPage />} />
        <Route path="/mwasalat/instructor/programs/:id/discussion" element={<MwasalatInstructorDiscussionPage />} />
        <Route path="/mwasalat/instructor/profile" element={<MwasalatInstructorProfilePage />} />
      </Route>
      <Route element={<MwasalatProtectedRoute allowedRoles={['learner']} />}>
        <Route path="/mwasalat/learner/dashboard" element={<MwasalatLearnerDashboard />} />
        <Route path="/mwasalat/learner/all-courses" element={<MwasalatAllCoursesPage />} />
        <Route path="/mwasalat/learner/courses" element={<MwasalatCoursesCatalogPage />} />
        <Route path="/mwasalat/learner/completed" element={<MwasalatCompletedCoursesPage />} />
        <Route path="/mwasalat/learner/achievements" element={<MwasalatAchievementsPage />} />
        <Route path="/mwasalat/learner/profile" element={<MwasalatLearnerProfilePage />} />
        <Route path="/mwasalat/learner/check-in/:id" element={<MwasalatCheckInPage />} />
        <Route path="/mwasalat/learner/programs/:id" element={<MwasalatLearnerCourseDetailPage />} />
        <Route path="/mwasalat/learner/programs/:id/chat" element={<MwasalatLearnerChatPage />} />
        <Route path="/mwasalat/learner/programs/:id/discussion" element={<MwasalatLearnerDiscussionPage />} />
        <Route path="/mwasalat/learner/programs/:id/watch" element={<MwasalatWatchRecordingPage />} />
        <Route path="/mwasalat/learner/programs/:id/quiz" element={<MwasalatQuizPage />} />
        <Route path="/mwasalat/learner/programs/:id/feedback" element={<MwasalatFeedbackPage />} />
        <Route path="/mwasalat/learner/programs/:id/certificate" element={<MwasalatCertificatePage />} />
      </Route>
      <Route path="*" element={<NotFoundRedirect />} />
    </Routes>
  );
}
