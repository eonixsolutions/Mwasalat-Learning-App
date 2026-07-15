import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Loader2, ChevronRight, Pencil, CheckCircle2, Archive, Users } from 'lucide-react';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import MwasalatInstructorLayout from '../../layouts/MwasalatInstructorLayout.jsx';
import { themeForCategory } from '../../utils/mwasalatCategoryTheme.js';

function StatTile({ icon: Icon, label, value, tone }) {
  return (
    <div className="card p-4 flex items-center gap-3">
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

export default function MwasalatInstructorDashboard() {
  const { user } = useMwasalatAuthStore();
  const [programs, setPrograms] = useState([]);
  const [totalLearners, setTotalLearners] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      mwasalatProgramService.listMine(),
      mwasalatProgramService.getMySummary(),
    ])
      .then(([myPrograms, summary]) => {
        setPrograms(myPrograms);
        setTotalLearners(summary.totalLearners);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const activeCount = programs.filter((p) => p.status === 'active').length;
  const archivedCount = programs.filter((p) => p.status === 'archived').length;
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const addCourseCta = (
    <Link
      to="/mwasalat/instructor/programs/new"
      className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
    >
      <Plus className="w-4 h-4" /> Add Course
    </Link>
  );

  return (
    <MwasalatInstructorLayout title="Instructor Dashboard" subtitle="Manage the programs you teach" actions={addCourseCta}>
      {/* Welcome hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-7 mb-6"
        style={{ background: 'linear-gradient(120deg, #23181A 0%, #4A3336 55%, #8C6B6E 100%)' }}
      >
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute right-16 -bottom-16 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-white/70 text-sm font-medium">Welcome back</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-0.5">{firstName} 👋</h1>
          <p className="text-white/80 text-sm mt-2 max-w-md">
            {programs.length === 0
              ? 'Create your first training program to start teaching on Mwasalat.'
              : `You have ${programs.length} program${programs.length === 1 ? '' : 's'} — ${activeCount} active.`}
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatTile icon={BookOpen} label="Total Programs" value={programs.length} tone={{ bg: 'bg-mwasalatInk-100', text: 'text-mwasalatInk-500' }} />
        <StatTile icon={CheckCircle2} label="Active" value={activeCount} tone={{ bg: 'bg-[#DCFCE7]', text: 'text-[#22C55E]' }} />
        <StatTile icon={Users} label="Learners Taught" value={totalLearners} tone={{ bg: 'bg-[#FEF3C7]', text: 'text-[#F59E0B]' }} />
        <StatTile icon={Archive} label="Archived" value={archivedCount} tone={{ bg: 'bg-mwasalatRed-100', text: 'text-mwasalatRed-600' }} />
      </div>

      <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Your Programs</h2>

      {isLoading ? (
        <div className="p-10 flex items-center justify-center text-[#94A3B8]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading programs…
        </div>
      ) : programs.length === 0 ? (
        <div className="card p-10 text-center">
          <BookOpen className="w-8 h-8 text-mwasalatInk-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-[#1E293B] mb-1">No programs yet</p>
          <p className="text-xs text-[#94A3B8] mb-4">Create your first course to get started.</p>
          <Link
            to="/mwasalat/instructor/programs/new"
            className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Add Course
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {programs.map((program) => {
            const theme = themeForCategory(program.category);
            return (
              <div key={program._id} className="card card-hover overflow-hidden flex flex-col">
                <div className="h-2" style={{ background: `linear-gradient(90deg, ${theme.solid}, ${theme.solid}99)` }} />
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(program.contentTypes ?? []).map((type) => (
                      <span key={type} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#475569] capitalize">
                        {type}
                      </span>
                    ))}
                    {program.status === 'archived' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#FBE7E9] text-mwasalatRed-600">
                        Archived
                      </span>
                    )}
                    {program.status === 'draft' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#F59E0B]">
                        Draft
                      </span>
                    )}
                  </div>
                  <span className={`inline-flex items-center self-start gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize mb-2 ${theme.bg} ${theme.text}`}>
                    {program.category || 'General'}
                  </span>
                  <h3 className="font-semibold text-[#1E293B] leading-snug mb-1">{program.title}</h3>
                  <p className="text-xs text-[#94A3B8] mb-4">{program.subCategory || ' '}</p>
                  <div className="mt-auto flex items-center gap-2">
                    <Link
                      to={`/mwasalat/instructor/programs/${program._id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-mwasalatInk-500 border border-[#E2E8F0] hover:border-mwasalatInk-300 transition-colors"
                    >
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to={`/mwasalat/instructor/programs/${program._id}/edit`}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-[#475569] border border-[#E2E8F0] hover:border-mwasalatInk-300 hover:text-mwasalatInk-500 transition-colors flex-shrink-0"
                      title="Edit course"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MwasalatInstructorLayout>
  );
}
