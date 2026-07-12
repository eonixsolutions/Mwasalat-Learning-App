import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Bell, CheckCheck, X, ArrowRight, Mail, Phone, MessageCircle, User, Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contactService } from '../services/contact.service.js';
import Sidebar from './Sidebar.jsx';
import { FeeReminderModal } from '../components/student/FeeReminderModal.jsx';
import { useNotificationStore } from '../store/notificationStore.js';
import { notificationService } from '../services/notification.service.js';
import { useAuthStore } from '../store/authStore.js';
import useSocket from '../hooks/useSocket.js';
import useHeartbeat from '../hooks/useHeartbeat.js';

const ROLE_STUDENTS_PATH = {
  super_admin:        '/admin/students',
  branch_admin:       '/branch-admin/students',
  branch_coordinator: '/coordinator/students',
};

// Build a destination path for a notification, given the viewer's role
function getNotificationLink(type, role) {
  switch (type) {
    case 'STAFF_APPROVAL_REQUEST':
      return '/admin/staff?section=approvals';
    case 'student_registration':
    case 'enrollment_requested':
      return ROLE_STUDENTS_PATH[role] ? `${ROLE_STUDENTS_PATH[role]}?tab=approvals` : null;
    case 'fee_payment_submitted':
      if (role === 'branch_coordinator') return '/coordinator/payments?tab=installments';
      if (role === 'super_admin' || role === 'branch_admin') return '/coordinator/payments?tab=installments';
      return null;
    case 'fee_payment_approved':
    case 'fee_payment_rejected':
      return role === 'student' ? '/student/fees' : null;
    case 'task_sheet_provisioned':
      return role === 'student' ? '/student/task-sheets' : null;
    case 'course_completed':
      return role === 'student' ? '/student/dashboard' : null;
    case 'day_submitted':
      return role === 'technical_mentor' ? '/mentor/week-reviews' : null;
    case 'screening_triggered':
    case 'screening_rescheduled':
      return role === 'technical_mentor' ? '/mentor/reviews' : null;
    case 'review_result':
      return role === 'student' ? '/student/screening' : null;
    case 'review_scheduled':
      if (role === 'student')              return '/student/screening';
      if (role === 'technical_mentor')     return '/mentor/reviews';
      if (role === 'branch_coordinator')   return '/coordinator/reviews';
      return null;
    default:
      return null;
  }
}

