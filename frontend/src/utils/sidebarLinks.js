import {
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  Calendar,
  Bell,
  UserCheck,
  Settings,
  GraduationCap,
  Building2,
  Layers,
  MessageSquare,
  BarChart3,
  FileText,
  ClipboardCheck,
  Star,
  Code2,
  CalendarOff,
  PalmtreeIcon,
  MonitorPlay,
  UserCircle,
  ClipboardList,
  Video,
} from 'lucide-react';
import { ROLES } from '../constants/roles.js';

const studentLinks = [
  { label: 'Dashboard',    to: '/student/dashboard',    icon: LayoutDashboard },
  { label: 'My Profile',   to: '/student/profile',      icon: UserCircle },
  { label: 'My Courses',   to: '/student/courses',      icon: BookOpen },
  { label: 'Task Sheets',  to: '/student/task-sheets',  icon: FileText },
  { label: 'Video Classes',to: '/student/video-classes',icon: MonitorPlay },
  { label: 'LeetCode',     to: '/student/leetcode',     icon: Code2 },
  { label: 'Leave',        to: '/student/leave',        icon: CalendarOff },
  { label: 'Attendance',   to: '/student/attendance',   icon: Calendar },
  { label: 'Fees',         to: '/student/fees',         icon: CreditCard },
  { label: 'Notifications',to: '/student/notifications',icon: Bell },
];

const superAdminLinks = [
  { label: 'Dashboard',     to: '/admin/dashboard',      icon: LayoutDashboard },
  { label: 'My Profile',    to: '/admin/profile',        icon: UserCircle },
  { label: 'Branches',      to: '/admin/branches',       icon: Building2 },
  { label: 'Batches',       to: '/admin/batches',        icon: Layers },
  { label: 'Students',      to: '/admin/students',       icon: GraduationCap },
  { label: 'Staff',         to: '/admin/staff',          icon: Users },
  { label: 'Courses',       to: '/admin/courses',        icon: BookOpen },
  { label: 'Task Sheets',   to: '/admin/task-sheets',    icon: ClipboardList },
  { label: 'LeetCode',      to: '/admin/leetcode',       icon: Code2 },
  { label: 'Video Classes', to: '/admin/video-classes',  icon: MonitorPlay },
  { label: 'Applications',  to: '/admin/applications',   icon: FileText },
  { label: 'Fees',          to: '/admin/fees',           icon: CreditCard },
  { label: 'Reports',       to: '/admin/reports',        icon: BarChart3 },
  { label: 'Inquiries',     to: '/admin/inquiries',      icon: MessageSquare },
  { label: 'Notifications', to: '/admin/notifications',  icon: Bell },
  { label: 'Settings',      to: '/admin/settings',       icon: Settings },
];

const branchAdminLinks = [
  { label: 'Dashboard',     to: '/branch-admin/dashboard',     icon: LayoutDashboard },
  { label: 'My Profile',    to: '/branch-admin/profile',       icon: UserCircle },
  { label: 'Students',      to: '/branch-admin/students',      icon: GraduationCap },
  { label: 'Mentors',       to: '/branch-admin/mentors',       icon: UserCheck },
  { label: 'Batches',       to: '/branch-admin/batches',       icon: Users },
  { label: 'Courses',       to: '/branch-admin/courses',       icon: BookOpen },
  { label: 'Fees',          to: '/branch-admin/fees',          icon: CreditCard },
  { label: 'Reports',       to: '/branch-admin/reports',       icon: BarChart3 },
  { label: 'Notifications', to: '/branch-admin/notifications', icon: Bell },
];

const coordinatorLinks = [
  { label: 'Dashboard',     to: '/coordinator/dashboard',     icon: LayoutDashboard },
  { label: 'My Profile',    to: '/coordinator/profile',       icon: UserCircle },
  { label: 'Students',      to: '/coordinator/students',      icon: GraduationCap },
  { label: 'Attendance',    to: '/coordinator/attendance',    icon: Calendar },
  { label: 'Payments',      to: '/coordinator/payments',      icon: CreditCard },
  { label: 'Holidays',      to: '/coordinator/holidays',      icon: PalmtreeIcon },
  { label: 'Inquiries',     to: '/coordinator/inquiries',     icon: MessageSquare },
  { label: 'Notifications', to: '/coordinator/notifications', icon: Bell },
];

const technicalMentorLinks = [
  { label: 'Dashboard',   to: '/mentor/dashboard',    icon: LayoutDashboard },
  { label: 'My Profile',  to: '/mentor/profile',      icon: UserCircle },
  { label: 'My Students', to: '/mentor/students',     icon: Users },
  { label: 'Courses',     to: '/mentor/courses',      icon: BookOpen },
  { label: 'Task Sheets', to: '/mentor/week-reviews', icon: ClipboardCheck },
  { label: 'Reviews',     to: '/mentor/reviews',      icon: Star },
  { label: 'LeetCode',       to: '/mentor/leetcode',  icon: Code2 },
  { label: 'Leave Requests', to: '/mentor/leaves',    icon: CalendarOff },
  { label: 'Attendance',     to: '/mentor/attendance',icon: Calendar },
  { label: 'Notifications',  to: '/mentor/notifications', icon: Bell },
];

const commMentorLinks = [
  { label: 'Dashboard',   to: '/comm-mentor/dashboard', icon: LayoutDashboard },
  { label: 'My Profile',  to: '/comm-mentor/profile',   icon: UserCircle },
  { label: 'My Students', to: '/comm-mentor/students',  icon: Users },
  { label: 'Sessions',    to: '/comm-mentor/sessions',  icon: MessageSquare },
  { label: 'Attendance',  to: '/comm-mentor/attendance',icon: Calendar },
];

export const getSidebarLinks = (user) => {
  const role = user?.role ?? user; // accept either full user object or raw role string
  switch (role) {
    case ROLES.SUPER_ADMIN:          return superAdminLinks;
    case ROLES.BRANCH_ADMIN:         return branchAdminLinks;
    case ROLES.BRANCH_COORDINATOR:   return coordinatorLinks;
    case ROLES.TECHNICAL_MENTOR:     return technicalMentorLinks;
    case ROLES.COMMUNICATION_MENTOR: return commMentorLinks;
    default: {
      if (user?.studentStatus === 'graduated') {
        return [
          { label: 'Dashboard',     to: '/student/dashboard',     icon: LayoutDashboard },
          { label: 'My Courses',    to: '/student/courses',       icon: BookOpen },
          { label: 'Notifications', to: '/student/notifications', icon: Bell },
        ];
      }
      const isCode2Career  = user?.courseName?.toLowerCase().includes('code2career');
      const hasScreenings  = user?.courseScreenings?.length > 0;
      let links = studentLinks.filter(l => isCode2Career || l.to !== '/student/leetcode');
      const notifIdx = links.findIndex(l => l.to === '/student/notifications');
      const insertIdx = notifIdx === -1 ? links.length : notifIdx;
      if (isCode2Career) {
        links = [...links.slice(0, insertIdx), { label: 'Reviews', to: '/student/reviews', icon: Video }, ...links.slice(insertIdx)];
      } else if (hasScreenings) {
        links = [...links.slice(0, insertIdx), { label: 'Screenings', to: '/student/screening', icon: ClipboardList }, ...links.slice(insertIdx)];
      }
      return links;
    }
  }
};
