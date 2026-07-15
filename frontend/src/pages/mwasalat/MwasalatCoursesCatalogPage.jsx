import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { BookOpen, Folder, ChevronRight, CreditCard, Loader2, Search, Clock } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { mwasalatPaymentService } from '../../services/mwasalatPayment.service.js';
import MwasalatLearnerLayout from '../../layouts/MwasalatLearnerLayout.jsx';
import { themeForCategory } from '../../utils/mwasalatCategoryTheme.js';

const NO_SUBCATEGORY = 'General';

function CourseCard({ program, onEnroll, onPurchase, busy }) {
  const theme = themeForCategory(program.category);
  return (
    <div className="card card-hover overflow-hidden flex flex-col">
      <div className="h-2" style={{ background: `linear-gradient(90deg, ${theme.solid}, ${theme.solid}99)` }} />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(program.contentTypes ?? []).map((type) => (
            <span key={type} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#475569] capitalize">
              {type}
            </span>
          ))}
        </div>
        <h3 className="font-semibold text-[#1E293B] leading-snug mb-1">{program.title}</h3>
        {program.description && (
          <p className="text-sm text-[#475569] leading-relaxed mb-4 line-clamp-2">{program.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between mb-3 text-xs text-[#94A3B8]">
          <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {program.duration || '—'}</span>
          <span className={`font-display font-bold ${program.price ? 'text-mwasalatRed-600' : 'text-[#22C55E]'}`}>
            {program.price ? `OMR ${program.price}` : 'Free'}
          </span>
        </div>
        <button
          onClick={() => (program.price > 0 ? onPurchase(program) : onEnroll(program))}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : program.price > 0 ? (
            <><CreditCard className="w-4 h-4" /> Purchase</>
          ) : (
            'Enroll Now'
          )}
        </button>
      </div>
    </div>
  );
}

export default function MwasalatCoursesCatalogPage() {
  const [programs, setPrograms] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [search, setSearch] = useState('');

  const load = () => {
    setIsLoading(true);
    Promise.all([
      mwasalatProgramService.listPublic(),
      mwasalatProgramService.listMyEnrollments(),
    ]).then(([p, e]) => {
      setPrograms(p);
      setEnrolledIds(new Set(e.map((enr) => enr.program?._id)));
    }).finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const availablePrograms = programs.filter((p) => !enrolledIds.has(p._id));

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return availablePrograms.filter((p) => p.title?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, programs, enrolledIds]);

  const categoryGroups = availablePrograms.reduce((acc, p) => {
    const cat = p.category || 'Uncategorised';
    const sub = p.subCategory?.trim() || NO_SUBCATEGORY;
    acc[cat] ??= {};
    acc[cat][sub] ??= [];
    acc[cat][sub].push(p);
    return acc;
  }, {});

  const categoryNames = Object.keys(categoryGroups).sort();
  const subCategoryGroups = selectedCategory ? categoryGroups[selectedCategory] ?? {} : {};
  const subCategoryNames = Object.keys(subCategoryGroups).sort();
  const titlesInView = selectedCategory && selectedSubCategory
    ? subCategoryGroups[selectedSubCategory] ?? []
    : [];

  const handleEnroll = async (program) => {
    setEnrollingId(program._id);
    try {
      await mwasalatProgramService.enroll(program._id);
      toast.success(`Enrolled in ${program.title}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enroll');
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
      toast.error(err.response?.data?.message || 'Failed to start checkout');
      setEnrollingId(null);
    }
  };

  const searchBox = (
    <div className="relative w-64">
      <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setSelectedCategory(null);
          setSelectedSubCategory(null);
        }}
        placeholder="Search courses…"
        className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 focus:border-mwasalatInk-300 transition-colors"
      />
    </div>
  );

  return (
    <MwasalatLearnerLayout title="Browse Courses" subtitle="Explore training programs by category" actions={searchBox}>
      {isLoading ? (
        <div className="p-10 flex items-center justify-center text-[#94A3B8]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading courses…
        </div>
      ) : availablePrograms.length === 0 ? (
        <div className="card p-10 text-center">
          <BookOpen className="w-8 h-8 text-mwasalatInk-400 mx-auto mb-3" />
          <p className="text-sm text-[#475569]">You're enrolled in every available program.</p>
        </div>
      ) : searchResults !== null ? (
        // Search mode: flat results regardless of category/sub-category
        <>
          <h2 className="text-lg font-semibold text-[#1E293B] mb-4">
            {searchResults.length} result{searchResults.length === 1 ? '' : 's'} for "{search}"
          </h2>
          {searchResults.length === 0 ? (
            <div className="card p-10 text-center">
              <Search className="w-8 h-8 text-[#94A3B8] mx-auto mb-3" />
              <p className="text-sm text-[#475569]">No courses match your search.</p>
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
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Breadcrumb trail */}
          <div className="flex items-center gap-1.5 text-sm mb-5 flex-wrap">
            <button
              onClick={() => { setSelectedCategory(null); setSelectedSubCategory(null); }}
              className={`font-medium transition-colors ${!selectedCategory ? 'text-mwasalatInk-500' : 'text-[#94A3B8] hover:text-mwasalatInk-400'}`}
            >
              All Categories
            </button>
            {selectedCategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                <button
                  onClick={() => setSelectedSubCategory(null)}
                  className={`font-medium transition-colors ${!selectedSubCategory ? 'text-mwasalatInk-500' : 'text-[#94A3B8] hover:text-mwasalatInk-400'}`}
                >
                  {selectedCategory}
                </button>
              </>
            )}
            {selectedSubCategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span className="font-medium text-mwasalatInk-500">{selectedSubCategory}</span>
              </>
            )}
          </div>

          {!selectedCategory ? (
            // Level 1: Category "module" cards
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {categoryNames.map((cat) => {
                const subNames = Object.keys(categoryGroups[cat]);
                const totalCourses = Object.values(categoryGroups[cat]).reduce((n, arr) => n + arr.length, 0);
                const theme = themeForCategory(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      if (subNames.length === 1) setSelectedSubCategory(subNames[0]);
                    }}
                    className="card card-hover p-5 flex flex-col text-left"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${theme.bg} ${theme.text}`}>
                      <Folder className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-[#1E293B] leading-snug mb-1">{cat}</h3>
                    <p className="text-xs text-[#94A3B8] mb-4">
                      {subNames.length > 1 ? `${subNames.length} sub-categories · ` : ''}{totalCourses} course{totalCourses === 1 ? '' : 's'}
                    </p>
                    <div className="mt-auto flex items-center justify-end" style={{ color: theme.solid }}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : !selectedSubCategory ? (
            // Level 2: Sub-category cards within the chosen category
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {subCategoryNames.map((sub) => {
                const theme = themeForCategory(selectedCategory);
                return (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubCategory(sub)}
                    className="card card-hover p-5 flex flex-col text-left"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${theme.bg} ${theme.text}`}>
                      <Folder className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-[#1E293B] leading-snug mb-1">{sub}</h3>
                    <p className="text-xs text-[#94A3B8] mb-4">
                      {subCategoryGroups[sub].length} course{subCategoryGroups[sub].length === 1 ? '' : 's'}
                    </p>
                    <div className="mt-auto flex items-center justify-end" style={{ color: theme.solid }}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            // Level 3: Course titles within the chosen sub-category
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {titlesInView.map((program) => (
                <CourseCard
                  key={program._id}
                  program={program}
                  onEnroll={handleEnroll}
                  onPurchase={handlePurchase}
                  busy={enrollingId === program._id}
                />
              ))}
            </div>
          )}
        </>
      )}
    </MwasalatLearnerLayout>
  );
}
