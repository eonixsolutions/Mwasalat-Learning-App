import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, BookOpen, Users, Star, Award, Mail, Calendar } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { ProgramCard, ProgramDetailModal } from '../../components/mwasalat/MwasalatProgramCard.jsx';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

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

export default function MwasalatAdminInstructorDetailPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProgram, setSelectedProgram] = useState(null);

  useEffect(() => {
    mwasalatProgramService.getInstructorDetail(id)
      .then(setData)
      .catch((err) => setError(err.response?.data?.message || t('instructorDetail.loadFailed')))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <MwasalatAdminLayout
      title={t('instructorDetail.defaultTitle')}
      subtitle={data?.instructor?.name ?? t('instructorDetail.defaultSubtitle')}
    >
      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center text-[#94A3B8]">
            <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('instructorDetail.loading')}
          </div>
        ) : error ? (
          <div className="card p-10 text-center text-sm text-[#475569]">{error}</div>
        ) : (
          <>
            {/* Hero */}
            <div
              className="relative overflow-hidden rounded-2xl p-6 sm:p-7 mb-6"
              style={{ background: 'linear-gradient(120deg, #23181A 0%, #4A3336 55%, #8C6B6E 100%)' }}
            >
              <div className="absolute -end-8 -top-10 w-44 h-44 rounded-full bg-white/10" />
              <div className="absolute end-20 -bottom-14 w-36 h-36 rounded-full bg-white/10" />
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-white text-xl font-bold">
                  {data.instructor?.name?.[0]?.toUpperCase() ?? 'I'}
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-xl font-bold text-white truncate">{data.instructor?.name}</p>
                  <p className="text-white/80 text-sm inline-flex items-center gap-1.5 flex-wrap">
                    <Mail className="w-3.5 h-3.5" /> <span dir="ltr">{data.instructor?.email}</span>
                    <span className="mx-1">·</span>
                    <Calendar className="w-3.5 h-3.5" />
                    {localizeNumber(t('instructorDetail.joined', { date: new Date(data.instructor?.createdAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }) }), i18n.language)}
                    <span className="mx-1">·</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${data.instructor?.isActive ? 'bg-white/20 text-white' : 'bg-mwasalatRed-500/30 text-white'}`}>
                      {data.instructor?.isActive ? t('userTable.active') : t('userTable.blocked')}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <StatTile icon={BookOpen} label={t('instructorDetail.stats.programs')} value={localizeNumber(data.totalPrograms, i18n.language)} tone={{ bg: 'bg-mwasalatInk-100', text: 'text-mwasalatInk-500' }} delay={0} />
              <StatTile icon={Users} label={t('instructorDetail.stats.learnersTaught')} value={localizeNumber(data.totalLearners, i18n.language)} tone={{ bg: 'bg-[#DCFCE7]', text: 'text-[#22C55E]' }} delay={60} />
              <StatTile icon={Star} label={t('instructorDetail.stats.avgRating')} value={data.avgRating != null ? localizeNumber(data.avgRating, i18n.language) : '—'} tone={{ bg: 'bg-[#FEF3C7]', text: 'text-[#F59E0B]' }} delay={120} />
              <StatTile icon={Award} label={t('instructorDetail.stats.certificatesIssued')} value={localizeNumber(data.certificatesIssued, i18n.language)} tone={{ bg: 'bg-mwasalatRed-100', text: 'text-mwasalatRed-600' }} delay={180} />
            </div>

            {/* Programs */}
            <h2 className="text-sm font-semibold text-[#1E293B] mb-3">{t('admin.nav.programs')}</h2>
            {data.programs.length === 0 ? (
              <div className="card p-10 text-center">
                <BookOpen className="w-8 h-8 text-mwasalatInk-400 mx-auto mb-3" />
                <p className="text-sm text-[#475569]">{t('instructorDetail.noPrograms')}</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.programs.map((program, i) => (
                  <ProgramCard key={program._id} program={program} delay={i * 40} onClick={() => setSelectedProgram(program)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selectedProgram && <ProgramDetailModal program={selectedProgram} onClose={() => setSelectedProgram(null)} />}
    </MwasalatAdminLayout>
  );
}
