import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Award } from 'lucide-react';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

// Small certificate tile used on both the Completed and Achievements pages —
// there's no real certificate image asset, so the thumbnail is a themed
// gradient block rather than a fabricated preview.
export default function MwasalatCertificateMiniCard({ certificate, theme }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const locale = i18n.language === 'ar' ? 'ar-OM' : 'en-GB';
  const title = getLocalizedProgramField(certificate.program, 'title', i18n.language);

  return (
    <Link
      to={`/learner/programs/${certificate.program?._id}/certificate`}
      className="card card-hover p-3.5 flex items-center gap-3"
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${theme.solid}, ${theme.solid}cc)` }}
      >
        <Award className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[#1E293B] truncate">{title}</p>
        <p className="text-[11px] text-[#94A3B8] mt-0.5">
          {localizeNumber(t('learner.achievements.issuedOn', { date: new Date(certificate.issuedAt).toLocaleDateString(locale) }), i18n.language)}
        </p>
      </div>
    </Link>
  );
}
