import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { mwasalatAuthService } from '../../services/mwasalatAuth.service.js';
import { MWASALAT_ROLE_LOGIN } from '../../constants/mwasalatRoles.js';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity
const CHECK_INTERVAL_MS = 30 * 1000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

// Logs an authenticated user out after a period with no mouse/keyboard/touch
// activity — the JWT itself only expires after ~12h, which is far too long
// to leave an unattended session open on a shared device.
export default function MwasalatIdleLogoutGuard() {
  const { t } = useTranslation('mwasalatApp');
  const navigate = useNavigate();
  const { isAuthenticated, user } = useMwasalatAuthStore();
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const markActive = () => { lastActivityRef.current = Date.now(); };
    lastActivityRef.current = Date.now();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, markActive, { passive: true }));

    const intervalId = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
        mwasalatAuthService.logout();
        toast(t('common.idleLogoutMessage'));
        navigate(MWASALAT_ROLE_LOGIN[user?.role] || '/login', { replace: true });
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, markActive));
      clearInterval(intervalId);
    };
  }, [isAuthenticated, user?.role, navigate, t]);

  return null;
}
