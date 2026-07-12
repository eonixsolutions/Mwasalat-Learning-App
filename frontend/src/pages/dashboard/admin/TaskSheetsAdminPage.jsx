import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, EyeOff, BookOpen, Maximize2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { taskSheetContentService } from '../../../services/taskSheetContent.service.js';
import { cn } from '../../../utils/cn.js';
import Spinner from '../../../components/ui/Spinner.jsx';
import WeekTaskSheet from '../../../components/tasksheet/WeekTaskSheet.jsx';

export default function TaskSheetsAdminPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [previewWeek, setPreviewWeek] = useState(null);

  const { data: sheets = [], isLoading } = useQuery({
    queryKey: ['task-sheet-list', courseId],
    queryFn: () => taskSheetContentService.listByCourse(courseId),
    enabled: !!courseId,
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }) => taskSheetContentService.togglePublish(id, isPublished),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-sheet-list', courseId] });
      queryClient.invalidateQueries({ queryKey: ['task-sheet-published', courseId] });
      queryClient.invalidateQueries({ queryKey: ['task-sheet-content', courseId, data.week] });
      toast.success(data.isPublished ? 'Published — students can now see this' : 'Moved to draft');
    },
    onError: () => toast.error('Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => taskSheetContentService.removeWeek(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-sheet-list', courseId] });
      toast.success('Deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const { data: previewContent, isFetching: previewLoading } = useQuery({
    queryKey: ['task-sheet-preview', courseId, previewWeek],
    queryFn: () => taskSheetContentService.getAdminWeek(courseId, previewWeek),
    enabled: !!previewWeek,
  });

  const confirmDelete = (id, week) => {
    if (window.confirm(`Delete Week ${week} task sheet? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B]">Task Sheets</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">Manage weekly task sheet content for this course</p>
        </div>
        <button
          onClick={() => navigate(`/admin/task-sheets/${courseId}/editor?week=${(sheets.length ?? 0) + 1}`)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#D96C5F] text-white rounded-xl text-sm font-semibold hover:bg-[#C45E52] transition-colors"
        >
          <Plus className="w-4 h-4" /> Add week
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Spinner /></div>
      ) : sheets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#FDEFEE] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-[#CA6357]" />
          </div>
          <p className="font-semibold text-[#1E293B] mb-1">No task sheets yet</p>
          <p className="text-sm text-[#94A3B8] mb-4">Create the first week's task sheet content.</p>
          <button
            onClick={() => navigate(`/admin/task-sheets/${courseId}/editor?week=1`)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#D96C5F] text-white rounded-xl text-sm font-semibold hover:bg-[#C45E52] transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Week 1
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sheets.map((sheet) => (
            <div
              key={sheet._id}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center gap-4"
            >
              {/* Week badge */}
              <div className="shrink-0 w-12 h-12 rounded-xl bg-[#FDEFEE] border border-[#F2B3AC] flex flex-col items-center justify-center">
                <span className="text-[10px] font-semibold text-[#C45E52] uppercase">Wk</span>
                <span className="text-lg font-bold text-[#CA6357] leading-none">{sheet.week}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1E293B] text-sm leading-snug truncate">
                  Week {sheet.week}
                  {sheet.topicsOverview ? ` — ${sheet.topicsOverview}` : ''}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-md',
                    sheet.isPublished
                      ? 'bg-green-50 text-green-700'
                      : 'bg-[#F1F5F9] text-[#94A3B8]',
                  )}>
                    {sheet.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-xs text-[#CBD5E1]">
                    {sheet.days?.length ?? 0} days
                  </span>
                  <span className="text-xs text-[#CBD5E1]">{sheet.program}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setPreviewWeek(sheet.week)}
                  title="Preview"
                  className="p-2 rounded-xl hover:bg-[#FDEFEE] text-[#94A3B8] hover:text-[#CA6357] transition-colors"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => publishMutation.mutate({ id: sheet._id, isPublished: !sheet.isPublished })}
                  disabled={publishMutation.isPending}
                  title={sheet.isPublished ? 'Unpublish' : 'Publish'}
                  className="p-2 rounded-xl hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#CA6357] transition-colors"
                >
                  {sheet.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => navigate(`/admin/task-sheets/${courseId}/editor?week=${sheet.week}`)}
                  title="Edit"
                  className="p-2 rounded-xl hover:bg-[#FDEFEE] text-[#94A3B8] hover:text-[#CA6357] transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => confirmDelete(sheet._id, sheet.week)}
                  disabled={deleteMutation.isPending}
                  title="Delete"
                  className="p-2 rounded-xl hover:bg-red-50 text-[#94A3B8] hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {previewWeek && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setPreviewWeek(null)}
        >
          <div
            className="relative bg-[#F8F9FB] w-full sm:max-w-2xl max-h-[90vh] rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 bg-white border-b border-[#E2E8F0]">
              <div>
                <p className="font-semibold text-[#1E293B] text-sm">Week {previewWeek} — Preview</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">Student view of this task sheet</p>
              </div>
              <button
                onClick={() => setPreviewWeek(null)}
                className="p-2 rounded-xl hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#1E293B] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto p-5">
              {previewLoading ? (
                <div className="flex items-center justify-center py-20"><Spinner /></div>
              ) : previewContent ? (
                <WeekTaskSheet content={previewContent} />
              ) : (
                <p className="text-center text-sm text-[#94A3B8] py-10">Could not load preview.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
