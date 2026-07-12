import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { CalendarOff, Plus, Trash2, Loader2, X, Sun } from 'lucide-react';
import { holidayService } from '../../../services/holiday.service.js';

const TYPE_STYLE = {
  public: { label: 'Public', color: '#7C6AF2', bg: '#F2EEFD' },
  custom: { label: 'Custom', color: '#F59E0B', bg: '#FFFBEB' },
};

function AddHolidayModal({ onClose }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: { type: 'custom' },
  });

  const mutation = useMutation({
    mutationFn: holidayService.createHoliday,
    onSuccess: () => {
      toast.success('Holiday added');
      qc.invalidateQueries({ queryKey: ['holidays'] });
      reset();
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Failed to add holiday'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-[#1E293B]">Add Holiday</h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#475569] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">Date *</label>
            <input
              type="date"
              {...register('date', { required: 'Date is required' })}
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357] text-[#1E293B]"
            />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">Name *</label>
            <input
              {...register('name', { required: 'Name is required' })}
              placeholder="e.g. Onam, Diwali, Independence Day"
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357] text-[#1E293B]"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">Type</label>
            <select
              {...register('type')}
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357] text-[#1E293B] bg-white"
            >
              <option value="public">Public Holiday</option>
              <option value="custom">Custom / Branch Holiday</option>
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-60"
            >
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Holiday
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-[#475569] text-sm font-semibold hover:bg-[#F8F9FB] transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HolidayPage() {
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['holidays'],
    queryFn: holidayService.getHolidays,
  });

  const deleteMutation = useMutation({
    mutationFn: holidayService.deleteHoliday,
    onSuccess: () => {
      toast.success('Holiday removed');
      qc.invalidateQueries({ queryKey: ['holidays'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Failed to remove'),
  });

  // Group by month
  const grouped = holidays.reduce((acc, h) => {
    const key = new Date(h.date).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    (acc[key] = acc[key] ?? []).push(h);
    return acc;
  }, {});

  return (
    <div className="space-y-6 pb-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}>
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Holidays</h1>
          <p className="text-white/70 text-sm">Sundays are always off — add public and branch-specific holidays here.</p>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Add Holiday
        </button>
      </div>

      {/* Sunday note */}
      <div className="flex items-start gap-3 bg-[#FDEFEE] border border-[#F2B3AC] rounded-2xl p-4">
        <Sun className="w-4 h-4 text-[#CA6357] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[#CA6357]">
          <span className="font-semibold">Sundays are automatically excluded</span> from the LeetCode day count — no need to add them here.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" />
        </div>
      ) : holidays.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <CalendarOff className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-base font-bold text-[#1E293B]">No holidays added</p>
          <p className="text-sm text-[#94A3B8] mt-1">Add public or branch-specific holidays.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, items]) => (
            <div key={month}>
              <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">{month}</p>
              <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
                {items.map((h, i) => {
                  const ts = TYPE_STYLE[h.type] ?? TYPE_STYLE.custom;
                  const d = new Date(h.date);
                  return (
                    <div key={h._id} className={`flex items-center gap-4 px-4 py-3 ${i < items.length - 1 ? 'border-b border-[#F1F5F9]' : ''}`}>
                      <div className="w-10 h-10 rounded-xl bg-[#F8F9FB] flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-[#94A3B8] uppercase leading-none">
                          {d.toLocaleString('en-IN', { month: 'short' })}
                        </span>
                        <span className="text-base font-bold text-[#1E293B] leading-tight">{d.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1E293B]">{h.name}</p>
                        <p className="text-xs text-[#94A3B8]">
                          {d.toLocaleString('en-IN', { weekday: 'long' })}
                          {h.createdBy ? ` · Added by ${h.createdBy.name}` : ''}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: ts.bg, color: ts.color }}>
                        {ts.label}
                      </span>
                      <button
                        onClick={() => { if (window.confirm(`Remove "${h.name}"?`)) deleteMutation.mutate(h._id); }}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#C76D64] hover:bg-[#FDEFEE] transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <AddHolidayModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
