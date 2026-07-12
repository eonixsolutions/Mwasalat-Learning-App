import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, Lock, AlertCircle } from 'lucide-react';
import { taskSheetContentService } from '../../../services/taskSheetContent.service.js';
import { courseService } from '../../../services/course.service.js';
import WeekTaskSheet from '../../../components/tasksheet/WeekTaskSheet.jsx';
import { QK } from '../../../constants/queryKeys.js';
import Spinner from '../../../components/ui/Spinner.jsx';

export default function WeekTaskSheetPage() {
  const { week } = useParams();
  const navigate = useNavigate();
  const weekNum = Number(week);

  // Get current enrollment to know which courseId to use
  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: QK.ENROLLMENT,
    queryFn: courseService.getMyEnrollment,
    staleTime: 5 * 60 * 1000,
  });

  const courseId = enrollment?.course?._id;

  const {
    data: content,
    isLoading: contentLoading,
    error,
  } = useQuery({
    queryKey: ['task-sheet-content', courseId, weekNum],
    queryFn: () => taskSheetContentService.getPublishedWeek(courseId, weekNum),
    enabled: !!courseId && !isNaN(weekNum),
    retry: false,
  });

  const isLoading = enrollmentLoading || contentLoading;

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Back nav */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#CA6357] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Task Sheets
      </button>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}>
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            {isNaN(weekNum) ? 'Task Sheet' : `Week ${weekNum} Task Sheet`}
          </h1>
          <p className="text-white/70 text-sm">Daily objectives, topics, and tasks for this week</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#FDEFEE] flex items-center justify-center mx-auto mb-3">
            {error?.response?.status === 404 ? (
              <Lock className="w-6 h-6 text-[#CA6357]" />
            ) : (
              <AlertCircle className="w-6 h-6 text-[#D96C5F]" />
            )}
          </div>
          <p className="font-semibold text-[#1E293B] mb-1">
            {error?.response?.status === 404
              ? 'Task sheet not available yet'
              : 'Failed to load task sheet'}
          </p>
          <p className="text-sm text-[#94A3B8]">
            {error?.response?.status === 404
              ? 'This week\'s content hasn\'t been published yet. Check back soon.'
              : 'Something went wrong. Please try again.'}
          </p>
        </div>
      ) : !content ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center">
          <BookOpen className="w-10 h-10 text-[#F2B3AC] mx-auto mb-3" />
          <p className="text-[#94A3B8] text-sm">No content found for Week {weekNum}.</p>
        </div>
      ) : (
        <WeekTaskSheet content={content} />
      )}
    </div>
  );
}
