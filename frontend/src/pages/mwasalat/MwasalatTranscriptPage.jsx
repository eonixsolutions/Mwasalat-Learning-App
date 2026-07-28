import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, Printer, BookOpen, Award, Target, Sparkles } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

function StatTile({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] p-4">
      <div className="w-10 h-10 rounded-xl bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-mwasalatInk-500" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-[#1E293B] leading-tight">{value}</p>
        <p className="text-xs text-[#94A3B8] truncate">{label}</p>
      </div>
    </div>
  );
}

function SectionTable({ title, empty, columns, rows }) {
  return (
    <div className="mb-8 break-inside-avoid">
      <h2 className="text-sm font-semibold text-[#1E293B] mb-3">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-[#94A3B8]">{empty}</p>
      ) : (
        <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8F9FB] border-b border-[#E2E8F0]">
                {columns.map((col) => (
                  <th key={col} className="text-start font-semibold text-[#475569] px-4 py-2.5">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {rows}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function MwasalatTranscriptPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const navigate = useNavigate();
  const locale = i18n.language === 'ar' ? 'ar-OM' : 'en-GB';
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    mwasalatProgramService.getMyAchievements().then(setData).finally(() => setIsLoading(false));
  }, []);

  const dateFmt = (value) => (value ? localizeNumber(new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }), i18n.language) : '—');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8]">
        <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('learner.transcript.loading')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .transcript-page { padding: 0 !important; }
          .transcript-card { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="no-print h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 sm:px-8">
        <button
          onClick={() => navigate('/learner/achievements')}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#475569] hover:text-mwasalatInk-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t('learner.transcript.back')}
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
        >
          <Printer className="w-4 h-4" /> {t('learner.transcript.printSavePdf')}
        </button>
      </div>

      <div className="transcript-page p-4 sm:p-10 flex justify-center">
        <div className="transcript-card bg-white w-full max-w-3xl rounded-2xl shadow-xl p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#E2E8F0]">
            <Link to="/">
              <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-9 w-auto object-contain" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-[#1E293B]">{t('learner.transcript.title')}</h1>
              <p className="text-xs text-[#94A3B8]">{t('learner.transcript.generatedOn', { date: dateFmt(new Date()) })}</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-sm text-[#475569]">{t('learner.transcript.learnerNameLabel')}</p>
            <p className="text-lg font-bold text-[#1E293B]">{data.learner?.name}</p>
            <p className="text-xs text-[#94A3B8]" dir="ltr">{data.learner?.email}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatTile icon={BookOpen} label={t('learner.achievements.statsCourses')} value={localizeNumber(data.totalCourses, i18n.language)} />
            <StatTile icon={Award} label={t('learner.achievements.statsCertificates')} value={localizeNumber(data.totalCertificates, i18n.language)} />
            <StatTile icon={Target} label={t('learner.achievements.statsQuizAttempts')} value={localizeNumber(data.totalAttempts, i18n.language)} />
            <StatTile icon={Sparkles} label={t('learner.achievements.statsPoints')} value={localizeNumber(data.points, i18n.language)} />
          </div>

          <SectionTable
            title={t('learner.transcript.enrollmentsHeading')}
            empty={t('learner.transcript.noEnrollments')}
            columns={[t('learner.transcript.columns.course'), t('learner.transcript.columns.status'), t('learner.transcript.columns.purchased'), t('learner.transcript.columns.completed')]}
            rows={data.enrollments.map((e) => (
              <tr key={e._id}>
                <td className="px-4 py-2.5 text-[#1E293B] font-medium">{getLocalizedProgramField(e.program, 'title', i18n.language)}</td>
                <td className="px-4 py-2.5 text-[#475569]">{t(`enrollmentStatus.${e.status}`, { defaultValue: e.status })}</td>
                <td className="px-4 py-2.5 text-[#475569]">{dateFmt(e.purchasedAt)}</td>
                <td className="px-4 py-2.5 text-[#475569]">{dateFmt(e.completedAt)}</td>
              </tr>
            ))}
          />

          <SectionTable
            title={t('learner.transcript.assessmentsHeading')}
            empty={t('learner.transcript.noAssessments')}
            columns={[t('learner.transcript.columns.course'), t('learner.transcript.columns.attempt'), t('learner.transcript.columns.score'), t('learner.transcript.columns.result'), t('learner.transcript.columns.date')]}
            rows={data.attempts.map((a) => (
              <tr key={a._id}>
                <td className="px-4 py-2.5 text-[#1E293B] font-medium">{getLocalizedProgramField(a.program, 'title', i18n.language)}</td>
                <td className="px-4 py-2.5 text-[#475569]">{localizeNumber(t('learner.achievements.attemptLabel', { number: a.attemptNumber }), i18n.language)}</td>
                <td className="px-4 py-2.5 text-[#475569]">{localizeNumber(a.score, i18n.language)}%</td>
                <td className={`px-4 py-2.5 font-medium ${a.passed ? 'text-[#22C55E]' : 'text-mwasalatRed-500'}`}>{a.passed ? t('learner.achievements.passed') : t('learner.achievements.failed')}</td>
                <td className="px-4 py-2.5 text-[#475569]">{dateFmt(a.attemptedAt)}</td>
              </tr>
            ))}
          />

          <SectionTable
            title={t('learner.transcript.certificatesHeading')}
            empty={t('learner.transcript.noCertificates')}
            columns={[t('learner.transcript.columns.course'), t('learner.transcript.columns.certificateNo'), t('learner.transcript.columns.issued'), t('learner.transcript.columns.expires')]}
            rows={data.certificates.map((c) => (
              <tr key={c._id}>
                <td className="px-4 py-2.5 text-[#1E293B] font-medium">{getLocalizedProgramField(c.program, 'title', i18n.language)}</td>
                <td className="px-4 py-2.5 text-[#475569]" dir="ltr">{c.certificateNumber}</td>
                <td className="px-4 py-2.5 text-[#475569]">{dateFmt(c.issuedAt)}</td>
                <td className={`px-4 py-2.5 ${c.isExpired ? 'text-mwasalatRed-500 font-medium' : 'text-[#475569]'}`}>{c.expiresAt ? dateFmt(c.expiresAt) : t('learner.transcript.noExpiry')}</td>
              </tr>
            ))}
          />

          <p className="text-[11px] text-[#94A3B8] text-center pt-4 border-t border-[#E2E8F0]">
            {t('learner.transcript.footerNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
