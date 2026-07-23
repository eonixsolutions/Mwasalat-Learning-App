import { useTranslation } from 'react-i18next';

// Shared color/label mapping for both the enhanced "All Students" roster and
// the "Needs Attention" card — one place to change tone or wording for any
// risk tier. `returned` takes visual precedence over `level` (someone who
// just came back is riskLevel: 'on_track' again, but the distinct green
// "Returned" tag is what makes that visible for a few days).
const TONE_BY_KEY = {
  on_track: { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]' },
  at_risk: { bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' },
  inactive: { bg: 'bg-mwasalatRed-100', text: 'text-mwasalatRed-600' },
  churned: { bg: 'bg-mwasalatInk-100', text: 'text-mwasalatInk-400' },
  returned: { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]' },
};

export default function MwasalatRiskBadge({ level = 'on_track', returned = false }) {
  const { t } = useTranslation('mwasalatApp');
  const key = returned ? 'returned' : level;
  const tone = TONE_BY_KEY[key] ?? TONE_BY_KEY.on_track;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${tone.bg} ${tone.text}`}>
      {t(`riskBadge.${key}`)}
    </span>
  );
}
