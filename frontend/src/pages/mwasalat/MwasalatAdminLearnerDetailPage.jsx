import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Trophy, Award, BookOpen, Target, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

function StatTile({ icon: Icon, label, value, tone, delay }) {
  return (
    <div className="card p-3 flex items-center gap-2.5 mwasalat-enter" style={{ animationDelay: `${delay}ms` }}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tone.bg} ${tone.text}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-base font-bold text-[#1E293B] leading-tight">{value}</p>
        <p className="text-xs text-[#94A3B8] truncate">{label}</p>
      </div>
    </div>
  );
}

export default function MwasalatAdminLearnerDetailPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    mwasalatProgramService.getLearnerAchievements(id)
      .then(setData)
      .catch((err) => setError(err.response?.data?.message || t('learnerDetail.loadFailed')))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <MwasalatAdminLayout
      title={data?.learner?.name ?? t('learnerDetail.defaultTitle')}
      subtitle={data?.learner?.email ?? t('learnerDetail.defaultSubtitle')}
    >
      <div className="max-w-5xl mx-auto">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center text-[#94A3B8]">
            <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('learnerDetail.loading')}
          </div>
        ) : error ? (
          <div className="card p-10 text-center text-sm text-[#475569]">{error}</div>
        ) : (
          <>
            {/* Hero */}
            <div
              className="relative overflow-hidden rounded-2xl p-6 sm:p-7 mb-6"
              style={{ background: 'linear-gradient(120deg, #9C1B29 0%, #C22033 55%, #E8929C 100%)' }}
            >
              <div className="absolute -end-8 -top-10 w-44 h-44 rounded-full bg-white/10" />
              <div className="absolute end-20 -bottom-14 w-36 h-36 rounded-full bg-white/10" />
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 stat-pop">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium">{t('learnerDetail.totalPointsLabel', { name: data.learner?.name })}</p>
                  <p className="text-3xl sm:text-4xl font-bold text-white stat-pop stat-pop-delay" dir="ltr">{localizeNumber(data.points, i18n.language)}</p>
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatTile icon={BookOpen} label={t('learnerDetail.stats.courses')} value={localizeNumber(data.totalCourses, i18n.language)} tone={{ bg: 'bg-mwasalatInk-100', text: 'text-mwasalatInk-500' }} delay={0} />
              <StatTile icon={Award} label={t('learnerDetail.stats.certificates')} value={localizeNumber(data.totalCertificates, i18n.language)} tone={{ bg: 'bg-[#DCFCE7]', text: 'text-[#22C55E]' }} delay={60} />
              <StatTile icon={Target} label={t('learnerDetail.stats.quizAttempts')} value={localizeNumber(data.totalAttempts, i18n.language)} tone={{ bg: 'bg-[#FEF3C7]', text: 'text-[#F59E0B]' }} delay={120} />
              <StatTile icon={Sparkles} label={t('learnerDetail.stats.points')} value={localizeNumber(data.points, i18n.language)} tone={{ bg: 'bg-mwasalatRed-100', text: 'text-mwasalatRed-600' }} delay={180} />
            </div>

            {/* Certificates */}
            <h2 className="text-sm font-semibold text-[#1E293B] mb-3">{t('learnerDetail.certificatesHeading')}</h2>
            {data.certificates.length === 0 ? (
              <p className="text-sm text-[#94A3B8] mb-8">{t('learnerDetail.noCertificates')}</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {data.certificates.map((c, i) => (
                  <div
                    key={c._id}
                    className="card p-4 flex items-start gap-3 mwasalat-enter"
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0">
                      <Award className="w-4 h-4 text-mwasalatInk-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1E293B] truncate">{getLocalizedProgramField(c.program, 'title', i18n.language)}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        {localizeNumber(t('learnerDetail.issuedOn', { date: new Date(c.issuedAt).toLocaleDateString(dateLocale) }), i18n.language)}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] mt-1" dir="ltr">{c.certificateNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quiz attempt history */}
            <h2 className="text-sm font-semibold text-[#1E293B] mb-3">{t('learnerDetail.assessmentHistoryHeading')}</h2>
            {data.attempts.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">{t('learnerDetail.noAssessments')}</p>
            ) : (
              <div className="card overflow-hidden">
                <div className="divide-y divide-[#F1F5F9]">
                  {data.attempts.map((a, i) => (
                    <div
                      key={a._id}
                      className="flex items-center gap-4 px-5 py-4 mwasalat-enter"
                      style={{ animationDelay: `${i * 40}ms`, borderInlineStart: `3px solid ${a.passed ? '#22C55E' : '#C22033'}` }}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${a.passed ? 'bg-[#DCFCE7]' : 'bg-mwasalatRed-100'}`}>
                        {a.passed ? <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> : <XCircle className="w-4 h-4 text-mwasalatRed-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1E293B] truncate">{getLocalizedProgramField(a.program, 'title', i18n.language)}</p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">
                          {localizeNumber(t('learnerDetail.attemptLabel', { number: a.attemptNumber }), i18n.language)} · {localizeNumber(new Date(a.attemptedAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }), i18n.language)}
                        </p>
                      </div>
                      <div className="text-end flex-shrink-0">
                        <p className={`text-sm font-bold ${a.passed ? 'text-[#22C55E]' : 'text-mwasalatRed-500'}`}>{localizeNumber(a.score, i18n.language)}%</p>
                        <p className="text-[11px] text-[#94A3B8]">{a.passed ? t('learnerDetail.passed') : t('learnerDetail.failed')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MwasalatAdminLayout>
  );
}
