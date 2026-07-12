import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  MonitorPlay, Plus, Pencil, Trash2, Eye, EyeOff, X,
  Loader2, BookOpen, Link2, Clock, AlignLeft,
} from 'lucide-react';
import { videoService } from '../../../services/video.service.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { ROLES } from '../../../constants/roles.js';
import api from '../../../api/axios.js';

const dayLabel = (day) => (day === 0 ? 'Extra' : `Day ${day}`);

const EMPTY_FORM = {
  course: '', title: '', description: '', week: '', day: '0',
  embedUrl: '', duration: '', order: '0', isPublished: false,
};

function VideoFormModal({ initial, courses, onClose, onSaved }) {
  const isEdit = !!initial?._id;
  const [form, setForm] = useState(
    isEdit
      ? { ...initial, course: initial.course?._id ?? initial.course, week: String(initial.week), day: String(initial.day ?? 0), order: String(initial.order ?? 0), embedUrl: initial.embedUrl ?? '' }
      : { ...EMPTY_FORM }
  );

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const createMutation = useMutation({
    mutationFn: (data) => videoService.create(data),
    onSuccess: (video) => { toast.success('Video added'); onSaved(video); },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to save'),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => videoService.update(initial._id, data),
    onSuccess: (video) => { toast.success('Video updated'); onSaved(video); },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to save'),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.course) return toast.error('Please select a course');
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.week) return toast.error('Week is required');
    if (!form.embedUrl.trim()) return toast.error('Embed URL is required');
    const payload = {
      course: form.course,
      title: form.title.trim(),
      description: form.description.trim(),
      week: +form.week,
      day: +form.day,
      embedUrl: form.embedUrl.trim(),
      duration: form.duration.trim(),
      order: +form.order,
      isPublished: form.isPublished,
    };
    isEdit ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col" style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.12)' }}>

          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] flex-shrink-0">
            <p className="text-base font-bold text-[#1E293B]">{isEdit ? 'Edit Video' : 'Add Video'}</p>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F8F9FB]">
              <X className="w-4 h-4 text-[#94A3B8]" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {/* Course */}
            <div>
              <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">
                Course <span className="text-[#D96C5F]">*</span>
              </label>
              <select value={form.course} onChange={e => set('course', e.target.value)}
                className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-[#CA6357] bg-white">
                <option value="">Select course…</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">
                Title <span className="text-[#D96C5F]">*</span>
              </label>
              <input value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. Introduction to Async/Await"
                className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#CA6357]" />
            </div>

            {/* Week + Day */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">
                  Week <span className="text-[#D96C5F]">*</span>
                </label>
                <input type="number" min="1" max="52" value={form.week} onChange={e => set('week', e.target.value)}
                  placeholder="1"
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-[#CA6357]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">Day</label>
                <select value={form.day} onChange={e => set('day', e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-[#CA6357] bg-white">
                  <option value="0">Extra</option>
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>Day {n}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Embed URL */}
            <div>
              <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">
                Embed URL <span className="text-[#D96C5F]">*</span>
              </label>
              <input value={form.embedUrl} onChange={e => set('embedUrl', e.target.value)}
                placeholder="https://…sharepoint.com/…/_layouts/15/embed.aspx?UniqueId=…"
                className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#CA6357]" />
              <p className="mt-1 text-[11px] text-[#94A3B8]">
                In OneDrive/SharePoint: open the video → Share → Embed → copy the URL inside <code className="bg-[#F1F5F9] px-1 rounded">src="…"</code>
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={2} placeholder="Brief description (optional)…"
                className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#CA6357] resize-none" />
            </div>

            {/* Duration + Order */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">Duration</label>
                <input value={form.duration} onChange={e => set('duration', e.target.value)}
                  placeholder="e.g. 45:30"
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#CA6357]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">Order</label>
                <input type="number" min="0" value={form.order} onChange={e => set('order', e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-[#CA6357]" />
              </div>
            </div>

            {/* Publish toggle */}
            <div className="flex items-center gap-3 p-3 bg-[#F8F9FB] rounded-xl">
              <button type="button" onClick={() => set('isPublished', !form.isPublished)}
                className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${form.isPublished ? 'bg-[#CA6357]' : 'bg-[#CBD5E1]'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isPublished ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <div>
                <p className="text-sm font-semibold text-[#1E293B]">{form.isPublished ? 'Published' : 'Draft'}</p>
                <p className="text-[11px] text-[#94A3B8]">{form.isPublished ? 'Visible to students' : 'Hidden from students'}</p>
              </div>
            </div>
          </form>

          <div className="px-6 py-4 border-t border-[#F1F5F9] flex gap-2 flex-shrink-0">
            <button onClick={onClose} className="flex-1 border border-[#E2E8F0] text-[#475569] font-medium px-4 py-2.5 rounded-xl hover:bg-[#F8F9FB] text-sm">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Video'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function VideoManagePage() {
  const queryClient = useQueryClient();
  const { user }    = useAuth();
  const canDelete   = [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.BRANCH_COORDINATOR].includes(user?.role);

  const [courseFilter, setCourseFilter] = useState('');
  const [showForm, setShowForm]         = useState(false);
  const [editing, setEditing]           = useState(null);

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses').then(r => r.data.data?.courses ?? r.data.data ?? []),
  });

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['videos', 'all', courseFilter],
    queryFn: () => videoService.listAll(courseFilter ? { course: courseFilter } : {}),
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, isPublished }) => videoService.update(id, { isPublished }),
    onSuccess: () => {
      toast.success('Updated');
      queryClient.invalidateQueries({ queryKey: ['videos', 'all'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => videoService.remove(id),
    onSuccess: () => {
      toast.success('Video deleted');
      queryClient.invalidateQueries({ queryKey: ['videos', 'all'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to delete'),
  });

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['videos', 'all'] });
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (video) => {
    if (!confirm(`Delete "${video.title}"? This cannot be undone.`)) return;
    deleteMutation.mutate(video._id);
  };

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}>
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <MonitorPlay className="w-7 h-7 text-white" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">Zero2Code</p>
              <h2 className="text-2xl font-bold text-white mb-1">Video Classes</h2>
              <p className="text-white/60 text-sm">{videos.length} video{videos.length !== 1 ? 's' : ''} total</p>
            </div>
          </div>
          <button onClick={() => { setEditing(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 bg-[#D96C5F] hover:bg-[#C45E52] text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors flex-shrink-0">
            <Plus className="w-4 h-4" /> Add Video
          </button>
        </div>
      </div>

      {/* Course filter */}
      <div className="bg-white rounded-2xl p-4 flex items-center gap-3" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <BookOpen className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
        <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}
          className="flex-1 text-sm text-[#1E293B] bg-transparent focus:outline-none">
          <option value="">All Courses</option>
          {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        {courseFilter && (
          <button onClick={() => setCourseFilter('')} className="text-xs text-[#94A3B8] hover:text-[#475569]">
            Clear
          </button>
        )}
      </div>

      {/* Video list */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <MonitorPlay className="w-10 h-10 text-[#E2E8F0]" strokeWidth={1.5} />
            <p className="text-base font-bold text-[#1E293B]">No videos yet</p>
            <p className="text-sm text-[#94A3B8]">Click "Add Video" to upload your first recording.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F8F9FB]">
            {videos.map((video) => (
              <div key={video._id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#FAFAFA] transition-colors">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-[#FDEFEE] flex items-center justify-center flex-shrink-0">
                  <MonitorPlay className="w-5 h-5 text-[#CA6357]" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[#1E293B] truncate">{video.title}</p>
                    <span className="text-[10px] font-bold text-[#7C6AF2] bg-[#F2EEFD] px-2 py-0.5 rounded-full flex-shrink-0">
                      Wk {video.week} · {dayLabel(video.day ?? 0)}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${video.isPublished ? 'bg-[#E8F8F2] text-[#22A66E]' : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>
                      {video.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {video.course?.name && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#94A3B8]">
                        <BookOpen className="w-3 h-3" /> {video.course.name}
                      </span>
                    )}
                    {video.duration && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#94A3B8]">
                        <Clock className="w-3 h-3" /> {video.duration}
                      </span>
                    )}
                    {video.description && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#94A3B8] truncate max-w-xs">
                        <AlignLeft className="w-3 h-3 flex-shrink-0" /> {video.description}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Publish toggle */}
                  <button
                    onClick={() => togglePublishMutation.mutate({ id: video._id, isPublished: !video.isPublished })}
                    disabled={togglePublishMutation.isPending}
                    title={video.isPublished ? 'Unpublish' : 'Publish'}
                    className={`p-1.5 rounded-lg transition-colors ${video.isPublished ? 'text-[#22A66E] bg-[#E8F8F2] hover:bg-[#d0f0e0]' : 'text-[#94A3B8] hover:bg-[#F8F9FB]'}`}>
                    {video.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {/* Edit */}
                  <button onClick={() => { setEditing(video); setShowForm(true); }}
                    className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#CA6357] hover:bg-[#FDEFEE] transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Delete (admin/coordinator only) */}
                  {canDelete && (
                    <button onClick={() => handleDelete(video)}
                      disabled={deleteMutation.isPending && deleteMutation.variables === video._id}
                      className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#D96C5F] hover:bg-[#FEE2E2] transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help note */}
      <div className="bg-[#FDEFEE] rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#CA6357]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Link2 className="w-4 h-4 text-[#CA6357]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#CA6357] mb-0.5">How to add a video</p>
          <p className="text-xs text-[#A94E43] leading-relaxed">
            Open the video in OneDrive → click <strong>Share</strong> → <strong>Embed</strong> → copy the URL inside <code className="bg-[#F2B3AC] px-1 rounded">src="…"</code> and paste it here.<br />
            Make sure the video is shared with students in SharePoint before publishing.
          </p>
        </div>
      </div>

      {(showForm || editing) && (
        <VideoFormModal
          initial={editing}
          courses={courses}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
