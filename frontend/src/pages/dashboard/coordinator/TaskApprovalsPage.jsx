import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck, Loader2, CheckCircle2, ExternalLink,
  User, BookOpen, Github, FileText, Search, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { progressService } from '../../../services/progress.service.js';

const SUBMISSION_ICON = {
  github:   { icon: Github,   color: '#1E293B', bg: '#F1F5F9' },
  document: { icon: FileText, color: '#CA6357', bg: '#FDEFEE' },
  in_class: { icon: CheckCircle2, color: '#22A66E', bg: '#E8F8F2' },
};

function SubmissionCard({ item, onApprove, approving }) {
  const [expanded, setExpanded] = useState(false);
  const student = item.student?.user;
  const lesson  = item.lesson;
  const subInfo = SUBMISSION_ICON[lesson?.submissionType ?? 'document'];

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0]" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div
        className="flex items-start gap-4 p-4 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Student avatar */}
        <div className="w-10 h-10 rounded-xl bg-[#FDEFEE] flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-[#CA6357]" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1E293B] truncate">{student?.name ?? 'Unknown'}</p>
          <p className="text-xs text-[#94A3B8] truncate">{student?.email}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <div className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: subInfo.bg, color: subInfo.color }}>
              <subInfo.icon className="w-3 h-3" />
              {lesson?.title ?? '—'}
            </div>
            <span className="text-xs text-[#94A3B8]">
              Week {lesson?.weekNumber} · Day {lesson?.dayNumber}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-[#94A3B8]">
            {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
          </span>
          <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[#F1F5F9] pt-3 space-y-3">
          {item.submissionUrl && (
            <a
              href={item.submissionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#CA6357] hover:text-[#A94E43] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Submission
            </a>
          )}

          {lesson?.part && (
            <p className="text-xs text-[#94A3B8]">Part {lesson.part}</p>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); onApprove(item._id); }}
            disabled={approving}
            className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-5 py-2 rounded-xl transition-colors text-sm disabled:opacity-60"
          >
            {approving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <CheckCircle2 className="w-4 h-4" />}
            Approve Task
          </button>
        </div>
      )}
    </div>
  );
}

export default function TaskApprovalsPage() {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['progress', 'pending'],
    queryFn: progressService.getPendingApprovals,
    refetchInterval: 30_000,
  });

  const approveMutation = useMutation({
    mutationFn: (progressId) => progressService.approveTask(progressId),
    onSuccess: () => {
      toast.success('Task approved!');
      qc.invalidateQueries({ queryKey: ['progress', 'pending'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Approval failed'),
  });

  const filtered = pending.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.student?.user?.name?.toLowerCase().includes(s) ||
      item.student?.user?.email?.toLowerCase().includes(s) ||
      item.lesson?.title?.toLowerCase().includes(s)
    );
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
            <ClipboardCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-0.5">Coordinator</p>
            <h1 className="text-xl font-bold text-white">Task Approvals</h1>
          </div>
          {!isLoading && (
            <div className="ml-auto bg-[#C76D64] text-white text-sm font-bold px-3 py-1.5 rounded-xl">
              {pending.length} pending
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student or lesson..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#CA6357] bg-white"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <CheckCircle2 className="w-10 h-10 text-[#B4E9CF] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-base font-bold text-[#1E293B]">All caught up!</p>
          <p className="text-sm text-[#94A3B8] mt-1">No pending task submissions at the moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <SubmissionCard
              key={item._id}
              item={item}
              onApprove={(id) => approveMutation.mutate(id)}
              approving={approveMutation.isPending && approveMutation.variables === item._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
