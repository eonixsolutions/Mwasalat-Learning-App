import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import socket from '../api/socket.js';
import { useAuthStore } from '../store/authStore.js';
import { useNotificationStore } from '../store/notificationStore.js';
import { QK } from '../constants/queryKeys.js';

const invalidate = (queryClient, ...keys) =>
  keys.forEach((key) => queryClient.invalidateQueries({ queryKey: key, refetchType: 'all' }));

// Handles roles_updated outside React — safe because authStore is a plain Zustand store
const handleRolesUpdated = ({ roles }) => {
  const { user, updateUser, logout } = useAuthStore.getState();
  if (!user) return;

  if (!roles.includes(user.role)) {
    // Current role was removed — force re-login so the JWT picks up the new role
    logout();
    toast('Your role was changed by an admin. Please log in again.', { icon: 'ℹ️', duration: 6000 });
  } else {
    // Role added — update the stored roles array so the role switcher reflects it immediately
    updateUser({ ...user, roles });
    toast('Your account roles were updated by an admin.', { icon: 'ℹ️', duration: 4000 });
  }
};

// Per-event cache update strategies.
// `invalidate` calls invalidateQueries with refetchType:'all' so inactive observers
// (e.g. tabs not currently visible) also get fresh data when they become active.
const buildHandlers = (queryClient) => ({

  STAFF_APPROVAL_REQUEST: () => {
    queryClient.setQueryData(QK.STAFF_PENDING_COUNT, (old = 0) => old + 1);
    invalidate(queryClient, ['staff', 'approvals']);
  },

  student_registration: () => {
    invalidate(queryClient, QK.STUDENTS, QK.PAYMENTS);
  },

  enrollment_requested: () => {
    invalidate(queryClient, QK.STUDENTS, QK.PAYMENTS);
  },

  account_activated: () => {
    const { user, logout } = useAuthStore.getState();
    // Any logged-in student receiving this must be a re-enrollment approval.
    // First-time students are never logged in before their account is activated.
    // Force re-login so the JWT picks up the newly approved enrollment.
    if (user?.role === 'student') {
      setTimeout(() => {
        logout();
        toast.success('Your enrollment has been approved! Please log in to access your new course.', { duration: 7000 });
      }, 1500);
    }
  },

  student_profile_updated: () => {
    invalidate(queryClient, QK.STUDENTS, QK.STUDENT_ME);
  },

  task_sheet_provisioned: () => {
    invalidate(queryClient, QK.STUDENT_ME);
  },

  fee_payment_submitted: () => {
    invalidate(queryClient, QK.PENDING_INSTALLMENT_PAYMENTS, QK.PAYMENTS_PENDING);
  },

  fee_payment_approved: (notification) => {
    const { accessValidUntilWeek } = notification.data ?? {};
    if (accessValidUntilWeek !== undefined) {
      // Patch enrollment cache directly so content unlocks without waiting for an HTTP refetch.
      queryClient.setQueryData(QK.ENROLLMENT, (old) => {
        if (!old?.feeAccount) return old;
        return { ...old, feeAccount: { ...old.feeAccount, accessValidUntilWeek } };
      });
    }
    invalidate(queryClient, QK.ENROLLMENT, QK.STUDENT_FEES, QK.MY_FEE_ACCOUNT);
  },

  fee_payment_rejected: () => {
    // Covers installment rejections and re-enrollment rejections
    invalidate(queryClient, QK.ENROLLMENT, QK.MY_ENROLLMENTS, QK.STUDENT_FEES, QK.MY_FEE_ACCOUNT);
  },

  review_result: () => {
    invalidate(queryClient, QK.MY_REVIEWS, QK.MY_SCREENINGS, QK.ENROLLMENT);
  },

  course_completed: () => {
    const { user, updateUser } = useAuthStore.getState();
    if (user) updateUser({ ...user, studentStatus: 'graduated' });
    invalidate(queryClient, QK.ENROLLMENT, QK.MY_ENROLLMENTS);
  },

  screening_triggered: () => {
    invalidate(queryClient, ['reviews', 'pending']);
  },

  review_scheduled: () => {
    invalidate(queryClient, ['review-slots'], ['reviews', 'pending']);
  },
});

export default function useSocket() {
  const { isAuthenticated, user } = useAuthStore();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;

    const userId  = user._id;
    const handlers = buildHandlers(queryClient);

    const handleConnect = () => {
      socket.emit('join-room', userId);
    };

    const handleNotification = (notification) => {
      const activeRole = useAuthStore.getState().user?.role;
      const isForThisRole = !notification.targetRole || notification.targetRole === activeRole;

      if (isForThisRole) {
        addNotification(notification);
        toast(notification.title, { icon: '🔔' });
      }

      const handler = handlers[notification.type];
      if (handler) handler(notification);
    };

    const handleLeetcodeHoldUpdate = () => {
      invalidate(queryClient, QK.LEETCODE_ME);
    };

    const handleTaskSheetPublished = ({ courseId, week }) => {
      invalidate(
        queryClient,
        ['task-sheet-published', courseId],
        ['task-sheet-content', courseId, week],
        ['task-sheet-list', courseId],
        ['task-sheet-preview', courseId, week],
      );
    };

    socket.on('connect', handleConnect);
    socket.on('notification', handleNotification);
    socket.on('leetcode_hold_update', handleLeetcodeHoldUpdate);
    socket.on('roles_updated', handleRolesUpdated);
    socket.on('task_sheet_published', handleTaskSheetPublished);

    socket.connect();

    if (socket.connected) {
      socket.emit('join-room', userId);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('notification', handleNotification);
      socket.off('leetcode_hold_update', handleLeetcodeHoldUpdate);
      socket.off('roles_updated', handleRolesUpdated);
      socket.off('task_sheet_published', handleTaskSheetPublished);
      socket.disconnect();
    };
  }, [isAuthenticated, user?._id, addNotification, queryClient]);
}
