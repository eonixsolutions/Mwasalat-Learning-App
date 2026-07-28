import { useTranslation } from 'react-i18next';

const TONE_BY_STATUS = {
  pending_approval: { bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' },
  waitlisted: { bg: 'bg-mwasalatInk-100', text: 'text-mwasalatInk-400' },
  rejected: { bg: 'bg-mwasalatRed-100', text: 'text-mwasalatRed-600' },
  enrolled: { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]' },
  in_progress: { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]' },
  completed: { bg: 'bg-mwasalatInk-100', text: 'text-mwasalatInk-500' },
  locked: { bg: 'bg-mwasalatRed-100', text: 'text-mwasalatRed-600' },
};

export default function MwasalatEnrollmentStatusBadge({ status }) {
  const { t } = useTranslation('mwasalatApp');
  const tone = TONE_BY_STATUS[status] ?? TONE_BY_STATUS.enrolled;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${tone.bg} ${tone.text}`}>
      {t(`enrollmentStatus.${status}`, status)}
    </span>
  );
}
