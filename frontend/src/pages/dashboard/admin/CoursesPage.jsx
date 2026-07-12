import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus, BookOpen, Pencil, Trash2, Clock, Tag,
  ToggleLeft, ToggleRight, Loader2, AlertTriangle, ListChecks, X, FileText,
} from 'lucide-react';
import Modal from '../../../components/ui/Modal.jsx';
import { courseService } from '../../../services/course.service.js';

const toSlug = (name) =>
  name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

// ── Course Form (shared by Add & Edit) ────────────────────────────────────────
function CourseForm({ initial, onSave, onCancel, saving }) {
  const [slugLocked, setSlugLocked] = useState(!!initial);

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm({
    defaultValues: {
      name:          initial?.name          ?? '',
      slug:          initial?.slug          ?? '',
      description:   initial?.description   ?? '',
      durationWeeks: initial?.durationWeeks ?? '',
      reviewType:    initial?.reviewType    ?? 'none',
      screenings:    initial?.screenings    ?? [],
      isActive:      initial?.isActive      ?? true,
    },
  });

  const { fields: screeningFields, append: addScreening, remove: removeScreening } = useFieldArray({
    control,
    name: 'screenings',
  });

  const reviewTypeVal = watch('reviewType');

  const nameVal = watch('name');

  useEffect(() => {
    if (!initial && !slugLocked) {
      setValue('slug', toSlug(nameVal || ''));
    }
  }, [nameVal, slugLocked, initial]);

  const handleSave = (data) => {
    onSave({
      ...data,
      screenings: (data.screenings ?? []).map((s, i) => ({ part: i + 1, afterWeek: Number(s.afterWeek), bufferDays: Number(s.bufferDays ?? 3) })),
    });
  };

  return (
    <form onSubmit={handleSubmit(handleSave)} className="space-y-4">

      <div>
        <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Course Name <span className="text-[#D96C5F]">*</span></label>
        <input
          placeholder="e.g. Zero2Code"
          className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#CA6357]/25 transition-colors ${errors.name ? 'border-[#D96C5F]' : 'border-[#E2E8F0] hover:border-[#F2B3AC]'}`}
          {...register('name', { required: 'Name is required' })}
        />
        {errors.name && <p className="text-xs text-[#D96C5F] mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Slug <span className="text-[#D96C5F]">*</span></label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] font-mono select-none">/</span>
          <input
            placeholder="zero2code"
            className="w-full pl-6 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#F2B3AC] text-sm bg-white text-[#1E293B] font-mono placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#CA6357]/25 transition-colors"
            {...register('slug', { required: 'Slug is required' })}
            onFocus={() => setSlugLocked(true)}
          />
        </div>
        <p className="text-xs text-[#94A3B8] mt-1">Lowercase letters, numbers, hyphens only.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Description</label>
        <textarea
          rows={3}
          placeholder="Brief description of what students will learn…"
          className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#F2B3AC] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#CA6357]/25 resize-none transition-colors"
          {...register('description')}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Duration (weeks) <span className="text-[#D96C5F]">*</span></label>
        <input
          type="number"
          min={1}
          placeholder="24"
          className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#CA6357]/25 transition-colors ${errors.durationWeeks ? 'border-[#D96C5F]' : 'border-[#E2E8F0] hover:border-[#F2B3AC]'}`}
          {...register('durationWeeks', { required: 'Duration is required', min: { value: 1, message: 'Min 1 week' } })}
        />
        {errors.durationWeeks && <p className="text-xs text-[#D96C5F] mt-1">{errors.durationWeeks.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Review / Test Type</label>
        <select
          {...register('reviewType')}
          className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#CA6357]/25 transition-colors"
        >
          <option value="none">No review (AI Launchpad style)</option>
          <option value="screening">Screening test per part (Zero2Code)</option>
          <option value="weekly">Weekly review (Code2Career)</option>
        </select>
        <p className="text-xs text-[#94A3B8] mt-1">Controls when tests are triggered and next section unlock.</p>
      </div>

      {reviewTypeVal === 'screening' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#1E293B]">Screening Schedule</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">Define when each screening is triggered (after which week).</p>
            </div>
            <button
              type="button"
              onClick={() => addScreening({ part: screeningFields.length + 1, afterWeek: '' })}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#CA6357] bg-[#FDEFEE] hover:bg-[#F2B3AC] px-3 py-1.5 rounded-xl transition-colors"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          {screeningFields.length === 0 && (
            <p className="text-xs text-[#94A3B8] bg-[#F8F9FB] rounded-xl px-4 py-3">
              No screenings configured yet. Click "Add" to define screening checkpoints.
            </p>
          )}

          {screeningFields.map((field, i) => (
            <div key={field.id} className="flex items-center gap-2 bg-[#F8F9FB] rounded-xl px-3 py-2.5 flex-wrap">
              <span className="text-xs font-semibold text-[#475569] w-14 flex-shrink-0">Part {i + 1}</span>
              <span className="text-xs text-[#94A3B8] flex-shrink-0">after week</span>
              <input
                type="number"
                min={1}
                placeholder="3"
                className="w-14 px-2 py-1.5 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#CA6357]/25 text-center"
                {...register(`screenings.${i}.afterWeek`, {
                  required: true,
                  valueAsNumber: true,
                  min: 1,
                })}
              />
              <span className="text-xs text-[#94A3B8] flex-shrink-0 ml-2">buffer days</span>
              <input
                type="number"
                min={0}
                placeholder="3"
                title="Revision days before test (e.g. 4 = test on 5th day)"
                className="w-14 px-2 py-1.5 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#CA6357]/25 text-center"
                {...register(`screenings.${i}.bufferDays`, {
                  valueAsNumber: true,
                  min: 0,
                })}
              />
              <button
                type="button"
                onClick={() => removeScreening(i)}
                className="ml-auto p-1 rounded-lg text-[#94A3B8] hover:text-[#D96C5F] hover:bg-[#FBE9E7] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {initial && (
        <div className="flex items-center justify-between bg-[#F8F9FB] rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[#1E293B]">Active</p>
            <p className="text-xs text-[#94A3B8]">Students can enroll in this course</p>
          </div>
          <button
            type="button"
            onClick={() => setValue('isActive', !watch('isActive'))}
            className="transition-colors"
          >
            {watch('isActive')
              ? <ToggleRight className="w-8 h-8 text-[#CA6357]" />
              : <ToggleLeft  className="w-8 h-8 text-[#94A3B8]" />}
          </button>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F8F9FB] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#CA6357] hover:bg-[#b85548] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {initial ? 'Save Changes' : 'Create Course'}
        </button>
      </div>
    </form>
  );
}

// ── Course Card ───────────────────────────────────────────────────────────────
function CourseCard({ course, onEdit, onDelete }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-3 card-hover" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>

      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FDEFEE' }}>
          <BookOpen className="w-5 h-5" style={{ color: '#CA6357' }} strokeWidth={1.8} />
        </div>
        <span className={`mt-0.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          course.isActive
            ? 'bg-[#E8F8F2] text-[#22A66E]'
            : 'bg-[#F1F5F9] text-[#94A3B8]'
        }`}>
          {course.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="text-base font-bold text-[#1E293B] mb-0.5">{course.name}</h3>
        <div className="flex items-center gap-1 mb-2">
          <Tag className="w-3 h-3 text-[#94A3B8]" />
          <span className="text-xs text-[#94A3B8] font-mono">/{course.slug}</span>
        </div>
        {course.description && (
          <p className="text-sm text-[#475569] leading-relaxed line-clamp-2">{course.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#C45E52]" />
          <span className="text-xs font-semibold text-[#CA6357]">{course.durationWeeks} weeks</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/admin/courses/${course._id}/lessons`)}
            className="p-2 rounded-lg text-[#475569] hover:text-[#7C6AF2] hover:bg-[#F2EEFD] transition-colors"
            title="Manage Lessons"
          >
            <ListChecks className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate(`/admin/task-sheets/${course._id}`)}
            className="p-2 rounded-lg text-[#475569] hover:text-[#CA6357] hover:bg-[#FDEFEE] transition-colors"
            title="Task Sheets"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(course)}
            className="p-2 rounded-lg text-[#475569] hover:text-[#CA6357] hover:bg-[#FDEFEE] transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(course)}
            className="p-2 rounded-lg text-[#475569] hover:text-[#D96C5F] hover:bg-[#FBE9E7] transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CoursesPage() {
  const queryClient = useQueryClient();

  const [addOpen,    setAddOpen]    = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: courseService.getAll,
  });

  const onSuccess = (msg) => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
    queryClient.invalidateQueries({ queryKey: ['courses', 'active'] });
    toast.success(msg);
    setAddOpen(false);
    setEditTarget(null);
    setDeleteTarget(null);
  };

  const createMutation = useMutation({
    mutationFn: courseService.create,
    onSuccess: () => onSuccess('Course created'),
    onError:   (err) => toast.error(err.response?.data?.message || 'Failed to create course'),
  });

  const updateMutation = useMutation({
    mutationFn: courseService.update,
    onSuccess: () => onSuccess('Course updated'),
    onError:   (err) => toast.error(err.response?.data?.message || 'Failed to update course'),
  });

  const deleteMutation = useMutation({
    mutationFn: courseService.remove,
    onSuccess: () => onSuccess('Course deleted'),
    onError:   (err) => toast.error(err.response?.data?.message || 'Failed to delete course'),
  });

  const activeCount = courses.filter((c) => c.isActive).length;

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}>
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Courses</h1>
            <p className="text-white/70 text-sm">Manage programs students can enroll in.</p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Course
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Courses', value: courses.length,  bg: '#FDEFEE', color: '#CA6357' },
          { label: 'Active',        value: activeCount,     bg: '#E8F8F2', color: '#22A66E' },
          { label: 'Inactive',      value: courses.length - activeCount, bg: '#F1F5F9', color: '#94A3B8' },
        ].map(({ label, value, bg, color }) => (
          <div key={label} className="bg-white rounded-2xl px-5 py-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <p className="text-xs text-[#94A3B8] mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Course grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div className="w-14 h-14 rounded-2xl bg-[#FDEFEE] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-[#CA6357]" strokeWidth={1.5} />
          </div>
          <p className="text-base font-bold text-[#1E293B] mb-1">No courses yet</p>
          <p className="text-sm text-[#475569] mb-5">Add your first course to get started.</p>
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Add Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Add modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add New Course">
        <CourseForm
          onSave={(data) => createMutation.mutate(data)}
          onCancel={() => setAddOpen(false)}
          saving={createMutation.isPending}
        />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Course">
        {editTarget && (
          <CourseForm
            key={editTarget._id}
            initial={editTarget}
            onSave={(data) => updateMutation.mutate({ id: editTarget._id, ...data })}
            onCancel={() => setEditTarget(null)}
            saving={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Course">
        {deleteTarget && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FBE9E7] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-[#D96C5F]" />
            </div>
            <p className="text-base font-bold text-[#1E293B] mb-1">Delete "{deleteTarget.name}"?</p>
            <p className="text-sm text-[#475569] mb-6">
              This cannot be undone. Courses with enrolled students cannot be deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F8F9FB] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget._id)}
                disabled={deleteMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#D96C5F] hover:bg-[#C45E52] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
