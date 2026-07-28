import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, X } from 'lucide-react';

const DISMISSED_KEY = 'mwasalat_pwa_install_dismissed';

// Chrome/Edge/Android fire 'beforeinstallprompt' when the site meets install
// criteria (manifest + service worker + HTTPS) instead of showing their own
// UI automatically — capturing it here is what lets us show our own button
// and trigger the native prompt on demand. Safari/iOS never fire this event
// at all, so the banner simply never appears there (no PWA install API exists).
export default function MwasalatInstallPrompt() {
  const { t } = useTranslation('mwasalatApp');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone || localStorage.getItem(DISMISSED_KEY)) return undefined;

    const handleBeforeInstall = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setVisible(true);
    };
    const handleInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:end-4 sm:w-80 z-40 bg-white rounded-2xl border border-[#E2E8F0] shadow-lg p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0">
        <Download className="w-5 h-5 text-mwasalatInk-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1E293B]">{t('installPrompt.title')}</p>
        <p className="text-xs text-[#475569] mt-0.5">{t('installPrompt.body')}</p>
        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={handleInstall}
            className="inline-flex items-center gap-1.5 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors text-xs"
          >
            <Download className="w-3.5 h-3.5" /> {t('installPrompt.installCta')}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs font-medium text-[#94A3B8] hover:text-[#475569] transition-colors px-2"
          >
            {t('installPrompt.notNow')}
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="text-[#94A3B8] hover:text-[#1E293B] transition-colors flex-shrink-0"
        aria-label={t('installPrompt.notNow')}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
