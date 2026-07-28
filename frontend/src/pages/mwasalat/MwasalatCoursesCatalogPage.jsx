import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { BookOpen, Folder, ChevronRight, CreditCard, Loader2, Search, Clock, Calendar, Users, LayoutGrid, List, HelpCircle, Lock } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { mwasalatPaymentService } from '../../services/mwasalatPayment.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import MwasalatLearnerLayout from '../../layouts/MwasalatLearnerLayout.jsx';
import { themeForCategory } from '../../utils/mwasalatCategoryTheme.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

// Seats only exist on live/ILT courses (see backend listPublic) — undefined
// for self-paced pdf/recording content, so the badge just doesn't render there.
const LOW_SEATS_THRESHOLD = 5;

// There's no category/sub-category level description field on the backend —
// only individual programs carry one — so folder cards borrow the first
// real, non-empty program description found in the group as a stand-in
// rather than inventing category blurbs.
function representativeDescription(programsInGroup, lang) {
  const withDescription = programsInGroup.find((p) => getLocalizedProgramField(p, 'description', lang));
  return withDescription ? getLocalizedProgramField(withDescription, 'description', lang) : null;
}

// Compact "Sep 10, 5:00 PM" formatting for the live/ILT scheduled date badge —
// shown on the catalog cards so a learner can see *when* a session runs
// before opening the course, not just its type/duration.
function formatScheduledAt(program, lang) {
  const raw = program.liveScheduledAt || program.iltScheduledAt;
  if (!raw) return null;
  const locale = lang === 'ar' ? 'ar-OM' : 'en-GB';
  const formatted = new Date(raw).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return localizeNumber(formatted, lang);
}

