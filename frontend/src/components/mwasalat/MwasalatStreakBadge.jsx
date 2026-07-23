import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

// Compact flame + day count. Filled amber when there's an active streak;
// grey outline at 0 so a fresh enrollment never reads as a "broken" streak.
export default function MwasalatStreakBadge({ current = 0, size = 'sm' }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const isActive = current > 0;
  const isLarge = size === 'lg';

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${isLarge ? 'px-3 py-1.5' : 'px-2 py-1'} rounded-full ${isActive ? 'bg-[#FEF3C7]' : 'bg-mwasalatInk-100'}`}
    >
      <Flame
        className={`${isLarge ? 'w-4 h-4' : 'w-3.5 h-3.5'} ${isActive ? 'text-[#F59E0B] flame-flicker' : 'text-mwasalatInk-300'}`}
        fill={isActive ? 'currentColor' : 'none'}
        strokeWidth={isActive ? 0 : 2}
      />
      <span className={`${isLarge ? 'text-sm' : 'text-xs'} font-semibold ${isActive ? 'text-[#B45309]' : 'text-mwasalatInk-300'}`}>
        {t('streak.dayCount', { count: localizeNumber(current, i18n.language) })}
      </span>
    </div>
  );
}