function InquiryModal({ inquiryId, onClose }) {
  const { data: inquiry, isLoading, isError } = useQuery({
    queryKey: ['contact-inquiry', inquiryId],
    queryFn: () => contactService.getById(inquiryId),
    enabled: !!inquiryId,
  });

  const contact = inquiry?.contact ?? '';
  const isEmail = contact.includes('@');
  const digits = contact.replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${digits.startsWith('91') ? digits : '91' + digits}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FDEFEE] flex items-center justify-center">
              <Mail className="w-4 h-4 text-[#CA6357]" />
            </div>
            <span className="text-sm font-bold text-[#1E293B]">Contact Inquiry</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-[#94A3B8]" />
          </button>
        </div>

        {!inquiryId && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-[#94A3B8]">This is an older notification — open the <strong>Inquiries</strong> page to view it.</p>
          </div>
        )}

        {inquiryId && isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
          </div>
        )}

        {inquiryId && isError && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-red-500">Failed to load inquiry. Please try again.</p>
          </div>
        )}

        {inquiry && (
          <>
            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[#F8F9FB] rounded-xl">
                <div className="w-9 h-9 rounded-full bg-[#FDEFEE] flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-[#CA6357]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1E293B]">{inquiry.name}</p>
                  <p className="text-xs text-[#94A3B8]">{inquiry.contact}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-1.5">Message</p>
                <p className="text-sm text-[#475569] leading-relaxed bg-[#F8F9FB] rounded-xl px-4 py-3 whitespace-pre-wrap">
                  {inquiry.message}
                </p>
              </div>

              <p className="text-xs text-[#94A3B8]">
                Received {new Date(inquiry.createdAt).toLocaleString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>

            {/* Reply actions */}
            <div className="px-5 pb-5 flex flex-col gap-2">
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-0.5">Reply via</p>
              {isEmail ? (
                <a
                  href={`mailto:${contact}`}
                  className="flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  <Mail className="w-4 h-4" />
                  Send Email
                </a>
              ) : (
                <div className="flex gap-2">
                  <a
                    href={`tel:${contact}`}
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-[#CA6357] text-[#CA6357] hover:bg-[#FDEFEE] font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function NotificationPanel({ onClose, isLoading, onInquiryClick, user }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();

  const markOneMutation = useMutation({
    mutationFn: notificationService.markRead,
    onSuccess: (_, id) => markAsRead(id),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllRead({ role: user?.role }),
    onSuccess: () => {
      markAllAsRead();
      qc.invalidateQueries(['notifications', user?.role]);
    },
  });

  const handleClick = (n) => {
    if (!n.isRead) markOneMutation.mutate(n._id);

    if (n.type === 'contact_inquiry') {
      onInquiryClick(n);
      return;
    }

    const link = getNotificationLink(n.type, user?.role);
    if (link) {
      onClose();
      navigate(link);
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#1E293B]">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs font-bold bg-[#C76D64] text-white px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              className="text-xs text-[#CA6357] hover:text-[#A94E43] font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#FDEFEE] transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
        {isLoading && (
          <div className="py-8 text-center text-sm text-[#94A3B8]">Loading…</div>
        )}
        {!isLoading && notifications.length === 0 && (
          <div className="py-10 text-center">
            <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-[#94A3B8]">No notifications yet</p>
          </div>
        )}
        {notifications.map((n) => {
          const isInquiry = n.type === 'contact_inquiry';
          const hasLink = !!getNotificationLink(n.type, user?.role);
          const isClickable = isInquiry || hasLink;
          return (
            <div
              key={n._id}
              onClick={() => handleClick(n)}
              className={`flex gap-3 px-4 py-3 transition-colors group
                ${n.isRead ? 'bg-white' : 'bg-[#F4FBFB]'}
                ${isClickable ? 'cursor-pointer hover:bg-[#F8F9FB]' : ''}`}
            >
              {/* Unread dot */}
              <div className="flex-shrink-0 mt-1.5">
                {!n.isRead
                  ? <span className="block w-2 h-2 rounded-full bg-[#C76D64]" />
                  : <span className="block w-2 h-2" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${n.isRead ? 'text-[#475569]' : 'text-[#1E293B] font-medium'}`}>
                  {n.title}
                </p>
                <p className="text-xs text-[#94A3B8] mt-0.5 leading-snug">{n.message}</p>
                <p className="text-xs text-[#94A3B8] mt-1">
                  {new Date(n.createdAt).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>

              {isClickable && (
                <div className="flex-shrink-0 self-center">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#CA6357] bg-[#FDEFEE] group-hover:bg-[#F2B3AC] px-2 py-1 rounded-lg transition-colors">
                    Open <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  // null = modal closed, string = modal open (fetches by ID), 'no-id' = modal open for old notifications
  const [inquiryId, setInquiryId] = useState(null);
  const { unreadCount, setNotifications } = useNotificationStore();
  const { isAuthenticated, user } = useAuthStore();
  const bellRef = useRef(null);

  useSocket();
  useHeartbeat();

  // Fetch notifications scoped to the active role — each role sees only its own notifications
  const { data: notifData, isLoading: notifLoading } = useQuery({
    queryKey: ['notifications', user?.role],
    queryFn: () => notificationService.getAll({ limit: 30, role: user?.role }),
    staleTime: 60_000,
    enabled: isAuthenticated,
  });
  useEffect(() => {
    if (notifData?.notifications) setNotifications(notifData.notifications);
  }, [notifData, setNotifications]);

  // Close panel on outside click
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 flex-shrink-0 shadow-sm">
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="ml-auto flex items-center gap-1">
            {isAuthenticated && (
              <div ref={bellRef} className="relative">
                <button
                  className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  onClick={() => setBellOpen((v) => !v)}
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#C76D64] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <NotificationPanel
                    onClose={() => setBellOpen(false)}
                    isLoading={notifLoading}
                    onInquiryClick={(n) => { setBellOpen(false); setInquiryId(n.data?.inquiryId || 'no-id'); }}
                    user={user}
                  />
                )}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {inquiryId && (
        <InquiryModal
          inquiryId={inquiryId === 'no-id' ? null : inquiryId}
          onClose={() => setInquiryId(null)}
        />
      )}

      <FeeReminderModal />
    </div>
  );
}
