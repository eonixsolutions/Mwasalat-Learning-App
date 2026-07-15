import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Megaphone } from 'lucide-react';
import { mwasalatNotificationService } from '../../services/mwasalatNotification.service.js';
import { useMwasalatNotificationStore } from '../../store/mwasalatNotificationStore.js';
import useMwasalatSocket from '../../hooks/useMwasalatSocket.js';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function MwasalatNotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { notifications, unreadCount, setNotifications, markAsRead, markAllAsRead } = useMwasalatNotificationStore();

  useMwasalatSocket();

  useEffect(() => {
    mwasalatNotificationService.list().then(setNotifications).catch(() => {});
  }, [setNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = (id) => {
    markAsRead(id);
    mwasalatNotificationService.markRead(id).catch(() => {});
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    mwasalatNotificationService.markAllRead().catch(() => {});
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-mwasalatRed-500" />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-white rounded-2xl border border-[#E2E8F0] z-50 overflow-hidden"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
            <p className="text-sm font-semibold text-[#1E293B]">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-xs font-medium text-mwasalatInk-500 hover:text-mwasalatInk-400 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-6 h-6 text-[#94A3B8] mx-auto mb-2" />
                <p className="text-xs text-[#94A3B8]">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => !n.isRead && handleMarkRead(n._id)}
                  className={`w-full text-left flex items-start gap-2.5 px-4 py-3 border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8F9FB] transition-colors ${
                    !n.isRead ? 'bg-mwasalatInk-100/40' : ''
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Megaphone className="w-3.5 h-3.5 text-mwasalatInk-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-[#1E293B] truncate">{n.title}</p>
                      {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-mwasalatRed-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-[#94A3B8] mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
