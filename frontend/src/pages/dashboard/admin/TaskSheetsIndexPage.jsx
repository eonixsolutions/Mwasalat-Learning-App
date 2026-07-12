import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, FileText } from 'lucide-react';
import { courseService } from '../../../services/course.service.js';
import Spinner from '../../../components/ui/Spinner.jsx';

export default function TaskSheetsIndexPage() {
  const navigate = useNavigate();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses', 'all'],
    queryFn: courseService.getAll,
  });

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#1E293B]">Task Sheets</h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">
          Select a course to manage its weekly task sheet content
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Spinner /></div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center">
          <BookOpen className="w-10 h-10 text-[#F2B3AC] mx-auto mb-3" />
          <p className="text-sm text-[#94A3B8]">No courses found. Create a course first.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {courses.map(course => (
            <button
              key={course._id}
              onClick={() => navigate(`/admin/task-sheets/${course._id}`)}
              className="w-full bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center gap-4 hover:border-[#C45E52] hover:shadow-sm transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FDEFEE] flex items-center justify-center shrink-0 group-hover:bg-[#F2B3AC] transition-colors">
                <FileText className="w-5 h-5 text-[#CA6357]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1E293B] text-sm">{course.name}</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {course.durationWeeks} weeks
                  {course.isActive ? '' : ' · Inactive'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#CA6357] shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
