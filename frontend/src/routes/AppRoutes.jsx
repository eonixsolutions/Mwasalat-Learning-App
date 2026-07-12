import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import LandingPage from '../pages/landing/LandingPage.jsx';
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

function AdminGate() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user?.role === ROLES.SUPER_ADMIN)
    return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/admin/login" replace />;
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
      <Route path="*" element={<Navigate to="/" replace />} />
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
