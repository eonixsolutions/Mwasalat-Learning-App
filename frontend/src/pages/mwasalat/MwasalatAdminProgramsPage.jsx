import { useState, useEffect, useMemo } from 'react';
import { BookOpen, Loader2, Search, Trophy, Sparkles } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { ProgramCard, ProgramDetailModal } from '../../components/mwasalat/MwasalatProgramCard.jsx';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'archived', label: 'Archived' },
  { value: 'draft', label: 'Draft' },
];

export default function MwasalatAdminProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState(null);

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
      const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.instructor?.name?.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [programs, statusFilter, query]);

  return (
    <MwasalatAdminLayout title="Programs" subtitle="Every course across every instructor, including expired and archived">
      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center text-[#94A3B8]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading programs…
          </div>
        ) : programs.length === 0 ? (
          <div className="card p-10 text-center">
            <BookOpen className="w-8 h-8 text-mwasalatInk-400 mx-auto mb-3" />
            <p className="text-sm text-[#475569]">No programs yet.</p>
          </div>
        ) : (
          <>
            {topRated.length > 0 && (
              <div className="mb-8">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1E293B] mb-3">
                  <Trophy className="w-4 h-4 text-[#F59E0B]" /> Top Rated
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {topRated.map((program, i) => (
                    <ProgramCard key={program._id} program={program} badge={`★ ${program.avgRating}`} delay={i * 40} onClick={() => setSelectedProgram(program)} />
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1E293B] mb-3">
                <Sparkles className="w-4 h-4 text-mwasalatInk-500" /> New
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {newest.map((program, i) => (
                  <ProgramCard key={program._id} program={program} badge="New" delay={i * 40} onClick={() => setSelectedProgram(program)} />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-5">
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
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title or instructor…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="card p-10 text-center">
                <p className="text-sm text-[#475569]">No programs match this filter.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
