import { useTranslation } from 'react-i18next';

const DAY_MS = 24 * 60 * 60 * 1000;

// UTC day-keys, matching the exact convention the backend uses for
// recentActiveDates (new Date().toISOString().slice(0,10)) — same "what day
// is it" definition on both sides, so a cell lights up for the right day.
function lastNDayKeys(n) {
  const keys = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    keys.push(new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10));
  }
  return keys;
}

// GitHub-contribution-style strip — filled cells for days present in
// recentActiveDates, hollow for gaps. recentActiveDates can't be reconstructed
// from currentStreak alone (that resets to 1 on a break), so this needs its
// own capped-array field from the backend.
export default function MwasalatStreakStrip({ recentActiveDates = [], days = 14 }) {
  const { t } = useTranslation('mwasalatApp');
  const activeDays = new Set(recentActiveDates);
  const dayKeys = lastNDayKeys(days);

  return (
    <div className="flex items-center gap-1" aria-label={t('streak.stripLabel')}>
      {dayKeys.map((key) => (
        <span
          key={key}
          title={key}
          className={`w-2.5 h-2.5 rounded-[3px] ${activeDays.has(key) ? 'bg-[#F59E0B]' : 'bg-mwasalatInk-100'}`}
        />
      ))}
    </div>
  );
}
