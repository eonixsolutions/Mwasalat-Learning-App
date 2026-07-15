import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

const toDateTimeLocal = (value) => (value ? new Date(value).toISOString().slice(0, 16) : '');
const toDateLocal = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

export default function MwasalatEditCoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    mwasalatProgramService.getById(id).then((p) => {
      setProgram(p);
      reset({
        title: p.title,
        category: p.category,
        subCategory: p.subCategory ?? '',
        description: p.description ?? '',
        duration: p.duration ?? '',
        price: p.price ?? 0,
        expiryDate: toDateLocal(p.expiryDate),
        recordingLink: p.recordingLink ?? '',
        liveScheduledAt: toDateTimeLocal(p.liveScheduledAt),
        liveMeetingLink: p.liveMeetingLink ?? '',
        iltVenue: p.iltVenue ?? '',
        iltScheduledAt: toDateTimeLocal(p.iltScheduledAt),
      });
    }).finally(() => setIsLoading(false));
  }, [id, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => mwasalatProgramService.update(id, data),
    onSuccess: () => {
      toast.success('Course updated');
      navigate(`/mwasalat/instructor/programs/${id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update course'),
  });

  const { mutate: deleteCourse, isPending: isDeleting } = useMutation({
    mutationFn: () => mwasalatProgramService.remove(id),
    onSuccess: () => {
      toast.success('Course deleted');
      navigate('/mwasalat/instructor/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete course'),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center text-[#94A3B8]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <Link to={`/mwasalat/instructor/programs/${id}`} className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <p className="text-sm font-semibold text-[#1E293B]">Edit Course</p>
            <p className="text-xs text-[#94A3B8]">{program?.title}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-mwasalatRed-600 hover:text-mwasalatRed-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Delete Course
        </button>
      </header>

      <main className="p-8 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit((data) => mutate(data))} className="card p-6 space-y-5">

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Course Title</label>
            <input className={inputClass} {...register('title', { required: 'Title is required' })} />
            {errors.title && <p className="text-xs text-[#C22033] mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Category</label>
              <input className={inputClass} {...register('category', { required: 'Category is required' })} />
              {errors.category && <p className="text-xs text-[#C22033] mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Sub-category</label>
              <input className={inputClass} {...register('subCategory')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Description</label>
            <textarea rows={3} className={inputClass} {...register('description')} />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {program?.contentTypes?.map((type) => (
              <span key={type} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-mwasalatInk-100 text-mwasalatInk-500 capitalize">
                {type}
              </span>
            ))}
          </div>
          <p className="text-xs text-[#94A3B8] -mt-3">Content types can't be changed here — delete and create a new course to change them.</p>

          {program?.contentTypes?.includes('recording') && (
            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0]">
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Recording Link</label>
              <input className={inputClass} {...register('recordingLink')} />
            </div>
          )}

          {program?.contentTypes?.includes('live') && (
            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0] space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Date & Time</label>
                <input type="datetime-local" className={inputClass} {...register('liveScheduledAt')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Meeting Link</label>
                <input className={inputClass} {...register('liveMeetingLink')} />
              </div>
            </div>
          )}

          {program?.contentTypes?.includes('ilt') && (
            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0] space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Venue</label>
                <input className={inputClass} {...register('iltVenue')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Date & Time</label>
                <input type="datetime-local" className={inputClass} {...register('iltScheduledAt')} />
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Duration</label>
              <input className={inputClass} {...register('duration')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Price (OMR)</label>
              <input type="number" step="0.01" className={inputClass} {...register('price', { valueAsNumber: true })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Expiry Date</label>
            <input type="date" className={inputClass} {...register('expiryDate')} />
            <p className="text-xs text-[#94A3B8] mt-1">Course automatically archives after this date. Leave blank for no expiry.</p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </main>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-[#1E293B] mb-2">Delete this course?</h3>
            <p className="text-sm text-[#475569] mb-5">
              This removes it from the learner catalog. Enrolled learners keep their history, but the course is archived and no longer accepts new enrollments.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteCourse()}
                disabled={isDeleting}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-mwasalatRed-600 hover:bg-mwasalatRed-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
