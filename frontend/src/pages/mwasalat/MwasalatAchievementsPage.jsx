import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Trophy, Award, BookOpen, Target, CheckCircle2, XCircle, Sparkles, Flame, ChevronRight } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import MwasalatLearnerLayout from '../../layouts/MwasalatLearnerLayout.jsx';
import MwasalatCertificateMiniCard from '../../components/mwasalat/MwasalatCertificateMiniCard.jsx';
import { themeForCategory } from '../../utils/mwasalatCategoryTheme.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

function StatTile({ icon: Icon, label, value, tone, delay }) {
  return (
    <div className="card p-4 flex items-center gap-3 mwasalat-enter" style={{ animationDelay: `${delay}ms` }}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tone.bg} ${tone.text}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-[#1E293B] leading-tight">{value}</p>
        <p className="text-xs text-[#94A3B8] truncate">{label}</p>
      </div>
    </div>
  );
}

export default function MwasalatAchievementsPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const [data, setData] = useState(null);
  const [bestStreak, setBestStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const locale = i18n.language === 'ar' ? 'ar-OM' : 'en-GB';

  useEffect(() => {
    mwasalatProgramService.getMyAchievements().then(async (result) => {
      setData(result);
      // Best streak isn't part of the achievements payload — it's per-course
      // on the enrollment (see MwasalatLearnerDashboard), so pull it the same way.
      const streaks = await Promise.all(
        (result.enrollments ?? []).map((e) => mwasalatProgramService.getCompletionStatus(e.program?._id).then((c) => c?.streak?.longest ?? 0).catch(() => 0))
      );
      setBestStreak(Math.max(0, ...streaks));
    }).finally(() => setIsLoading(false));
  }, []);

  return (
    <MwasalatLearnerLayout title={t('learner.achievements.title')} subtitle={t('learner.achievements.subtitle')}>
      {isLoading ? (
        <div className="p-10 flex items-center justify-center text-[#94A3B8]">
          <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('learner.achievements.loading')}
        </div>
      ) : (
        <>
          {/* Hero */}
          <div
            className="relative overflow-hidden rounded-2xl p-6 sm:p-7 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-6 sm:gap-0"
            style={{ background: 'linear-gradient(120deg, #9C1B29 0%, #C22033 55%, #E8929C 100%)' }}
          >
            <div className="absolute -end-8 -top-10 w-44 h-44 rounded-full bg-white/10" />
            <div className="absolute end-20 -bottom-14 w-36 h-36 rounded-full bg-white/10" />
            <div className="relative flex items-center gap-4 flex-1">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 stat-pop">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">{t('learner.achievements.totalPoints')}</p>
                <p className="text-3xl sm:text-4xl font-bold text-white stat-pop stat-pop-delay">{localizeNumber(data.points, i18n.language)}</p>
              </div>
            </div>
            <div className="relative hidden sm:block w-px self-stretch bg-white/20 mx-2" />
            <div className="relative flex items-center gap-4 flex-1 sm:justify-end pt-5 sm:pt-0 border-t sm:border-0 border-white/20">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Flame className="w-7 h-7 text-white flame-flicker" fill="currentColor" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">{t('learner.achievements.bestStreakLabel')}</p>
                <p className="text-3xl sm:text-4xl font-bold text-white">
                  {localizeNumber(t('learner.achievements.bestStreakValue', { count: bestStreak }), i18n.language)}
                </p>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatTile icon={BookOpen} label={t('learner.achievements.statsCourses')} value={localizeNumber(data.totalCourses, i18n.language)} tone={{ bg: 'bg-mwasalatInk-100', text: 'text-mwasalatInk-500' }} delay={0} />
            <StatTile icon={Award} label={t('learner.achievements.statsCertificates')} value={localizeNumber(data.totalCertificates, i18n.language)} tone={{ bg: 'bg-[#DCFCE7]', text: 'text-[#22C55E]' }} delay={60} />
            <StatTile icon={Target} label={t('learner.achievements.statsQuizAttempts')} value={localizeNumber(data.totalAttempts, i18n.language)} tone={{ bg: 'bg-[#FEF3C7]', text: 'text-[#F59E0B]' }} delay={120} />
            <StatTile icon={Sparkles} label={t('learner.achievements.statsPoints')} value={localizeNumber(data.points, i18n.language)} tone={{ bg: 'bg-mwasalatRed-100', text: 'text-mwasalatRed-600' }} delay={180} />
          </div>

          {/* Certificates */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#1E293B]">{t('learner.achievements.certificatesHeading')}</h2>
          </div>
          {data.certificates.length === 0 ? (
            <p className="text-sm text-[#94A3B8] mb-8">{t('learner.achievements.noCertificates')}</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {data.certificates.map((c) => (
                <MwasalatCertificateMiniCard key={c._id} certificate={c} theme={themeForCategory(c.program?.category)} />
              ))}
            </div>
          )}

          {/* Quiz attempt history */}
          <h2 className="text-sm font-semibold text-[#1E293B] mb-3">{t('learner.achievements.assessmentHistoryHeading')}</h2>
          {data.attempts.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">{t('learner.achievements.noAssessments')}</p>
          ) : (
            <div className="card overflow-hidden">
              <div className="divide-y divide-[#F1F5F9]">
                {data.attempts.map((a, i) => (
                  <Link
                    key={a._id}
                    to={`/mwasalat/learner/programs/${a.program?._id}/quiz`}
                    className="flex items-center gap-4 px-5 py-4 mwasalat-enter hover:bg-[#F8F9FB] transition-colors"
                    style={{ animationDelay: `${i * 40}ms`, borderInlineStart: `3px solid ${a.passed ? '#22C55E' : '#C22033'}` }}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${a.passed ? 'bg-[#DCFCE7]' : 'bg-mwasalatRed-100'}`}>
                      {a.passed ? <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> : <XCircle className="w-4 h-4 text-mwasalatRed-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1E293B] truncate">{getLocalizedProgramField(a.program, 'title', i18n.language)}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        {localizeNumber(t('learner.achievements.attemptLabel', { number: a.attemptNumber }), i18n.language)} · {localizeNumber(new Date(a.attemptedAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }), i18n.language)} · {t('learner.achievements.quizLabel')}
                      </p>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <p className={`text-sm font-bold ${a.passed ? 'text-[#22C55E]' : 'text-mwasalatRed-500'}`}>{localizeNumber(a.score, i18n.language)}%</p>
                      <p className="text-[11px] text-[#94A3B8]">{a.passed ? t('learner.achievements.passed') : t('learner.achievements.failed')}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#CBD5E1] rtl:rotate-180 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </MwasalatLearnerLayout>
  );
}
