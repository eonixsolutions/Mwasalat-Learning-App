import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MWASALAT_LANG_STORAGE_KEY } from '../../lib/mwasalatI18n.js';

// `theme="dark"` (default) is for the ink-gradient headers (Instructor/Learner);
// `theme="light"` is for a light header (Admin) where white-on-dark styling
// would be invisible.
const THEME_CLASSES = {
  dark: 'border-white/25 hover:border-white/50 text-white',
  light: 'border-[#E2E8F0] hover:border-mwasalatInk-300 text-[#475569] hover:text-mwasalatInk-500',
};

export default function MwasalatLanguageToggle({ className = '', theme = 'dark' }) {
  const { i18n } = useTranslation('mwasalatLanding');
  const isArabic = i18n.language === 'ar';

  const toggle = () => {
    const next = isArabic ? 'en' : 'ar';
    i18n.changeLanguage(next);
    localStorage.setItem(MWASALAT_LANG_STORAGE_KEY, next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${THEME_CLASSES[theme]} ${className}`}
    >
      <Languages className="w-3.5 h-3.5" />
      {isArabic ? 'EN' : 'عربي'}
    </button>
  );
}
