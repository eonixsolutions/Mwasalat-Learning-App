import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Bell, CheckCheck, UserCheck, MessageSquare,
  CheckCircle, Loader2, BellOff, ArrowRight,
} from 'lucide-react';
import { notificationService } from '../../services/notification.service.js';
import { useNotificationStore } from '../../store/notificationStore.js';
import { useAuth } from '../../hooks/useAuth.js';

const ROLE_STUDENTS_PATH = {
  super_admin:        '/admin/students',
  branch_admin:       '/branch-admin/students',
  branch_coordinator: '/coordinator/students',
};

function getNavTarget(type, role) {
  switch (type) {
    case 'student_registration':      return ROLE_STUDENTS_PATH[role] ? `${ROLE_STUDENTS_PATH[role]}?tab=approvals` : null;
    case 'STAFF_APPROVAL_REQUEST':    return '/admin/staff?section=approvals';
    case 'contact_inquiry':           return role === 'super_admin' ? '/admin/inquiries' : `/${role === 'branch_coordinator' ? 'coordinator' : role}/inquiries`;
    case 'day_submitted':             return role === 'technical_mentor' ? '/mentor/week-reviews' : null;
    case 'screening_triggered':
    case 'screening_rescheduled':     return role === 'technical_mentor' ? '/mentor/reviews' : null;
    case 'review_result':             return role === 'student' ? '/student/screening' : null;
    case 'review_scheduled':
      if (role === 'student')           return '/student/screening';
      if (role === 'technical_mentor')  return '/mentor/reviews';
      if (role === 'branch_coordinator') return '/coordinator/reviews';
      return null;
    default:                          return null;
  }
}

const TYPE_ICON = {
  student_registration:   UserCheck,
  STAFF_APPROVAL_REQUEST: UserCheck,
  account_activated:      CheckCircle,
  contact_inquiry:        MessageSquare,
  day_submitted:          CheckCircle,
  screening_triggered:    ArrowRight,
  screening_rescheduled:  ArrowRight,
  review_result:          CheckCircle,
  review_scheduled:       ArrowRight,
};

function NotifIcon({ type }) {
  const Icon = TYPE_ICON[type] ?? Bell;
  return (
    <div className="w-9 h-9 rounded-xl bg-[#FDEFEE] flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-[#CA6357]" />
    </div>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { markAsRead, markAllAsRead } = useNotificationStore();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications-page', filter, page],
    queryFn: () => notificationService.getAll({ limit: LIMIT, page, ...(filter === 'unread' ? { unread: true } : {}) }),
    keepPreviousData: true,
  });

  const notifications = data?.notifications ?? [];
  const total         = data?.pagination?.total ?? 0;
  const unreadCount   = data?.unreadCount ?? 0;
  const hasMore       = notifications.length < total;

  const markOneMutation = useMutation({
    mutationFn: notificationService.markRead,
    onSuccess: (_, id) => {
      markAsRead(id);
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => {
      markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: () => toast.error('Failed to mark all as read'),
  });

  const handleClick = (n) => {
    if (!n.isRead) markOneMutation.mutate(n._id);
    const target = getNavTarget(n.type, user?.role);
    if (target) navigate(target);
  };

  const filters = [
    { key: 'all',    label: 'All' },
    { key: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
  ];

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Bell className="w-7 h-7 text-white" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">Inbox</p>
              <h2 className="text-2xl font-bold text-white">Notifications</h2>
              {unreadCount > 0 && (
                <p className="text-white/60 text-sm mt-0.5">{unreadCount} unread</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors flex-shrink-0 disabled:opacity-60"
            >
              {markAllMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CheckCheck className="w-4 h-4" />}
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setPage(1); }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === f.key ? 'bg-[#CA6357] text-white' : 'text-[#475569] hover:bg-[#F8F9FB]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <BellOff className="w-10 h-10 text-[#CBD5E1]" strokeWidth={1.5} />
            <p className="text-sm text-[#94A3B8]">Failed to load notifications.</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <BellOff className="w-10 h-10 text-[#CBD5E1]" strokeWidth={1.5} />
            <p className="text-base font-bold text-[#1E293B]">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-sm text-[#94A3B8]">You're all caught up.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F8F9FB]">
            {notifications.map((n) => {
              const target = getNavTarget(n.type, user?.role);
              const isClickable = !!target;
              return (
                <div
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors group
                    ${n.isRead ? 'bg-white' : 'bg-[#F4FBFB]'}
                    ${isClickable ? 'cursor-pointer hover:bg-[#F8F9FB]' : ''}`}
                >
                  {/* Unread dot */}
                  <div className="flex-shrink-0 mt-2.5">
                    {!n.isRead
                      ? <span className="block w-2 h-2 rounded-full bg-[#C76D64]" />
                      : <span className="block w-2 h-2" />}
                  </div>

                  <NotifIcon type={n.type} />

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${n.isRead ? 'text-[#475569]' : 'text-[#1E293B] font-semibold'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[11px] text-[#CBD5E1] mt-1.5">
                      {new Date(n.createdAt).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {isClickable && (
                    <div className="flex-shrink-0 self-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#CA6357] bg-[#FDEFEE] group-hover:bg-[#F2B3AC] px-2.5 py-1 rounded-lg transition-colors">
                        Open <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  )}

                  {!n.isRead && !isClickable && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markOneMutation.mutate(n._id); }}
                      className="flex-shrink-0 self-center text-[10px] font-semibold text-[#94A3B8] hover:text-[#CA6357] transition-colors px-2 py-1 rounded-lg hover:bg-[#FDEFEE]"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 bg-white border border-[#E2E8F0] hover:border-[#CA6357] hover:text-[#CA6357] text-[#475569] font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
