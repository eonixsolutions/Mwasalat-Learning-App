import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, Loader2, Search, Trophy, Sparkles, X } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { ProgramCard, ProgramDetailModal } from '../../components/mwasalat/MwasalatProgramCard.jsx';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

export default function MwasalatAdminProgramsPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const [searchParams] = useSearchParams();
  const STATUS_FILTERS = [
    { value: 'all', label: t('userFilters.all') },
    { value: 'active', label: t('programCard.status.active') },
    { value: 'expired', label: t('programCard.status.expired') },
    { value: 'archived', label: t('programCard.status.archived') },
    { value: 'draft', label: t('programCard.status.draft') },
  ];
  // Reuses the same content-type labels the instructor's course-creation form
  // already uses (addCourse.contentTypes.*), so a program showing "Live" here
  // always matches what the instructor called it there.
  const CONTENT_TYPE_FILTERS = [
    { value: 'pdf', label: t('addCourse.contentTypes.pdf.label') },
    { value: 'recording', label: t('addCourse.contentTypes.recording.label') },
    { value: 'live', label: t('addCourse.contentTypes.live.label') },
    { value: 'ilt', label: t('addCourse.contentTypes.ilt.label') },
  ];
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState(null);
  // Multi-select — a program can have more than one content type (e.g. PDF +
  // Live), so "matches" means "has at least one of the selected types", not
  // an exact match. Pre-seeded from the dashboard's "Upcoming Classes → View
  // all" link (?view=classes), which wants Live + ILT selected on arrival.
  const [typeFilter, setTypeFilter] = useState(() => (
    searchParams.get('view') === 'classes' ? new Set(['live', 'ilt']) : new Set()
  ));

  const toggleType = (value) => {
    setTypeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value); else next.add(value);
      return next;
    });
  };

  useEffect(() => {
    mwasalatProgramService.listAllForAdmin().then(setPrograms).finally(() => setIsLoading(false));
  }, []);

  const topRated = useMemo(
    () => [...programs].filter((p) => p.feedbackCount > 0).sort((a, b) => b.avgRating - a.avgRating).slice(0, 5),
    [programs]
  );
  const newest = useMemo(
    () => [...programs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [programs]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return programs.filter((p) => {
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.titleAr?.toLowerCase().includes(q) || p.instructor?.name?.toLowerCase().includes(q);
      const matchesType = typeFilter.size === 0 || p.contentTypes?.some((ct) => typeFilter.has(ct));
      return matchesStatus && matchesQuery && matchesType;
    });
  }, [programs, statusFilter, query, typeFilter]);

  return (
    <MwasalatAdminLayout title={t('admin.nav.programs')} subtitle={t('programsPage.subtitle')}>
      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center text-[#94A3B8]">
            <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('programsPage.loading')}
          </div>
        ) : programs.length === 0 ? (
          <div className="card p-10 text-center">
            <BookOpen className="w-8 h-8 text-mwasalatInk-400 mx-auto mb-3" />
            <p className="text-sm text-[#475569]">{t('programsPage.noPrograms')}</p>
          </div>
        ) : (
          <>
            {topRated.length > 0 && (
              <div className="mb-8">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1E293B] mb-3">
                  <Trophy className="w-4 h-4 text-[#F59E0B]" /> {t('programsPage.topRated')}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {topRated.map((program, i) => (
                    <ProgramCard key={program._id} program={program} badge={`★ ${localizeNumber(program.avgRating, i18n.language)}`} delay={i * 40} onClick={() => setSelectedProgram(program)} />
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1E293B] mb-3">
                <Sparkles className="w-4 h-4 text-mwasalatInk-500" /> {t('programsPage.newSection')}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {newest.map((program, i) => (
                  <ProgramCard key={program._id} program={program} badge={t('programsPage.newBadge')} delay={i * 40} onClick={() => setSelectedProgram(program)} />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {STATUS_FILTERS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      statusFilter === value ? 'bg-mwasalatInk-500 text-white' : 'bg-[#F1F5F9] text-[#475569] hover:bg-mwasalatInk-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-[#94A3B8] absolute start-3.5 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('programsPage.searchPlaceholder')}
                  className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap mb-5">
              <span className="text-[11px] font-medium text-[#94A3B8] me-1">{t('programsPage.typeFilterLabel')}</span>
              {CONTENT_TYPE_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => toggleType(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    typeFilter.has(value) ? 'bg-mwasalatRed-500 text-white' : 'bg-[#F1F5F9] text-[#475569] hover:bg-mwasalatRed-100'
                  }`}
                >
                  {label}
                </button>
              ))}
              {typeFilter.size > 0 && (
                <button
                  onClick={() => setTypeFilter(new Set())}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-mwasalatRed-600 hover:bg-mwasalatRed-100 transition-colors"
                >
                  <X className="w-3 h-3" /> {t('programsPage.clearFilter')}
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="card p-10 text-center">
                <p className="text-sm text-[#475569]">{t('programsPage.noMatch')}</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filtered.map((program, i) => (
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
