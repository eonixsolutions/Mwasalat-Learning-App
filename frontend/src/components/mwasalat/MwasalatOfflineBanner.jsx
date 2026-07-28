import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react';

export default function MwasalatOfflineBanner() {
  const { t } = useTranslation('mwasalatApp');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-mwasalatInk-500 text-white text-xs sm:text-sm font-medium py-2 px-4 flex items-center justify-center gap-2">
      <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
      {t('offlineBanner.message')}
    </div>
  );
}
