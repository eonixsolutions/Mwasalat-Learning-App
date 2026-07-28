import { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppRoutes from './routes/AppRoutes.jsx';
import MwasalatIdleLogoutGuard from './components/mwasalat/MwasalatIdleLogoutGuard.jsx';
import MwasalatInstallPrompt from './components/mwasalat/MwasalatInstallPrompt.jsx';
import MwasalatOfflineBanner from './components/mwasalat/MwasalatOfflineBanner.jsx';
import MwasalatAnalytics from './components/mwasalat/MwasalatAnalytics.jsx';
import './lib/mwasalatI18n.js';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Keeps <html dir>/<html lang> in sync with the active language for the
// whole app session — this is the single source of truth for RTL now that
// every Mwasalat page participates in translation, not just the landing page.
function LanguageDirSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const applyDir = (lng) => {
      document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lng;
    };
    applyDir(i18n.language);
    i18n.on('languageChanged', applyDir);
    return () => i18n.off('languageChanged', applyDir);
  }, [i18n]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageDirSync />
      <ScrollToTop />
      <MwasalatAnalytics />
      <MwasalatOfflineBanner />
      <MwasalatIdleLogoutGuard />
      <AppRoutes />
      <MwasalatInstallPrompt />
    </BrowserRouter>
  );
}
