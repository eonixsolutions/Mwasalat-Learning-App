import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import socket from '../api/socket.js';
import { useAuthStore } from '../store/authStore.js';

const HEARTBEAT_INTERVAL = 5 * 60 * 1000;  // emit every 5 min
const IDLE_THRESHOLD     = 3 * 60 * 1000;  // 3 min no activity = idle

export default function useHeartbeat() {
  const { user, isAuthenticated } = useAuthStore();
  const lastActivityRef = useRef(Date.now());
  const intervalRef     = useRef(null);
  const queryClient     = useQueryClient();

  const isStudent = isAuthenticated && user?.role === 'student';

  useEffect(() => {
    if (!isStudent || !user?._id) return;

    const resetIdle = () => { lastActivityRef.current = Date.now(); };

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetIdle, { passive: true }));

    const sendHeartbeat = () => {
      const idle = Date.now() - lastActivityRef.current > IDLE_THRESHOLD;
      const hidden = document.visibilityState === 'hidden';
      if (!idle && !hidden && socket.connected) {
        socket.emit('heartbeat', user._id);
        // Refresh usage display immediately after recording a beat
        queryClient.invalidateQueries({ queryKey: ['app-usage'] });
      }
    };

    sendHeartbeat();
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle));
      clearInterval(intervalRef.current);
    };
  }, [isStudent, user?._id, queryClient]);
}