function ViewToggle({ mode, onChange, t }) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-[#E2E8F0] bg-white flex-shrink-0">
      {[
        { key: 'grid', icon: LayoutGrid, label: t('learner.courses.gridView') },
        { key: 'list', icon: List, label: t('learner.courses.listView') },
      ].map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-pressed={mode === key}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            mode === key ? 'bg-mwasalatRed-600 text-white' : 'text-mwasalatRed-600 hover:bg-mwasalatRed-100'
          }`}
        >
          <Icon className="w-3.5 h-3.5" /> {label}
        </button>
      ))}
    </div>
  );
}

// Shared "folder" tile for the category (L1) and sub-category (L2) drill-down
// screens — `description` is optional (falls back to just the count when no
// program in the group has one).
function FolderCard({ theme, title, description, countLabel, onClick }) {
  return (
    <button type="button" onClick={onClick} className="card card-hover p-4 flex flex-col text-start">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${theme.bg} ${theme.text}`}>
        <Folder className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-bold text-[#1E293B] leading-snug mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-[#475569] leading-relaxed mb-3 line-clamp-2">{description}</p>
      )}
      <div className="mt-auto pt-2.5 border-t border-[#F1F5F9] flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#475569]">
          <BookOpen className={`w-3.5 h-3.5 ${theme.text}`} /> {countLabel}
        </span>
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${theme.solid}14`, color: theme.solid }}
        >
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </span>
      </div>
    </button>
  );
}

function FolderListRow({ theme, title, description, countLabel, onClick }) {
  return (
    <button type="button" onClick={onClick} className="card card-hover w-full flex items-center gap-3.5 p-4 text-start">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${theme.bg} ${theme.text}`}>
        <Folder className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-[#1E293B] truncate">{title}</h3>
        <p className="text-xs text-[#94A3B8] truncate mt-0.5">
          {countLabel}{description ? ` · ${description}` : ''}
        </p>
      </div>
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${theme.solid}14`, color: theme.solid }}
      >
        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
      </span>
    </button>
  );
}

function CourseListRow({ program, onEnroll, onPurchase, busy, t, i18n, isExternalLearner }) {
  const theme = themeForCategory(program.category);
  const title = getLocalizedProgramField(program, 'title', i18n.language);
  const description = getLocalizedProgramField(program, 'description', i18n.language);
  const duration = getLocalizedProgramField(program, 'duration', i18n.language);
  const hasSeatLimit = program.seatsRemaining !== undefined;
  const isFull = hasSeatLimit && program.seatsRemaining <= 0;
  // Internal learners are free regardless of a course's listed price — only
  // the paying external-learner audience ever sees a real price/checkout.
  const requiresPayment = isExternalLearner && program.price > 0;
  // A full free course still lets learners join the waitlist; a full paid
  // course can't sell a seat that doesn't exist, so checkout stays blocked.
  const isBlocked = isFull && requiresPayment;
  const isLocked = program.prerequisiteLocked;
  const prerequisiteTitle = getLocalizedProgramField(program.prerequisiteProgram, 'title', i18n.language);
  const scheduledAt = formatScheduledAt(program, i18n.language);

  return (
    <div className="card flex flex-col sm:flex-row sm:items-center gap-3.5 p-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${theme.bg} ${theme.text}`}>
        <BookOpen className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-[#1E293B] truncate">{title}</h3>
        {description && <p className="text-xs text-[#94A3B8] line-clamp-1 mt-0.5">{description}</p>}
        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-[#94A3B8]">
          <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {duration || '—'}</span>
          {scheduledAt && (
            <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {scheduledAt}</span>
          )}
          {(program.contentTypes ?? []).map((type) => (
            <span key={type} className="px-1.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] capitalize">
              {t(`addCourse.contentTypes.${type}.label`)}
            </span>
          ))}
          {isLocked && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#F1F5F9] text-mwasalatRed-600">
              <Lock className="w-3 h-3" /> {t('learner.courses.prerequisiteRequired', { title: prerequisiteTitle })}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 self-stretch sm:self-auto justify-between sm:justify-start pt-2 sm:pt-0 border-t sm:border-0 border-[#F1F5F9]">
        <span dir="ltr" className={`text-sm font-display font-bold ${requiresPayment ? 'text-mwasalatRed-600' : 'text-[#22C55E]'}`}>
          {requiresPayment ? `OMR ${localizeNumber(program.price, i18n.language)}` : t('learner.courses.freeLabel')}
        </span>
        <button
          type="button"
          onClick={() => (requiresPayment ? onPurchase(program) : onEnroll(program))}
          disabled={busy || isBlocked || isLocked}
          className="inline-flex items-center gap-1.5 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-3.5 py-2 rounded-lg transition-colors text-xs flex-shrink-0"
        >
          {busy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isLocked ? (
            <><Lock className="w-3.5 h-3.5" /> {t('learner.courses.prerequisiteLocked')}</>
          ) : isBlocked ? (
            t('learner.courses.sessionFull')
          ) : isFull ? (
            t('learner.courses.joinWaitlist')
          ) : requiresPayment ? (
            <><CreditCard className="w-3.5 h-3.5" /> {t('learner.courses.purchase')}</>
          ) : (
            t('learner.courses.enrollNow')
          )}
        </button>
      </div>
    </div>
  );
}

function CourseCard({ program, onEnroll, onPurchase, busy, isExternalLearner }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const theme = themeForCategory(program.category);
  const title = getLocalizedProgramField(program, 'title', i18n.language);
  const category = getLocalizedProgramField(program, 'category', i18n.language);
  const description = getLocalizedProgramField(program, 'description', i18n.language);
  const duration = getLocalizedProgramField(program, 'duration', i18n.language);
  const hasSeatLimit = program.seatsRemaining !== undefined;
  const isFull = hasSeatLimit && program.seatsRemaining <= 0;
  const isLowSeats = hasSeatLimit && program.seatsRemaining > 0 && program.seatsRemaining <= LOW_SEATS_THRESHOLD;
  // Internal learners are free regardless of a course's listed price — only
  // the paying external-learner audience ever sees a real price/checkout.
  const requiresPayment = isExternalLearner && program.price > 0;
  // A full free course still lets learners join the waitlist; a full paid
  // course can't sell a seat that doesn't exist, so checkout stays blocked.
  const isBlocked = isFull && requiresPayment;
  const isLocked = program.prerequisiteLocked;
  const prerequisiteTitle = getLocalizedProgramField(program.prerequisiteProgram, 'title', i18n.language);
  const scheduledAt = formatScheduledAt(program, i18n.language);

  return (
    <div className="card card-hover overflow-hidden flex flex-col">
      <div className="p-5 flex flex-col flex-1">
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${theme.bg} ${theme.text}`}>
            {category || t('programCard.generalCategory')}
          </span>
          {(program.contentTypes ?? []).map((type) => (
            <span key={type} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#475569] capitalize">
              {t(`addCourse.contentTypes.${type}.label`)}
            </span>
          ))}
          {scheduledAt && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#475569]">
              <Calendar className="w-3 h-3" /> {scheduledAt}
            </span>
          )}
          {hasSeatLimit && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              isFull ? 'bg-[#F1F5F9] text-[#475569]' : isLowSeats ? 'bg-[#FBE7E9] text-mwasalatRed-600' : 'bg-mwasalatInk-100 text-mwasalatInk-500'
            }`}>
              <Users className="w-3 h-3" />
              {isFull
                ? t('learner.courses.sessionFull')
                : localizeNumber(t('learner.courses.seatsLeft', { count: program.seatsRemaining }), i18n.language)}
            </span>
          )}
          {isLocked && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#475569]">
              <Lock className="w-3 h-3" /> {t('learner.courses.prerequisiteLocked')}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-[#1E293B] leading-snug mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-[#475569] leading-relaxed mb-4 line-clamp-2">{description}</p>
        )}
        <div className="mt-auto flex items-center justify-between mb-3 text-xs text-[#94A3B8]">
          <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {duration || '—'}</span>
          <span dir="ltr" className={`font-display font-bold ${requiresPayment ? 'text-mwasalatRed-600' : 'text-[#22C55E]'}`}>
            {requiresPayment ? `OMR ${localizeNumber(program.price, i18n.language)}` : t('learner.courses.freeLabel')}
          </span>
        </div>
        {isLocked && (
          <p className="text-xs text-mwasalatRed-600 mb-2 line-clamp-1">{t('learner.courses.prerequisiteRequired', { title: prerequisiteTitle })}</p>
        )}
        <button
          onClick={() => (requiresPayment ? onPurchase(program) : onEnroll(program))}
          disabled={busy || isBlocked || isLocked}
          className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isLocked ? (
            <><Lock className="w-4 h-4" /> {t('learner.courses.prerequisiteLocked')}</>
          ) : isBlocked ? (
            t('learner.courses.sessionFull')
          ) : isFull ? (
            t('learner.courses.joinWaitlist')
          ) : requiresPayment ? (
            <><CreditCard className="w-4 h-4" /> {t('learner.courses.purchase')}</>
          ) : (
            t('learner.courses.enrollNow')
          )}
        </button>
      </div>
    </div>
  );
}

export default function MwasalatCoursesCatalogPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const { user } = useMwasalatAuthStore();
  const isExternalLearner = user?.role === 'external_learner';
  const [programs, setPrograms] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showAll, setShowAll] = useState(false);

  const load = () => {
    setIsLoading(true);
    Promise.all([
      mwasalatProgramService.listPublic(),
      mwasalatProgramService.listMyEnrollments(),
    ]).then(([p, e]) => {
      const completedProgramIds = new Set(e.filter((enr) => enr.completedAt).map((enr) => enr.program?._id));
      setPrograms(p.map((program) => ({
        ...program,
        prerequisiteLocked: Boolean(program.prerequisiteProgram && !completedProgramIds.has(program.prerequisiteProgram._id)),
      })));
      setEnrolledIds(new Set(e.map((enr) => enr.program?._id)));
    }).finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const availablePrograms = programs.filter((p) => !enrolledIds.has(p._id));

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return availablePrograms.filter((p) => (
      p.title?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
      || p.titleAr?.toLowerCase().includes(q) || p.categoryAr?.toLowerCase().includes(q)
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, programs, enrolledIds]);

  const generalCategoryLabel = t('programCard.generalCategory');
  const categoryArByName = {};
  const subCategoryArByName = {};
  const categoryGroups = availablePrograms.reduce((acc, p) => {
    const cat = p.category || generalCategoryLabel;
    const sub = p.subCategory?.trim() || generalCategoryLabel;
    if (p.categoryAr?.trim() && !categoryArByName[cat]) categoryArByName[cat] = p.categoryAr.trim();
    if (p.subCategoryAr?.trim() && !subCategoryArByName[`${cat}::${sub}`]) subCategoryArByName[`${cat}::${sub}`] = p.subCategoryAr.trim();
    acc[cat] ??= {};
    acc[cat][sub] ??= [];
    acc[cat][sub].push(p);
    return acc;
  }, {});

  const displayCategory = (cat) => (i18n.language.startsWith('ar') && categoryArByName[cat]) || cat;
  const displaySubCategory = (cat, sub) => (i18n.language.startsWith('ar') && subCategoryArByName[`${cat}::${sub}`]) || sub;

  const categoryNames = Object.keys(categoryGroups).sort();
  const subCategoryGroups = selectedCategory ? categoryGroups[selectedCategory] ?? {} : {};
  const subCategoryNames = Object.keys(subCategoryGroups).sort();
  const titlesInView = selectedCategory && selectedSubCategory
    ? subCategoryGroups[selectedSubCategory] ?? []
    : [];

  const handleEnroll = async (program) => {
    setEnrollingId(program._id);
    try {
      const enrollment = await mwasalatProgramService.enroll(program._id);
      const title = getLocalizedProgramField(program, 'title', i18n.language);
      if (enrollment.status === 'waitlisted') {
        toast(t('learner.courses.waitlistedToast', { title }));
      } else if (enrollment.status === 'pending_approval') {
        toast(t('learner.courses.pendingApprovalToast', { title }));
      } else {
        toast.success(t('learner.courses.enrolledToast', { title }));
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('learner.courses.enrollFailed'));
    } finally {
      setEnrollingId(null);
    }
  };

  const handlePurchase = async (program) => {
    setEnrollingId(program._id);
    try {
      const { url } = await mwasalatPaymentService.createCheckoutSession(program._id);
      window.location.href = url;
    } catch (err) {
      toast.error(err.response?.data?.message || t('learner.courses.checkoutFailed'));
      setEnrollingId(null);
    }
  };

  const searchBox = (
    <div className="relative w-64">
      <Search className="w-4 h-4 text-[#94A3B8] absolute start-3 top-1/2 -translate-y-1/2" />
      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setSelectedCategory(null);
          setSelectedSubCategory(null);
          setShowAll(false);
        }}
        placeholder={t('learner.courses.searchPlaceholder')}
        className="w-full ps-9 pe-3 py-2 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 focus:border-mwasalatInk-300 transition-colors"
      />
    </div>
  );

  return (
    <MwasalatLearnerLayout title={t('learner.courses.title')} subtitle={t('learner.courses.subtitle')} actions={searchBox}>
      {isLoading ? (
        <div className="p-10 flex items-center justify-center text-[#94A3B8]">
          <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('learner.courses.loading')}
        </div>
      ) : availablePrograms.length === 0 ? (
        <div className="card p-10 text-center">
          <BookOpen className="w-8 h-8 text-mwasalatInk-400 mx-auto mb-3" />
          <p className="text-sm text-[#475569]">{t('learner.courses.allEnrolledMessage')}</p>
        </div>
      ) : searchResults !== null ? (
        // Search mode: flat results regardless of category/sub-category
        <>
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="text-lg font-semibold text-[#1E293B]">
              {localizeNumber(t('learner.courses.resultsFor', { count: searchResults.length, query: search }), i18n.language)}
            </h2>
            {searchResults.length > 0 && <ViewToggle mode={viewMode} onChange={setViewMode} t={t} />}
          </div>
          {searchResults.length === 0 ? (
            <div className="card p-10 text-center">
              <Search className="w-8 h-8 text-[#94A3B8] mx-auto mb-3" />
              <p className="text-sm text-[#475569]">{t('learner.courses.noMatch')}</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="flex flex-col gap-3">
              {searchResults.map((program) => (
                <CourseListRow key={program._id} program={program} onEnroll={handleEnroll} onPurchase={handlePurchase} busy={enrollingId === program._id} t={t} i18n={i18n} isExternalLearner={isExternalLearner} />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {searchResults.map((program) => (
                <CourseCard
                  key={program._id}
                  program={program}
                  onEnroll={handleEnroll}
                  onPurchase={handlePurchase}
                  busy={enrollingId === program._id}
                  isExternalLearner={isExternalLearner}
                />
              ))}
            </div>
          )}
        </>
      ) : showAll ? (
        // Flat "all courses" view, bypassing the category drill-down —
        // reached from the "can't find it?" prompt below the category grid.
        <>
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm flex-wrap">
              <button onClick={() => setShowAll(false)} className="font-medium text-[#94A3B8] hover:text-mwasalatInk-400 transition-colors">
                {t('learner.courses.allCategories')}
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] rtl:rotate-180" />
              <span className="font-medium text-mwasalatInk-500">{t('learner.courses.allCoursesFlatHeading')}</span>
            </div>
            <ViewToggle mode={viewMode} onChange={setViewMode} t={t} />
          </div>
          {viewMode === 'list' ? (
            <div className="flex flex-col gap-3">
              {availablePrograms.map((program) => (
                <CourseListRow key={program._id} program={program} onEnroll={handleEnroll} onPurchase={handlePurchase} busy={enrollingId === program._id} t={t} i18n={i18n} isExternalLearner={isExternalLearner} />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {availablePrograms.map((program) => (
                <CourseCard key={program._id} program={program} onEnroll={handleEnroll} onPurchase={handlePurchase} busy={enrollingId === program._id} isExternalLearner={isExternalLearner} />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Breadcrumb trail + view toggle */}
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm flex-wrap">
              <button
                onClick={() => { setSelectedCategory(null); setSelectedSubCategory(null); }}
                className={`font-medium transition-colors ${!selectedCategory ? 'text-mwasalatInk-500' : 'text-[#94A3B8] hover:text-mwasalatInk-400'}`}
              >
                {t('learner.courses.allCategories')}
              </button>
              {selectedCategory && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] rtl:rotate-180" />
                  <button
                    onClick={() => setSelectedSubCategory(null)}
                    className={`font-medium transition-colors ${!selectedSubCategory ? 'text-mwasalatInk-500' : 'text-[#94A3B8] hover:text-mwasalatInk-400'}`}
                  >
                    {displayCategory(selectedCategory)}
                  </button>
                </>
              )}
              {selectedSubCategory && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] rtl:rotate-180" />
                  <span className="font-medium text-mwasalatInk-500">{displaySubCategory(selectedCategory, selectedSubCategory)}</span>
                </>
              )}
            </div>
            <ViewToggle mode={viewMode} onChange={setViewMode} t={t} />
          </div>

          {!selectedCategory ? (
            // Level 1: Category "module" cards
            <>
              {viewMode === 'list' ? (
                <div className="flex flex-col gap-3">
                  {categoryNames.map((cat) => {
                    const subNames = Object.keys(categoryGroups[cat]);
                    const programsInCat = Object.values(categoryGroups[cat]).flat();
                    const totalCourses = programsInCat.length;
                    const theme = themeForCategory(cat);
                    return (
                      <FolderListRow
                        key={cat}
                        theme={theme}
                        title={displayCategory(cat)}
                        description={representativeDescription(programsInCat, i18n.language)}
                        countLabel={localizeNumber(t('learner.courses.coursesCount', { count: totalCourses }), i18n.language)}
                        onClick={() => { setSelectedCategory(cat); if (subNames.length === 1) setSelectedSubCategory(subNames[0]); }}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {categoryNames.map((cat) => {
                    const subNames = Object.keys(categoryGroups[cat]);
                    const programsInCat = Object.values(categoryGroups[cat]).flat();
                    const totalCourses = programsInCat.length;
                    const theme = themeForCategory(cat);
                    return (
                      <FolderCard
                        key={cat}
                        theme={theme}
                        title={displayCategory(cat)}
                        description={representativeDescription(programsInCat, i18n.language)}
                        countLabel={localizeNumber(t('learner.courses.coursesCount', { count: totalCourses }), i18n.language)}
                        onClick={() => { setSelectedCategory(cat); if (subNames.length === 1) setSelectedSubCategory(subNames[0]); }}
                      />
                    );
                  })}
                </div>
              )}

              <div className="card mt-5 p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4 justify-between bg-mwasalatRed-100/50">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center flex-shrink-0 text-mwasalatRed-600 shadow-sm">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1E293B]">{t('learner.courses.notFoundHeading')}</p>
                    <p className="text-xs text-[#475569] mt-0.5">{t('learner.courses.notFoundBody')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-[#FDEBED] text-mwasalatRed-600 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm flex-shrink-0 border border-mwasalatRed-300"
                >
                  {t('learner.courses.viewAllCta')} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </>
          ) : !selectedSubCategory ? (
            // Level 2: Sub-category cards within the chosen category
            viewMode === 'list' ? (
              <div className="flex flex-col gap-3">
                {subCategoryNames.map((sub) => {
                  const theme = themeForCategory(selectedCategory);
                  return (
                    <FolderListRow
                      key={sub}
                      theme={theme}
                      title={displaySubCategory(selectedCategory, sub)}
                      description={representativeDescription(subCategoryGroups[sub], i18n.language)}
                      countLabel={localizeNumber(t('learner.courses.coursesCount', { count: subCategoryGroups[sub].length }), i18n.language)}
                      onClick={() => setSelectedSubCategory(sub)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {subCategoryNames.map((sub) => {
                  const theme = themeForCategory(selectedCategory);
                  return (
                    <FolderCard
                      key={sub}
                      theme={theme}
                      title={displaySubCategory(selectedCategory, sub)}
                      description={representativeDescription(subCategoryGroups[sub], i18n.language)}
                      countLabel={localizeNumber(t('learner.courses.coursesCount', { count: subCategoryGroups[sub].length }), i18n.language)}
                      onClick={() => setSelectedSubCategory(sub)}
                    />
                  );
                })}
              </div>
            )
          ) : viewMode === 'list' ? (
            // Level 3: Course titles within the chosen sub-category
            <div className="flex flex-col gap-3">
              {titlesInView.map((program) => (
                <CourseListRow key={program._id} program={program} onEnroll={handleEnroll} onPurchase={handlePurchase} busy={enrollingId === program._id} t={t} i18n={i18n} isExternalLearner={isExternalLearner} />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {titlesInView.map((program) => (
                <CourseCard
                  key={program._id}
                  program={program}
                  onEnroll={handleEnroll}
                  onPurchase={handlePurchase}
                  busy={enrollingId === program._id}
                  isExternalLearner={isExternalLearner}
                />
              ))}
            </div>
          )}
        </>
      )}
    </MwasalatLearnerLayout>
  );
}
