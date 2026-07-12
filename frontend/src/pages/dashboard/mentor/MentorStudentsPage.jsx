import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users, Search, GraduationCap,
  Loader2, UserX, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { staffService } from '../../../services/staff.service.js';

const STATUS_CFG = {
  active:    { label: 'Active',     bg: '#E8F8F2', color: '#22A66E' },
  dropped:   { label: 'Dropped',    bg: '#FEE2E2', color: '#D96C5F' },
  graduated: { label: 'Graduated',  bg: '#FDEFEE', color: '#CA6357' },
};

function StudentRow({ student }) {
  const user   = student.user ?? {};
  const batch  = student.batch;
  const course = student.course;
  const status = STATUS_CFG[student.studentStatus] ?? STATUS_CFG.active;

  return (
    <Link to={`/mentor/students/${student._id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-[#F8F9FB] transition-colors cursor-pointer">
      <div className="w-9 h-9 rounded-xl bg-[#FDEFEE] flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-[#CA6357]">
          {user.name?.charAt(0).toUpperCase() ?? '?'}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1E293B] truncate">{user.name ?? '—'}</p>
        <p className="text-xs text-[#94A3B8] truncate">{user.email ?? '—'}</p>
      </div>

      <div className="hidden sm:flex flex-col items-end gap-0.5 flex-shrink-0 w-28">
        <p className="text-xs font-semibold text-[#1E293B] truncate">{batch?.name ?? '—'}</p>
        <p className="text-[11px] text-[#94A3B8]">{course?.name ?? '—'}</p>
      </div>

      <div className="flex-shrink-0 w-16 text-center">
        <span className="text-xs font-bold text-[#CA6357]">Week {student.currentWeek ?? 1}</span>
      </div>

      {student.rollNumber && (
        <div className="hidden md:block flex-shrink-0 w-16 text-center">
          <span className="text-[11px] font-mono text-[#94A3B8]">#{student.rollNumber}</span>
        </div>
      )}

      <span
        className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full"
        style={{ backgroundColor: status.bg, color: status.color }}
      >
        {status.label}
      </span>
    </Link>
  );
}

export default function MentorStudentsPage() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const LIMIT = 25;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['mentor-students', page],
    queryFn: () => staffService.getMyStudents({ page, limit: LIMIT }),
    keepPreviousData: true,
  });

  const students   = data?.students ?? [];
  const total      = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.pages ?? 1;

  const filtered = search.trim()
    ? students.filter((s) =>
        s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.user?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : students;

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <Users className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">Mentor</p>
            <h2 className="text-2xl font-bold text-white">My Students</h2>
            <p className="text-white/60 text-sm mt-0.5">{total} students across your batches</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-[#E2E8F0] text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#CA6357] transition-colors"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        {/* Column headers */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-[#F1F5F9] bg-[#F8F9FB]">
          <div className="w-9 flex-shrink-0" />
          <p className="flex-1 text-xs font-bold text-[#94A3B8] uppercase tracking-wide">Student</p>
          <p className="hidden sm:block text-xs font-bold text-[#94A3B8] uppercase tracking-wide w-28 text-right">Batch / Course</p>
          <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wide w-16 text-center">Week</p>
          <p className="hidden md:block text-xs font-bold text-[#94A3B8] uppercase tracking-wide w-16 text-center">Roll</p>
          <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wide flex-shrink-0">Status</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <UserX className="w-10 h-10 text-[#CBD5E1]" strokeWidth={1.5} />
            <p className="text-sm text-[#94A3B8]">Failed to load students.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <GraduationCap className="w-10 h-10 text-[#CBD5E1]" strokeWidth={1.5} />
            <p className="text-base font-bold text-[#1E293B]">
              {search ? 'No students match your search' : 'No students in your batches yet'}
            </p>
            <p className="text-sm text-[#94A3B8]">
              {search ? 'Try a different name or email.' : 'Students will appear here once assigned to your batches.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F8F9FB]">
            {filtered.map((s) => <StudentRow key={s._id} student={s} />)}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !search && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#94A3B8]">
            Page {page} of {totalPages} · {total} students
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-[#E2E8F0] text-[#475569] hover:bg-[#F8F9FB] disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl border border-[#E2E8F0] text-[#475569] hover:bg-[#F8F9FB] disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
