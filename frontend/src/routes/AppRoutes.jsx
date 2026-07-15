import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import LandingPage from '../pages/landing/LandingPage.jsx';
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
import MwasalatAdminSettingsPage from '../pages/mwasalat/MwasalatAdminSettingsPage.jsx';
import { useMwasalatAuthStore } from '../store/mwasalatAuthStore.js';
import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import ForgotPassword from '../pages/auth/ForgotPassword.jsx';
import VerifyEmail from '../pages/auth/VerifyEmail.jsx';
import RegistrationPayment from '../pages/auth/RegistrationPayment.jsx';
import PaymentPending from '../pages/auth/PaymentPending.jsx';
import PaymentsPage from '../pages/dashboard/coordinator/PaymentsPage.jsx';
import SuperAdminLogin from '../pages/auth/SuperAdminLogin.jsx';
import StaffLogin from '../pages/auth/StaffLogin.jsx';
import StudentDashboard from '../pages/dashboard/StudentDashboard.jsx';
import StudentCoursesPage from '../pages/dashboard/student/CoursesPage.jsx';
import StudentProfilePage from '../pages/dashboard/student/ProfilePage.jsx';
import StudentAttendancePage from '../pages/dashboard/student/AttendancePage.jsx';
import StudentsPage from '../pages/dashboard/students/StudentsPage.jsx';
import StaffPage from '../pages/dashboard/admin/StaffPage.jsx';
import StaffRegister from '../pages/auth/StaffRegister.jsx';
import AdminDashboard from '../pages/dashboard/AdminDashboard.jsx';
import CoursesPage from '../pages/dashboard/admin/CoursesPage.jsx';
import BranchesPage from '../pages/dashboard/admin/BranchesPage.jsx';
import BatchesPage from '../pages/dashboard/admin/BatchesPage.jsx';
import StaffAttendancePage from '../pages/dashboard/staff/StaffAttendancePage.jsx';
import CourseRequestsPage from '../pages/dashboard/admin/CourseRequestsPage.jsx';
import TaskApprovalsPage from '../pages/dashboard/coordinator/TaskApprovalsPage.jsx';
import ReviewsPage from '../pages/dashboard/coordinator/ReviewsPage.jsx';
import LeetCodeVerificationPage from '../pages/dashboard/coordinator/LeetCodeVerificationPage.jsx';
import MentorLeetCodePage from '../pages/dashboard/mentor/MentorLeetCodePage.jsx';
import HolidayPage from '../pages/dashboard/coordinator/HolidayPage.jsx';
import LeaveApprovalPage from '../pages/dashboard/mentor/LeaveApprovalPage.jsx';
import MentorDashboard from '../pages/dashboard/MentorDashboard.jsx';
import WeekReviewPage from '../pages/dashboard/mentor/WeekReviewPage.jsx';
import LeetCodeAdminPage from '../pages/dashboard/admin/LeetCodeAdminPage.jsx';
import LeetCodePage from '../pages/dashboard/student/LeetCodePage.jsx';
import LeaveRequestPage from '../pages/dashboard/student/LeaveRequestPage.jsx';
import TaskSheetPage from '../pages/dashboard/student/TaskSheetPage.jsx';
import WeekTaskSheetPage from '../pages/dashboard/student/WeekTaskSheetPage.jsx';
import TaskSheetsAdminPage from '../pages/dashboard/admin/TaskSheetsAdminPage.jsx';
import TaskSheetEditorPage from '../pages/dashboard/admin/TaskSheetEditorPage.jsx';
import TaskSheetsIndexPage from '../pages/dashboard/admin/TaskSheetsIndexPage.jsx';
import VideoClassesPage from '../pages/dashboard/student/VideoClassesPage.jsx';
import VideoManagePage from '../pages/dashboard/admin/VideoManagePage.jsx';
import ContactInquiriesPage from '../pages/dashboard/shared/ContactInquiriesPage.jsx';
import NotificationsPage from '../pages/shared/NotificationsPage.jsx';
import ScreeningPage from '../pages/dashboard/student/ScreeningPage.jsx';
import WeeklyReviewPage from '../pages/dashboard/student/WeeklyReviewPage.jsx';
import MentorStudentsPage from '../pages/dashboard/mentor/MentorStudentsPage.jsx';
import StudentAcademicProfile from '../pages/dashboard/shared/StudentAcademicProfile.jsx';
import MentorCoursesPage from '../pages/dashboard/mentor/MentorCoursesPage.jsx';
import StaffProfilePage from '../pages/dashboard/staff/StaffProfilePage.jsx';
import AdminProfilePage from '../pages/dashboard/admin/AdminProfilePage.jsx';
import FeeStructurePage from '../pages/dashboard/admin/FeeStructurePage.jsx';
import FeesPage from '../pages/dashboard/student/FeesPage.jsx';
import ReEnrollPage from '../pages/dashboard/student/ReEnrollPage.jsx';
import { ROLES, ROLE_DASHBOARD, ROLE_LOGIN } from '../constants/roles.js';
import { useAuth } from '../hooks/useAuth.js';

