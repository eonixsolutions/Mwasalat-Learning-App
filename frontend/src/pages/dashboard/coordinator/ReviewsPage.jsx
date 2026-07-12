import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star, Loader2, Plus, Trash2, CheckCircle2, XCircle,
  Calendar, Link2, User, ChevronDown, Clock, Edit3, AlertTriangle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { reviewService } from '../../../services/review.service.js';
import { holidayService } from '../../../services/holiday.service.js';

const STATUS_STYLE = {
  pending_slot: { label: 'Awaiting Slot',  color: '#F59E0B', bg: '#FFFBEB' },
  slot_booked:  { label: 'Slot Booked',    color: '#CA6357', bg: '#FDEFEE' },
  completed:    { label: 'Completed',      color: '#22A66E', bg: '#E8F8F2' },
};

function AddSlotModal({ reviewId, earliestDate, existingSlot, onClose }) {
  const qc        = useQueryClient();
  const isEditing = !!existingSlot;

  const { data: holidays = [] } = useQuery({
    queryKey: ['holidays'],
    queryFn: holidayService.getHolidays,
    staleTime: 5 * 60_000,
  });

  // Build a map: "YYYY-MM-DD" -> holiday name (local date)
  const holidayMap = Object.fromEntries(
    holidays.map((h) => {
      const d = new Date(h.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return [key, h.name];
    })
  );

  const validateDateTime = (v) => {
    if (!v) return 'Date and time is required';
    const d = new Date(v);
    if (d.getDay() === 0) return 'Slots cannot be scheduled on Sundays';
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (holidayMap[key]) return `${holidayMap[key]} is a holiday — choose another day`;
    if (earliestDate && d < new Date(earliestDate))
      return `Cannot schedule before ${new Date(earliestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    return true;
  };

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: isEditing ? {
      scheduledAt: new Date(existingSlot.scheduledAt).toISOString().slice(0, 16),
      meetingLink: existingSlot.meetingLink,
    } : {},
  });

  const addMutation = useMutation({
    mutationFn: (data) => isEditing
      ? reviewService.updateSlot(existingSlot._id, { scheduledAt: data.scheduledAt, meetingLink: data.meetingLink })
      : reviewService.addSlot({ reviewId, scheduledAt: data.scheduledAt, meetingLink: data.meetingLink }),
    onSuccess: () => {
      toast.success(isEditing ? 'Slot updated' : 'Slot added');
      qc.invalidateQueries({ queryKey: ['review-slots'] });
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? (isEditing ? 'Failed to update slot' : 'Failed to add slot')),
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <h3 className="text-base font-bold text-[#1E293B]">{isEditing ? 'Edit Slot' : 'Add Review Slot'}</h3>
        <form onSubmit={handleSubmit((d) => addMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">
              Date & Time
              {earliestDate && (
                <span className="ml-2 font-normal text-[#F59E0B]">
                  · not before {new Date(earliestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </label>
            <input
              type="datetime-local"
              min={earliestDate ? new Date(earliestDate).toISOString().slice(0, 16) : undefined}
              {...register('scheduledAt', { validate: validateDateTime })}
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357]"
            />
            {errors.scheduledAt && <p className="text-xs text-red-500 mt-1">{errors.scheduledAt.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">Meeting Link (Teams)</label>
            <input
              {...register('meetingLink', { required: 'Meeting link is required', pattern: { value: /^https?:\/\/.+/, message: 'Enter a valid URL' } })}
              placeholder="https://teams.microsoft.com/..."
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357]"
            />
            {errors.meetingLink && <p className="text-xs text-red-500 mt-1">{errors.meetingLink.message}</p>}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#E2E8F0] text-[#475569] font-semibold py-2 rounded-xl text-sm hover:bg-[#F8F9FB] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="flex-1 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold py-2 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? 'Save Changes' : 'Add Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CompleteReviewModal({ review, onClose }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const result = watch('result');

  const completeMutation = useMutation({
    mutationFn: (data) => reviewService.completeReview(review._id, {
      result: data.result,
      marks: data.marks ? Number(data.marks) : null,
      remarks: data.remarks,
      pendingTopics: data.pendingTopics
        ? data.pendingTopics.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    }),
    onSuccess: () => {
      toast.success('Review completed');
      qc.invalidateQueries({ queryKey: ['reviews', 'pending'] });
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Failed to complete review'),
  });

  const student = review.student?.user;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div>
          <h3 className="text-base font-bold text-[#1E293B]">Complete Review</h3>
          <p className="text-sm text-[#94A3B8] mt-0.5">{student?.name} — {review.reviewType === 'screening' ? `Part ${review.part}` : `Week ${review.weekNumber}`}</p>
        </div>

        <form onSubmit={handleSubmit((d) => completeMutation.mutate(d))} className="space-y-4">
          {/* Result */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-2">Result</label>
            <div className="grid grid-cols-2 gap-2">
              {['pass', 'fail'].map((v) => (
                <label
                  key={v}
                  className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
                    result === v
                      ? v === 'pass' ? 'border-[#22A66E] bg-[#E8F8F2]' : 'border-[#C76D64] bg-[#FDEFEE]'
                      : 'border-[#E2E8F0]'
                  }`}
                >
                  <input type="radio" value={v} {...register('result', { required: 'Result is required' })} className="sr-only" />
                  {v === 'pass'
                    ? <CheckCircle2 className="w-4 h-4 text-[#22A66E]" />
                    : <XCircle className="w-4 h-4 text-[#C76D64]" />}
                  <span className={`text-sm font-semibold capitalize ${
                    v === 'pass' ? 'text-[#22A66E]' : 'text-[#C76D64]'
                  }`}>{v}</span>
                </label>
              ))}
            </div>
            {errors.result && <p className="text-xs text-red-500 mt-1">{errors.result.message}</p>}
          </div>

          {/* Marks */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">Marks <span className="font-normal text-[#94A3B8]">out of 10 (optional)</span></label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="10"
              {...register('marks', {
                min: { value: 0,  message: 'Marks cannot be negative' },
                max: { value: 10, message: 'Marks cannot exceed 10' },
              })}
              placeholder="e.g. 8.5"
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357]"
            />
            {errors.marks && <p className="text-xs text-red-500 mt-1">{errors.marks.message}</p>}
          </div>

          {/* Pending topics */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">Pending Topics (comma-separated)</label>
            <input
              {...register('pendingTopics')}
              placeholder="Pointers, Arrays, Recursion"
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357]"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">Remarks (optional)</label>
            <textarea
              {...register('remarks')}
              rows={3}
              placeholder="Add notes for the student..."
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357] resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#E2E8F0] text-[#475569] font-semibold py-2 rounded-xl text-sm hover:bg-[#F8F9FB] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={completeMutation.isPending}
              className="flex-1 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold py-2 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Result'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReviewCard({ review, onComplete, onAddSlot, onEditSlot }) {
  const [expanded, setExpanded] = useState(false);
  const qc         = useQueryClient();
  const student    = review.student?.user ?? {};
  const courseName = review.course?.name ?? '—';
  const batchName  = review.student?.batch?.name ?? null;
  const ss         = STATUS_STYLE[review.status] ?? STATUS_STYLE.pending_slot;

  const slotsKey = ['review-slots', review._id];

  // Available slots — fetched when card is expanded for pending_slot
  const {
    data: slotsData,
    isLoading: slotsLoading,
    isError: slotsError,
  } = useQuery({
    queryKey: slotsKey,
    queryFn: () => reviewService.getSlots(review._id),
    enabled: expanded && review.status === 'pending_slot',
    staleTime: 30_000,
  });
  const availableSlots = Array.isArray(slotsData) ? slotsData : [];

  const deleteMutation = useMutation({
    mutationFn: (slotId) => reviewService.deleteSlot(slotId),
    onSuccess: () => {
      toast.success('Slot removed');
      qc.invalidateQueries({ queryKey: slotsKey });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Failed'),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ slotId, action }) => reviewService.resolveHolidayConflict(slotId, action),
    onSuccess: (_, { action, reviewForModal }) => {
      if (action === 'keep') {
        toast.success('Slot confirmed — student notified');
        qc.invalidateQueries({ queryKey: slotsKey });
        qc.invalidateQueries({ queryKey: ['reviews', 'pending'] });
      } else {
        toast.success('Slot cancelled — mentors notified to add a new slot');
        qc.invalidateQueries({ queryKey: slotsKey });
        qc.invalidateQueries({ queryKey: ['reviews', 'pending'] });
        // Auto-open Add Slot modal so mentor can immediately add a replacement
        if (reviewForModal) onAddSlot(reviewForModal);
      }
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Failed'),
  });

  const sectionLabel  = review.reviewType === 'screening'
    ? `Part ${review.part} Screening`
    : `Week ${review.weekNumber} Review`;
  const earliestDate  = review.earliestDate ? new Date(review.earliestDate) : null;
  const canScheduleNow = !earliestDate || earliestDate <= new Date();

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0]" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      {/* Card header */}
      <div className="flex items-start gap-4 p-4 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <div className="w-10 h-10 rounded-xl bg-[#FDEFEE] flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-[#CA6357]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-[#1E293B]">{student.name ?? 'Unknown'}</p>
            <span className="text-[10px] font-semibold text-[#475569] bg-[#F1F5F9] px-2 py-0.5 rounded-full">{courseName}</span>
            {batchName && (
              <span className="text-[10px] font-semibold text-[#7C6AF2] bg-[#F2EEFD] px-2 py-0.5 rounded-full">{batchName}</span>
            )}
          </div>
          <p className="text-xs text-[#475569] font-medium mt-0.5">{sectionLabel}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: ss.bg, color: ss.color }}>
              {ss.label}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#94A3B8] flex-shrink-0 transition-transform mt-1 ${expanded ? 'rotate-180' : ''}`} />
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#F1F5F9] pt-3 space-y-3" onClick={(e) => e.stopPropagation()}>

          {/* Student details */}
          <div className="bg-[#F8F9FB] rounded-xl px-4 py-3 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[#475569]">
              <User className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span>{student.email ?? '—'}</span>
            </div>
            {earliestDate && (
              <div className="flex items-center gap-2 text-xs" style={{ color: canScheduleNow ? '#22A66E' : '#F59E0B' }}>
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-medium">
                  {canScheduleNow
                    ? 'Ready to schedule'
                    : `Earliest slot: ${earliestDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                </span>
              </div>
            )}
          </div>

          {/* Available slots (pending_slot status) */}
          {review.status === 'pending_slot' && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                Available Slots {!slotsLoading && `(${availableSlots.length})`}
              </p>
              {slotsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 text-[#CA6357] animate-spin" />
                </div>
              ) : slotsError ? (
                <p className="text-xs text-red-400 italic px-1">Could not load slots. Try refreshing.</p>
              ) : availableSlots.length === 0 ? (
                <p className="text-xs text-[#94A3B8] italic px-1">No slots added yet — add one below.</p>
              ) : (
                availableSlots.map((slot) => (
                  <div key={slot._id} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 ${slot.holidayConflict ? 'bg-[#FEF9EC] border border-[#FCD34D]' : 'bg-[#F8F9FB]'}`}>
                    {slot.holidayConflict
                      ? <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0" />
                      : <Clock className="w-3.5 h-3.5 text-[#CA6357] flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      {slot.holidayConflict && (
                        <p className="text-[10px] font-bold text-[#B45309] uppercase tracking-wide mb-0.5">Holiday conflict — action needed</p>
                      )}
                      <p className="text-xs font-semibold text-[#1E293B]">
                        {new Date(slot.scheduledAt).toLocaleString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <a href={slot.meetingLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-[#CA6357] hover:text-[#A94E43] font-medium mt-0.5">
                        <Link2 className="w-3 h-3" /> Meeting link
                      </a>
                    </div>
                    {slot.holidayConflict ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => resolveMutation.mutate({ slotId: slot._id, action: 'keep' })}
                          disabled={resolveMutation.isPending}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[#FDEFEE] text-[#CA6357] hover:bg-[#CA6357] hover:text-white transition-colors">
                          Keep
                        </button>
                        <button
                          onClick={() => resolveMutation.mutate({ slotId: slot._id, action: 'cancel', reviewForModal: review })}
                          disabled={resolveMutation.isPending}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                          Cancel
                        </button>
                      </div>
                    ) : slot.isBooked ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDEFEE] text-[#CA6357]">Booked</span>
                    ) : (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button className="p-1 text-[#94A3B8] hover:text-[#CA6357] transition-colors" title="Edit"
                          onClick={() => onEditSlot({ reviewId: review._id, earliestDate: review.earliestDate, slot })}>
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1 text-[#94A3B8] hover:text-red-500 transition-colors" title="Delete"
                          onClick={() => deleteMutation.mutate(slot._id)}
                          disabled={deleteMutation.isPending}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
              <button onClick={() => onAddSlot(review)}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                <Plus className="w-4 h-4" /> Add Time Slot
              </button>
            </div>
          )}

          {/* Booked slot (slot_booked status) */}
          {review.status === 'slot_booked' && review.slot && (
            <div className={`flex items-start gap-2 rounded-xl px-4 py-3 ${review.slot.holidayConflict ? 'bg-[#FEF9EC] border border-[#FCD34D]' : 'bg-[#FDEFEE]'}`}>
              {review.slot.holidayConflict
                ? <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#F59E0B]" />
                : <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#CA6357]" />}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${review.slot.holidayConflict ? 'text-[#B45309]' : 'text-[#CA6357]'}`}>
                  {review.slot.holidayConflict ? 'Holiday conflict — decide below' : 'Student booked'}
                </p>
                <p className="text-sm font-semibold text-[#1E293B]">
                  {new Date(review.slot.scheduledAt).toLocaleString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <a href={review.slot.meetingLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#CA6357] font-semibold hover:text-[#A94E43] transition-colors mt-0.5">
                  <Link2 className="w-3 h-3" /> Join Meeting
                </a>
              </div>
            </div>
          )}

          {review.status === 'slot_booked' && review.slot?.holidayConflict && (
            <div className="flex gap-2">
              <button
                onClick={() => resolveMutation.mutate({ slotId: review.slot._id, action: 'keep' })}
                disabled={resolveMutation.isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
                <CheckCircle2 className="w-4 h-4" /> Keep — I'll conduct it
              </button>
              <button
                onClick={() => resolveMutation.mutate({ slotId: review.slot._id, action: 'cancel', reviewForModal: review })}
                disabled={resolveMutation.isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60 border border-red-200">
                <XCircle className="w-4 h-4" /> Cancel slot
              </button>
            </div>
          )}

          {review.status === 'slot_booked' && !review.slot?.holidayConflict && (
            <button onClick={() => onComplete(review)}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
              <Star className="w-4 h-4" /> Mark Result
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReviewsPage() {
  const [addSlotFor,    setAddSlotFor]    = useState(null);
  const [editSlotFor,   setEditSlotFor]   = useState(null);
  const [completeReview, setCompleteReview] = useState(null);

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['reviews', 'pending'],
    queryFn: reviewService.getPendingReviews,
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden p-6"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-0.5">Coordinator</p>
            <h1 className="text-xl font-bold text-white">Reviews & Tests</h1>
          </div>
          {!isLoading && (
            <div className="ml-auto bg-white/10 text-white text-sm font-bold px-3 py-1.5 rounded-xl">
              {pending.length} active
            </div>
          )}
        </div>
      </div>

      {/* Add slot hint */}
      <div className="bg-[#FDEFEE] border border-[#F2B3AC] rounded-2xl p-4 flex items-start gap-3">
        <Calendar className="w-5 h-5 text-[#CA6357] flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#CA6357]">Add time slots for reviews</p>
          <p className="text-xs text-[#475569] mt-0.5">
            When a student's tasks are all approved, they'll see a review request. Open a review below and add a time slot — the student can then book it.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" />
        </div>
      ) : pending.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <Star className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-base font-bold text-[#1E293B]">No pending reviews</p>
          <p className="text-sm text-[#94A3B8] mt-1">Reviews appear here once students complete all tasks for a part or week.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              onComplete={setCompleteReview}
              onAddSlot={setAddSlotFor}
              onEditSlot={setEditSlotFor}
            />
          ))}
        </div>
      )}

      {addSlotFor && (
        <AddSlotModal
          reviewId={addSlotFor._id}
          earliestDate={addSlotFor.earliestDate ?? null}
          onClose={() => setAddSlotFor(null)}
        />
      )}

      {editSlotFor && (
        <AddSlotModal
          reviewId={editSlotFor.reviewId}
          earliestDate={editSlotFor.earliestDate ?? null}
          existingSlot={editSlotFor.slot}
          onClose={() => setEditSlotFor(null)}
        />
      )}

      {completeReview && (
        <CompleteReviewModal
          review={completeReview}
          onClose={() => setCompleteReview(null)}
        />
      )}
    </div>
  );
}
