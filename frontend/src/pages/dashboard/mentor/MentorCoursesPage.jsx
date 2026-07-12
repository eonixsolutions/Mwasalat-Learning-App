import { useQuery } from '@tanstack/react-query';
import { BookOpen, Clock, Tag, Loader2, BookX } from 'lucide-react';
import { staffService } from '../../../services/staff.service.js';

const REVIEW_TYPE_CFG = {
  none:      { label: 'No Reviews',      bg: '#F1F5F9', color: '#94A3B8' },
  screening: { label: 'Screening',        bg: '#FBE9E7', color: '#C76D64' },
  weekly:    { label: 'Weekly Reviews',   bg: '#FDEFEE', color: '#CA6357' },
};

function CourseCard({ course }) {
  const rt = REVIEW_TYPE_CFG[course.reviewType] ?? REVIEW_TYPE_CFG.none;

  return (
    <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FDEFEE] flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-6 h-6 text-[#CA6357]" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h3 className="text-base font-bold text-[#1E293B]">{course.name}</h3>
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ backgroundColor: course.isActive ? '#E8F8F2' : '#F1F5F9', color: course.isActive ? '#22A66E' : '#94A3B8' }}
            >
              {course.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="flex items-center gap-1 mt-0.5 mb-2">
            <Tag className="w-3 h-3 text-[#94A3B8]" />
            <span className="text-xs text-[#94A3B8] font-mono">/{course.slug}</span>
          </div>

          {course.description && (
            <p className="text-sm text-[#475569] leading-relaxed mb-3">{course.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CA6357] bg-[#FDEFEE] px-2.5 py-1 rounded-lg">
              <Clock className="w-3 h-3" />
              {course.durationWeeks} weeks
            </span>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: rt.bg, color: rt.color }}
            >
              {rt.label}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function MentorCoursesPage() {
  const { data: courses = [], isLoading, isError } = useQuery({
    queryKey: ['mentor-courses'],
    queryFn: staffService.getMyCourses,
    staleTime: 5 * 60_000,
  });

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">Mentor</p>
            <h2 className="text-2xl font-bold text-white">My Courses</h2>
            <p className="text-white/60 text-sm mt-0.5">
              {courses.length} course{courses.length !== 1 ? 's' : ''} across your batches
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <BookX className="w-10 h-10 text-[#CBD5E1]" strokeWidth={1.5} />
          <p className="text-sm text-[#94A3B8]">Failed to load courses.</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <BookX className="w-10 h-10 text-[#CBD5E1]" strokeWidth={1.5} />
          <p className="text-base font-bold text-[#1E293B]">No courses yet</p>
          <p className="text-sm text-[#94A3B8]">Courses will appear here once you're assigned to batches.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((c) => <CourseCard key={c._id} course={c} />)}
        </div>
      )}
    </div>
  );
}
