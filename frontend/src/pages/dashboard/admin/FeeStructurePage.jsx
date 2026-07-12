import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  CreditCard, Plus, Trash2, Save, Loader2, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, BookOpen, IndianRupee,
} from 'lucide-react';
import { feesService } from '../../../services/fees.service.js';
import { courseService } from '../../../services/course.service.js';

// ── helpers ───────────────────────────────────────────────────────────────────

const FEE_STATUS_CFG = {
  pending:  { label: 'Pending',  bg: '#FFFBEB', color: '#F59E0B' },
  partial:  { label: 'Partial',  bg: '#EFF6FF', color: '#3B82F6' },
  paid:     { label: 'Paid',     bg: '#E8F8F2', color: '#22A66E' },
  overdue:  { label: 'Overdue',  bg: '#FEE2E2', color: '#D96C5F' },
};

// ── FeeStructureForm ──────────────────────────────────────────────────────────

function FeeStructureForm({ course, existing, onClose }) {
  const qc = useQueryClient();

  // Store dueAfterWeek in the form; convert to/from dueAfterDays (×7) on load/submit
  const defaultInstallments = existing?.installments?.length
    ? existing.installments.map(i => ({
        installmentNumber: i.installmentNumber,
        label:             i.label,
        amount:            i.amount,
        weeksAccess:       i.weeksAccess,
        dueAfterWeek:      i.installmentNumber === 1 ? 0 : Math.round((i.dueAfterDays ?? 0) / 7),
      }))
    : [{ installmentNumber: 1, label: 'First Installment', amount: '', weeksAccess: '', dueAfterWeek: 0 }];

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      totalFee:     existing?.totalFee ?? '',
      currency:     existing?.currency ?? 'INR',
      notes:        existing?.notes ?? '',
      installments: defaultInstallments,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'installments' });
  const installments = watch('installments');
  const computedTotal = installments.reduce((sum, i) => sum + (+i.amount || 0), 0);

  const mutation = useMutation({
    mutationFn: (data) => feesService.upsertStructure(course._id, {
      ...data,
      totalFee: +data.totalFee,
      installments: data.installments.map((i, idx) => ({
        installmentNumber: idx + 1,
        label:        i.label,
        amount:       +i.amount,
        weeksAccess:  +i.weeksAccess,
        // Installment 1 is always due immediately; rest are week-based (×7 days)
        dueAfterDays: idx === 0 ? 0 : (+i.dueAfterWeek || 0) * 7,
      })),
    }),
    onSuccess: () => {
      toast.success('Fee structure saved');
      qc.invalidateQueries({ queryKey: ['fee-structures'] });
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Failed to save'),
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>

        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F1F5F9]">
          <div>
            <p className="text-base font-bold text-[#1E293B]">Fee Structure</p>
            <p className="text-sm text-[#94A3B8] mt-0.5">{course.name}</p>
          </div>
          <button onClick={onClose} className="text-xs text-[#94A3B8] hover:text-[#1E293B]">Close</button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Total fee + currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wide mb-1.5">Total Fee (₹)</label>
              <input
                type="number"
                {...register('totalFee', { required: true, min: 0 })}
                placeholder="e.g. 50000"
                className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#CA6357]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wide mb-1.5">Computed Total</label>
              <div className={`border rounded-xl px-3 py-2.5 text-sm font-bold ${computedTotal > 0 ? 'border-[#22A66E] text-[#22A66E] bg-[#E8F8F2]' : 'border-[#E2E8F0] text-[#94A3B8]'}`}>
                ₹{computedTotal.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Installments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#1E293B]">Installments</p>
              <button
                type="button"
                onClick={() => append({
                  installmentNumber: fields.length + 1,
                  label: `Installment ${fields.length + 1}`,
                  amount: '',
                  weeksAccess: '',
                  dueAfterWeek: '',
                })}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CA6357] hover:bg-[#FDEFEE] px-3 py-1.5 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Installment
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="border border-[#E2E8F0] rounded-2xl p-4 space-y-3 bg-[#FAFBFC]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#CA6357] bg-[#FDEFEE] px-2.5 py-1 rounded-full">#{idx + 1}</span>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(idx)} className="text-[#D96C5F] hover:bg-[#FEE2E2] p-1.5 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1">Label</label>
                      <input
                        {...register(`installments.${idx}.label`)}
                        placeholder={idx === 0 ? 'e.g. First Installment' : `e.g. Installment ${idx + 1}`}
                        className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1">Amount (₹) *</label>
                      <input
                        type="number"
                        {...register(`installments.${idx}.amount`, { required: true, min: 0 })}
                        placeholder="e.g. 10000"
                        className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1">Weeks Access *</label>
                      <input
                        type="number"
                        {...register(`installments.${idx}.weeksAccess`, { required: true, min: 0 })}
                        placeholder="e.g. 4"
                        className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357] bg-white"
                      />
                      <p className="text-[10px] text-[#94A3B8] mt-0.5">Weeks unlocked when paid</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1">Due</label>
                      {idx === 0 ? (
                        <div className="border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#94A3B8] bg-[#F8F9FB]">
                          Immediately (at enrollment)
                        </div>
                      ) : (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] font-medium pointer-events-none">After Week</span>
                          <input
                            type="number"
                            {...register(`installments.${idx}.dueAfterWeek`, { min: 1 })}
                            placeholder="e.g. 4"
                            className="w-full border border-[#E2E8F0] rounded-xl pl-24 pr-3 py-2 text-sm focus:outline-none focus:border-[#CA6357] bg-white"
                          />
                        </div>
                      )}
                      <p className="text-[10px] text-[#94A3B8] mt-0.5">
                        {idx === 0 ? 'Paid before course starts' : 'Student must pay before entering next block'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-[#475569] uppercase tracking-wide mb-1.5">Internal Notes (optional)</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Any notes about this fee structure…"
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#CA6357] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Fee Structure
          </button>
        </form>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function FeeStructurePage() {
  const [editing, setEditing] = useState(null); // { course, existing }
  const [expandedAccount, setExpandedAccount] = useState(null);

  const { data: structures = [], isLoading: structuresLoading } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: feesService.getAllStructures,
  });

  const { data: feeAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['fee-accounts'],
    queryFn: () => feesService.getAllFeeAccounts(),
  });

  const { data: allCoursesRaw = [] } = useQuery({
    queryKey: ['fee-all-courses'],
    queryFn: courseService.getAll,
  });

  const structureMap = {};
  structures.forEach(s => { structureMap[s.course?._id ?? s.course] = s; });

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">Admin</p>
            <h2 className="text-2xl font-bold text-white">Fee Management</h2>
            <p className="text-white/60 text-sm mt-0.5">Configure fee structures per course · Review student payments</p>
          </div>
        </div>
      </div>

      {/* Course fee structures */}
      <div>
        <h3 className="text-base font-bold text-[#1E293B] mb-3">Fee Structures by Course</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {allCoursesRaw.map((course) => {
            const structure = structureMap[course._id];
            return (
              <div
                key={course._id}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex flex-col gap-4"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FDEFEE] flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-[#CA6357]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1E293B]">{course.name}</p>
                      <p className="text-[11px] text-[#94A3B8]">{course.slug}</p>
                    </div>
                  </div>
                  {structure ? (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#E8F8F2] text-[#22A66E] flex-shrink-0">Configured</span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#94A3B8] flex-shrink-0">Not set</span>
                  )}
                </div>

                {structure && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#94A3B8]">Total fee</span>
                      <span className="font-bold text-[#1E293B]">₹{structure.totalFee?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#94A3B8]">Installments</span>
                      <span className="font-semibold text-[#475569]">{structure.installments?.length}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setEditing({ course, existing: structure ?? null })}
                  className="text-xs font-semibold text-[#CA6357] hover:bg-[#FDEFEE] py-2 rounded-xl transition-colors"
                >
                  {structure ? 'Edit Structure' : '+ Set Up Fee Structure'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Student fee accounts overview */}
      <div>
        <h3 className="text-base font-bold text-[#1E293B] mb-3">Student Fee Accounts</h3>

        {accountsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" />
          </div>
        ) : feeAccounts.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-[#E2E8F0]">
            <IndianRupee className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-[#94A3B8]">No student fee accounts yet. Accounts are created automatically when a student is approved.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0]" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            {/* Summary stats */}
            <div className="grid grid-cols-4 divide-x divide-[#F1F5F9] border-b border-[#F1F5F9]">
              {['pending', 'partial', 'paid', 'overdue'].map(status => {
                const cfg = FEE_STATUS_CFG[status];
                const count = feeAccounts.filter(a => a.feeStatus === status).length;
                return (
                  <div key={status} className="p-4 text-center">
                    <p className="text-xl font-bold" style={{ color: cfg.color }}>{count}</p>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5 capitalize">{cfg.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="divide-y divide-[#F8F9FB]">
              {feeAccounts.map((account) => {
                const cfg = FEE_STATUS_CFG[account.feeStatus] ?? FEE_STATUS_CFG.pending;
                const isOpen = expandedAccount === account._id;
                return (
                  <div key={account._id}>
                    <button
                      onClick={() => setExpandedAccount(isOpen ? null : account._id)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#F8F9FB] transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#FDEFEE] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#CA6357]">
                        {account.student?.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1E293B]">{account.student?.user?.name ?? '—'}</p>
                        <p className="text-xs text-[#94A3B8]">{account.student?.user?.email ?? '—'} · {account.course?.name}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[#1E293B]">₹{account.totalPaid?.toLocaleString('en-IN')} <span className="text-[#94A3B8] font-normal">/ ₹{account.totalFee?.toLocaleString('en-IN')}</span></p>
                        <p className="text-xs text-[#94A3B8]">Up to Week {account.accessValidUntilWeek}</p>
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-2" style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />}
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 space-y-2 bg-[#FAFBFC]">
                        {account.installments?.map((inst) => {
                          const instCfg = {
                            upcoming:  { label: 'Upcoming',  color: '#94A3B8',  bg: '#F1F5F9' },
                            due:       { label: 'Due',       color: '#F59E0B',  bg: '#FFFBEB' },
                            submitted: { label: 'Submitted', color: '#3B82F6',  bg: '#EFF6FF' },
                            paid:      { label: 'Paid',      color: '#22A66E',  bg: '#E8F8F2' },
                            overdue:   { label: 'Overdue',   color: '#D96C5F',  bg: '#FEE2E2' },
                            waived:    { label: 'Waived',    color: '#7C6AF2',  bg: '#F0EDFE' },
                          }[inst.status] ?? { label: inst.status, color: '#94A3B8', bg: '#F1F5F9' };

                          return (
                            <div key={inst.installmentNumber} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-[#F1F5F9]">
                              <div>
                                <p className="text-sm font-semibold text-[#1E293B]">{inst.label || `Installment ${inst.installmentNumber}`}</p>
                                <p className="text-xs text-[#94A3B8]">Due {new Date(inst.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {inst.weeksAccess} weeks access</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-[#1E293B]">₹{inst.amount?.toLocaleString('en-IN')}</p>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: instCfg.bg, color: instCfg.color }}>
                                  {instCfg.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {editing && (
        <FeeStructureForm
          course={editing.course}
          existing={editing.existing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