const GRADUATED_ALLOWED = ['/student/dashboard', '/student/courses', '/student/notifications', '/student/profile'];

function GraduatedGuard() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  if (user?.studentStatus === 'graduated' && !GRADUATED_ALLOWED.includes(pathname)) {
    return <Navigate to="/student/courses" replace />;
  }
  return <Outlet />;
}

function RoleGate({ role }) {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user?.role === role)
    return <Navigate to={ROLE_DASHBOARD[role]} replace />;
  return <Navigate to={ROLE_LOGIN[role]} replace />;
}

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

function AdminGate() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user?.role === ROLES.SUPER_ADMIN)
    return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/admin/login" replace />;
}

function NotFoundRedirect() {
  const { pathname } = useLocation();
  return <Navigate to={pathname.startsWith('/mwasalat') ? '/mwasalat' : '/'} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/register/staff" element={<StaffRegister />} />
      <Route path="/login" element={<Login />} />

      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<PlaceholderPage title="Reset Password" />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/register/pay" element={<RegistrationPayment />} />
        <Route path="/register/payment-pending" element={<PaymentPending />} />
      </Route>

      {/* Student */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.STUDENT]} />}>
        <Route element={<DashboardLayout />}>
          {/* Re-enroll page — accessible even for graduated students */}
          <Route path="/student/re-enroll" element={<ReEnrollPage />} />
          {/* All other student routes — redirect to re-enroll when graduated */}
          <Route element={<GraduatedGuard />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/courses" element={<StudentCoursesPage />} />
            <Route path="/student/leetcode" element={<LeetCodePage />} />
            <Route path="/student/leave" element={<LeaveRequestPage />} />
            <Route path="/student/task-sheets" element={<TaskSheetPage />} />
            <Route path="/student/task-sheets/week/:week" element={<WeekTaskSheetPage />} />
            <Route path="/student/video-classes" element={<VideoClassesPage />} />
            <Route path="/student/attendance" element={<StudentAttendancePage />} />
            <Route path="/student/fees" element={<FeesPage />} />
            <Route path="/student/notifications" element={<NotificationsPage />} />
            <Route path="/student/screening" element={<ScreeningPage />} />
            <Route path="/student/reviews" element={<WeeklyReviewPage />} />
            <Route path="/student/profile" element={<StudentProfilePage />} />
          </Route>
        </Route>
      </Route>

      {/* Super Admin */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/profile" element={<AdminProfilePage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/branches" element={<BranchesPage />} />
          <Route path="/admin/batches" element={<BatchesPage />} />
          <Route path="/admin/students" element={<StudentsPage />} />
          <Route path="/admin/students/:studentId" element={<StudentAcademicProfile />} />
          <Route path="/admin/staff" element={<StaffPage />} />
          <Route path="/admin/courses" element={<CoursesPage />} />
          <Route path="/admin/leetcode" element={<LeetCodeAdminPage />} />
          <Route path="/admin/video-classes" element={<VideoManagePage />} />
          <Route path="/admin/course-requests" element={<CourseRequestsPage />} />
          <Route path="/admin/applications" element={<ComingSoon title="Applications" />} />
          <Route path="/admin/fees" element={<FeeStructurePage />} />
          <Route path="/admin/reports" element={<ComingSoon title="Reports" />} />
          <Route path="/admin/notifications" element={<NotificationsPage />} />
          <Route path="/admin/settings" element={<ComingSoon title="Settings" />} />
          <Route path="/admin/inquiries" element={<ContactInquiriesPage />} />
          <Route path="/admin/task-sheets" element={<TaskSheetsIndexPage />} />
          <Route path="/admin/task-sheets/:courseId" element={<TaskSheetsAdminPage />} />
          <Route path="/admin/task-sheets/:courseId/editor" element={<TaskSheetEditorPage />} />
        </Route>
      </Route>

      {/* Branch Admin */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.BRANCH_ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/branch-admin/profile" element={<StaffProfilePage />} />
          <Route path="/branch-admin/dashboard" element={<ComingSoon title="Branch Admin Dashboard" />} />
          <Route path="/branch-admin/students" element={<ComingSoon title="Students" />} />
          <Route path="/branch-admin/mentors" element={<ComingSoon title="Mentors" />} />
          <Route path="/branch-admin/batches" element={<BatchesPage />} />
          <Route path="/branch-admin/courses" element={<ComingSoon title="Courses" />} />
          <Route path="/branch-admin/fees" element={<ComingSoon title="Fees" />} />
          <Route path="/branch-admin/reports" element={<ComingSoon title="Reports" />} />
          <Route path="/branch-admin/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      {/* Branch Coordinator */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.BRANCH_COORDINATOR]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/coordinator/profile" element={<StaffProfilePage />} />
          <Route path="/coordinator/dashboard" element={<ComingSoon title="Coordinator Dashboard" />} />
          <Route path="/coordinator/students" element={<StudentsPage />} />
          <Route path="/coordinator/attendance" element={<StaffAttendancePage />} />
          <Route path="/coordinator/payments" element={<PaymentsPage />} />
          <Route path="/coordinator/installments" element={<Navigate to="/coordinator/payments?tab=installments" replace />} />
          <Route path="/coordinator/holidays" element={<HolidayPage />} />
          <Route path="/coordinator/notifications" element={<NotificationsPage />} />
          <Route path="/coordinator/inquiries" element={<ContactInquiriesPage />} />
          <Route path="/coordinator/students/:studentId" element={<StudentAcademicProfile />} />
        </Route>
      </Route>

      {/* Technical Mentor */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.TECHNICAL_MENTOR]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/mentor/profile" element={<StaffProfilePage />} />
          <Route path="/mentor/dashboard" element={<MentorDashboard />} />
          <Route path="/mentor/students" element={<MentorStudentsPage />} />
          <Route path="/mentor/students/:studentId" element={<StudentAcademicProfile />} />
          <Route path="/mentor/courses" element={<MentorCoursesPage />} />
          <Route path="/mentor/tasks" element={<TaskApprovalsPage />} />
          <Route path="/mentor/reviews" element={<ReviewsPage />} />
          <Route path="/mentor/leetcode" element={<MentorLeetCodePage />} />
          <Route path="/mentor/attendance" element={<StaffAttendancePage />} />
          <Route path="/mentor/week-reviews" element={<WeekReviewPage />} />
          <Route path="/mentor/leaves" element={<LeaveApprovalPage />} />
          <Route path="/mentor/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      {/* Communication Mentor */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.COMMUNICATION_MENTOR]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/comm-mentor/profile" element={<StaffProfilePage />} />
          <Route path="/comm-mentor/dashboard" element={<ComingSoon title="Communication Mentor Dashboard" />} />
          <Route path="/comm-mentor/students" element={<ComingSoon title="My Students" />} />
          <Route path="/comm-mentor/sessions" element={<ComingSoon title="Sessions" />} />
          <Route path="/comm-mentor/attendance" element={<StaffAttendancePage />} />
        </Route>
      </Route>

      <Route path="/admin/login" element={<SuperAdminLogin />} />
      <Route path="/branch-admin/login" element={<StaffLogin variant="branch-admin" />} />
      <Route path="/coordinator/login" element={<StaffLogin variant="coordinator" />} />
      <Route path="/mentor/login" element={<StaffLogin variant="mentor" />} />
      <Route path="/comm-mentor/login" element={<StaffLogin variant="comm-mentor" />} />
      <Route path="/admin" element={<AdminGate />} />
      <Route path="/branch-admin" element={<RoleGate role={ROLES.BRANCH_ADMIN} />} />
      <Route path="/coordinator" element={<RoleGate role={ROLES.BRANCH_COORDINATOR} />} />
      <Route path="/mentor" element={<RoleGate role={ROLES.TECHNICAL_MENTOR} />} />
      <Route path="/comm-mentor" element={<RoleGate role={ROLES.COMMUNICATION_MENTOR} />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/mwasalat" element={<MwasalatLandingPage />} />
      <Route path="/mwasalat/login" element={<MwasalatLogin />} />
      <Route path="/mwasalat/register" element={<MwasalatRegister />} />
      <Route path="/mwasalat/forgot-password" element={<MwasalatForgotPasswordPage />} />
      <Route path="/mwasalat/reset-password/:token" element={<MwasalatResetPasswordPage />} />
      <Route path="/mwasalat/admin/login" element={<MwasalatAdminLogin />} />
      <Route path="/mwasalat/instructor/login" element={<MwasalatInstructorLogin />} />
      <Route path="/mwasalat/instructor/set-password/:token" element={<MwasalatSetPasswordPage />} />
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
        <Route path="/mwasalat/admin/settings" element={<MwasalatAdminSettingsPage />} />
      </Route>
      <Route element={<MwasalatProtectedRoute allowedRoles={['instructor']} />}>
        <Route path="/mwasalat/instructor/dashboard" element={<MwasalatInstructorDashboard />} />
        <Route path="/mwasalat/instructor/programs/new" element={<MwasalatAddCoursePage />} />
        <Route path="/mwasalat/instructor/programs/:id" element={<MwasalatProgramDetailPage />} />
        <Route path="/mwasalat/instructor/programs/:id/edit" element={<MwasalatEditCoursePage />} />
        <Route path="/mwasalat/instructor/programs/:id/watch" element={<MwasalatWatchRecordingPage />} />
        <Route path="/mwasalat/instructor/programs/:id/chat/:learnerId" element={<MwasalatInstructorChatPage />} />
        <Route path="/mwasalat/instructor/profile" element={<MwasalatInstructorProfilePage />} />
      </Route>
      <Route element={<MwasalatProtectedRoute allowedRoles={['learner']} />}>
        <Route path="/mwasalat/learner/dashboard" element={<MwasalatLearnerDashboard />} />
        <Route path="/mwasalat/learner/courses" element={<MwasalatCoursesCatalogPage />} />
        <Route path="/mwasalat/learner/completed" element={<MwasalatCompletedCoursesPage />} />
        <Route path="/mwasalat/learner/achievements" element={<MwasalatAchievementsPage />} />
        <Route path="/mwasalat/learner/profile" element={<MwasalatLearnerProfilePage />} />
        <Route path="/mwasalat/learner/check-in/:id" element={<MwasalatCheckInPage />} />
        <Route path="/mwasalat/learner/programs/:id" element={<MwasalatLearnerCourseDetailPage />} />
        <Route path="/mwasalat/learner/programs/:id/chat" element={<MwasalatLearnerChatPage />} />
        <Route path="/mwasalat/learner/programs/:id/watch" element={<MwasalatWatchRecordingPage />} />
        <Route path="/mwasalat/learner/programs/:id/quiz" element={<MwasalatQuizPage />} />
        <Route path="/mwasalat/learner/programs/:id/feedback" element={<MwasalatFeedbackPage />} />
        <Route path="/mwasalat/learner/programs/:id/certificate" element={<MwasalatCertificatePage />} />
      </Route>
      <Route path="*" element={<NotFoundRedirect />} />
    </Routes>
  );
}

function ComingSoon({ title }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-200 mb-2">{title}</p>
        <p className="text-sm text-gray-400">Use /new-module to scaffold this feature</p>
      </div>
    </div>
  );
}

function PlaceholderPage({ title, subtitle }) {
  return (
    <div className="text-center py-4">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-gray-500 mt-2 text-sm">{subtitle}</p>}
    </div>
  );
}
