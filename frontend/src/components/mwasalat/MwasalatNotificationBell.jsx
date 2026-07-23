import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck, Megaphone } from 'lucide-react';
import { mwasalatNotificationService } from '../../services/mwasalatNotification.service.js';
import { useMwasalatNotificationStore } from '../../store/mwasalatNotificationStore.js';
import useMwasalatSocket from '../../hooks/useMwasalatSocket.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

// See MwasalatLanguageToggle for the same dark/light header split.
const TRIGGER_THEME_CLASSES = {
  dark: 'text-white/80 hover:bg-white/10 hover:text-white',
  light: 'text-[#475569] hover:bg-[#F1F5F9] hover:text-mwasalatInk-500',
};

export default function MwasalatNotificationBell({ theme = 'dark' }) {
  const { t, i18n } = useTranslation('mwasalatApp');
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

  const timeAgo = (dateStr) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return t('common.justNow');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return localizeNumber(t('common.minutesAgo', { count: minutes }), i18n.language);
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return localizeNumber(t('common.hoursAgo', { count: hours }), i18n.language);
    const days = Math.floor(hours / 24);
    return localizeNumber(t('common.daysAgo', { count: days }), i18n.language);
  };

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
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('common.notifications')}
        aria-expanded={open}
        className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${TRIGGER_THEME_CLASSES[theme]}`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 end-1 w-2 h-2 rounded-full bg-mwasalatRed-500" />
        )}
      </button>

      {open && (
        <div
          className="absolute end-0 top-full mt-2 w-80 max-w-[90vw] bg-white rounded-2xl border border-[#E2E8F0] z-50 overflow-hidden"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
            <p className="text-sm font-semibold text-[#1E293B]">{t('common.notifications')}</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-xs font-medium text-mwasalatInk-500 hover:text-mwasalatInk-400 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" /> {t('common.markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-6 h-6 text-[#94A3B8] mx-auto mb-2" />
                <p className="text-xs text-[#94A3B8]">{t('common.noNotificationsYet')}</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => !n.isRead && handleMarkRead(n._id)}
                  className={`w-full text-start flex items-start gap-2.5 px-4 py-3 border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8F9FB] transition-colors ${
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
