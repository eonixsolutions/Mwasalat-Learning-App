import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Users, UserCheck, UserX, Loader2, XCircle,
  CheckCircle2, Clock, AlertCircle, X, Briefcase,
  Calendar, ChevronLeft, ChevronRight, Search,
} from 'lucide-react';
import { coordinatorService } from '../../../services/coordinator.service.js';

const APPROVAL_CONFIG = {
  true:  { label: 'Approved', color: '#22A66E', bg: '#E8F8F2' },
  false: { label: 'Pending',  color: '#F59E0B', bg: '#FFFBEB' },
};

function InitialsAvatar({ name }) {
  const initials = (name || '?').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-[#FDEFEE] text-[#CA6357] font-bold text-sm flex items-center justify-center flex-shrink-0">
      {initials}
    </div>
  );
}

function RejectModal({ coordinator, onConfirm, onClose, isPending }) {
  const [reason, setReason] = useState('');
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md" style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.12)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-bold text-[#1E293B]">Reject Coordinator</p>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F8F9FB]">
              <X className="w-4 h-4 text-[#94A3B8]" />
            </button>
          </div>
          <p className="text-sm text-[#475569] mb-4">
            Rejecting <strong>{coordinator.user?.name}</strong>. Optionally provide a reason.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection (optional)..."
            rows={3}
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#CA6357] focus:ring-1 focus:ring-[#CA6357] resize-none mb-4"
          />
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 border border-[#E2E8F0] text-[#475569] font-medium px-4 py-2 rounded-xl hover:bg-[#F8F9FB] transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(reason)}
              disabled={isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#C76D64] hover:bg-[#A94E43] text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
              Reject
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CoordinatorsPage() {
  const queryClient = useQueryClient();
  const [approvalFilter, setApprovalFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rejectTarget, setRejectTarget] = useState(null);

  const params = { page, limit: 15 };
  if (approvalFilter !== '') params.isApproved = approvalFilter;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['coordinators', params],
    queryFn: () => coordinatorService.getAll(params),
  });

  const coordinators = data?.coordinators ?? [];
  const pagination = data?.pagination ?? { total: 0, pages: 1 };

  const filtered = search.trim()
    ? coordinators.filter((c) => {
        const q = search.toLowerCase();
        return c.user?.name?.toLowerCase().includes(q) || c.user?.email?.toLowerCase().includes(q);
      })
    : coordinators;

  const pendingCount = coordinators.filter((c) => !c.isApproved).length;

  const approveMutation = useMutation({
    mutationFn: coordinatorService.approve,
    onSuccess: () => {
      toast.success('Coordinator approved');
      queryClient.invalidateQueries({ queryKey: ['coordinators'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: coordinatorService.reject,
    onSuccess: () => {
      toast.success('Coordinator rejected');
      queryClient.invalidateQueries({ queryKey: ['coordinators'] });
      setRejectTarget(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to reject'),
  });

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <Users className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">Staff Management</p>
            <h2 className="text-2xl font-bold text-white mb-1">Branch Coordinators</h2>
            <p className="text-white/60 text-sm">
              {pagination.total} coordinator{pagination.total !== 1 ? 's' : ''} registered
              {pendingCount > 0 && ` · ${pendingCount} pending approval`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Pending alert ──────────────────────────────────────────── */}
      {pendingCount > 0 && !approvalFilter && (
        <div className="flex items-center gap-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl px-5 py-3">
          <AlertCircle className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
          <p className="text-sm text-[#92400E]">
            <strong>{pendingCount} coordinator{pendingCount > 1 ? 's' : ''}</strong> waiting for approval.
          </p>
          <button
            onClick={() => setApprovalFilter('false')}
            className="ml-auto text-xs font-semibold text-[#F59E0B] hover:text-[#D97706] transition-colors"
          >
            View pending
          </button>
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#CA6357] focus:ring-1 focus:ring-[#CA6357]"
            />
          </div>
          <select
            value={approvalFilter}
            onChange={(e) => { setApprovalFilter(e.target.value); setPage(1); }}
            className="pl-3 pr-8 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-[#CA6357] bg-white"
          >
            <option value="">All</option>
            <option value="true">Approved</option>
            <option value="false">Pending</option>
          </select>
          {(approvalFilter || search) && (
            <button
              onClick={() => { setApprovalFilter(''); setSearch(''); setPage(1); }}
              className="inline-flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#C76D64] transition-colors px-2"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── List ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <XCircle className="w-10 h-10 text-[#FECACA]" strokeWidth={1.5} />
            <p className="text-sm text-[#94A3B8]">Failed to load coordinators.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Users className="w-10 h-10 text-[#CBD5E1]" strokeWidth={1.5} />
            <p className="text-base font-bold text-[#1E293B]">No coordinators found</p>
            <p className="text-sm text-[#94A3B8]">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#F8F9FB]">
              {filtered.map((coordinator) => {
                const info = coordinator.user ?? {};
                const isApproved = coordinator.isApproved;
                const appCfg = APPROVAL_CONFIG[String(isApproved)];
                return (
                  <div key={coordinator._id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#FAFAFA] transition-colors">
                    <InitialsAvatar name={info.name} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#1E293B] truncate">{info.name ?? '—'}</p>
                        <span
                          className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: appCfg.bg, color: appCfg.color }}
                        >
                          {appCfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#94A3B8] truncate">{info.email ?? '—'}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {coordinator.designation && (
                          <span className="inline-flex items-center gap-1 text-xs text-[#475569]">
                            <Briefcase className="w-3 h-3" /> {coordinator.designation}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs text-[#94A3B8]">
                          <Calendar className="w-3 h-3" />
                          {new Date(coordinator.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {coordinator.rejectionReason && (
                          <span className="text-xs text-[#C76D64]">Rejected: {coordinator.rejectionReason}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      {!isApproved && (
                        <button
                          onClick={() => approveMutation.mutate(coordinator._id)}
                          disabled={approveMutation.isPending}
                          className="inline-flex items-center gap-1.5 bg-[#E8F8F2] hover:bg-[#22A66E] text-[#22A66E] hover:text-white font-semibold px-3 py-1.5 rounded-xl transition-colors text-xs disabled:opacity-60"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                      )}
                      {!isApproved && (
                        <button
                          onClick={() => setRejectTarget(coordinator)}
                          className="inline-flex items-center gap-1.5 bg-[#FDEFEE] hover:bg-[#C76D64] text-[#C76D64] hover:text-white font-semibold px-3 py-1.5 rounded-xl transition-colors text-xs"
                        >
                          <UserX className="w-3.5 h-3.5" /> Reject
                        </button>
                      )}
                      {isApproved && (
                        <div className="flex items-center gap-1.5 text-xs text-[#22A66E]">
                          <UserCheck className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            {coordinator.approvedBy?.name
                              ? `by ${coordinator.approvedBy.name}`
                              : 'Approved'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#F1F5F9]">
                <p className="text-xs text-[#94A3B8]">
                  Page {pagination.page} of {pagination.pages} · {pagination.total} total
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page <= 1}
                    className="p-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#CA6357] disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#475569]" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={pagination.page >= pagination.pages}
                    className="p-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#CA6357] disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-[#475569]" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Reject modal ───────────────────────────────────────────── */}
      {rejectTarget && (
        <RejectModal
          coordinator={rejectTarget}
          onClose={() => setRejectTarget(null)}
          isPending={rejectMutation.isPending}
          onConfirm={(reason) => rejectMutation.mutate({ id: rejectTarget._id, reason })}
        />
      )}
    </div>
  );
}
