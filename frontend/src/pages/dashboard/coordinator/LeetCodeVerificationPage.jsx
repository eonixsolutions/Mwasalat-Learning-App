import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Code2, CheckCircle2, XCircle, ExternalLink, Loader2,
  Search, ChevronDown, ChevronUp, Lock, ArrowRightCircle,
} from 'lucide-react';
import { leetcodeService } from '../../../services/leetcode.service.js';

const DIFFICULTY_STYLE = {
  easy:   { label: 'Easy',   color: '#22A66E', bg: '#E8F8F2' },
  medium: { label: 'Medium', color: '#F59E0B', bg: '#FFFBEB' },
  hard:   { label: 'Hard',   color: '#C76D64', bg: '#FDEFEE' },
};

function VerifyForm({ submission, onSuccess }) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch } = useForm({ defaultValues: { status: 'verified' } });
  const status = watch('status');

  const mutation = useMutation({
    mutationFn: ({ status, rejectionNote }) =>
      leetcodeService.verifySubmission(submission._id, status, rejectionNote),
    onSuccess: () => {
      toast.success(status === 'verified' ? 'Submission verified!' : 'Submission rejected');
      qc.invalidateQueries({ queryKey: ['leetcode', 'pending'] });
      onSuccess?.();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Action failed'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3 pt-3 border-t border-[#F1F5F9]">
      <div className="flex gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" value="verified" {...register('status')} className="accent-[#22A66E]" />
          <span className="text-sm font-semibold text-[#22A66E]">Verify</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" value="rejected" {...register('status')} className="accent-[#C76D64]" />
          <span className="text-sm font-semibold text-[#C76D64]">Reject</span>
        </label>
      </div>

      {status === 'rejected' && (
        <textarea
          {...register('rejectionNote')}
          placeholder="Reason for rejection (optional but helpful)"
          rows={2}
          className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357] text-[#1E293B] resize-none"
        />
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className={`inline-flex items-center gap-2 font-semibold px-4 py-2 rounded-xl transition-colors text-sm disabled:opacity-60 ${
          status === 'verified'
            ? 'bg-[#22A66E] hover:bg-[#1a8a5a] text-white'
            : 'bg-[#C76D64] hover:bg-[#b85548] text-white'
        }`}
      >
        {mutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : status === 'verified' ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <XCircle className="w-4 h-4" />
        )}
        {status === 'verified' ? 'Mark Verified' : 'Mark Rejected'}
      </button>
    </form>
  );
}

function SwitchListButton({ studentId, studentName, qc }) {
  const [confirming, setConfirming] = useState(false);

  const mutation = useMutation({
    mutationFn: () => leetcodeService.switchStudentList(studentId),
    onSuccess: () => {
      toast.success(`${studentName} switched to JavaScript list`);
      qc.invalidateQueries({ queryKey: ['leetcode', 'pending'] });
      setConfirming(false);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Failed to switch list'),
  });

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CA6357] hover:text-[#A94E43] transition-colors"
      >
        <ArrowRightCircle className="w-3.5 h-3.5" />
        Switch to JS List
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <p className="text-xs text-[#475569]">Move to JavaScript list?</p>
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="inline-flex items-center gap-1 bg-[#CA6357] hover:bg-[#b85548] text-white text-xs font-semibold px-2.5 py-1 rounded-lg disabled:opacity-60"
      >
        {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
      </button>
      <button onClick={() => setConfirming(false)} className="text-xs text-[#94A3B8] hover:text-[#475569]">
        Cancel
      </button>
    </div>
  );
}

function SubmissionCard({ submission }) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();

  const studentName = submission.student?.user?.name ?? 'Unknown Student';
  const studentEmail = submission.student?.user?.email ?? '';
  const problem = submission.problem;
  const ds = problem ? DIFFICULTY_STYLE[problem.difficulty] : null;

  const holdMutation = useMutation({
    mutationFn: () => leetcodeService.toggleHold(submission.student._id),
    onSuccess: (data) => {
      toast.success(`Hold ${data.leetcodeHold ? 'activated' : 'removed'} for ${studentName}`);
      qc.invalidateQueries({ queryKey: ['leetcode', 'pending'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Action failed'),
  });

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0]" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Student avatar */}
        <div className="w-9 h-9 rounded-full bg-[#FDEFEE] text-[#CA6357] font-bold text-sm flex items-center justify-center flex-shrink-0">
          {studentName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1E293B] truncate">{studentName}</p>
          <p className="text-xs text-[#94A3B8] truncate">{studentEmail}</p>
        </div>

        <div className="text-right flex-shrink-0">
          {problem && (
            <>
              <p className="text-sm font-semibold text-[#1E293B]">#{problem.order} {problem.title}</p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                {ds && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: ds.bg, color: ds.color }}
                  >
                    {ds.label}
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  problem?.list === 'javascript'
                    ? 'text-[#F59E0B] bg-[#FFFBEB]'
                    : 'text-[#CA6357] bg-[#FDEFEE]'
                }`}>
                  {problem?.list === 'javascript' ? 'JavaScript' : 'General'}
                </span>
              </div>
            </>
          )}
        </div>

        {expanded ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />}
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="bg-[#F8F9FB] rounded-xl p-3 flex items-center justify-between gap-3">
            {submission.student?.leetcodeUsername ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#475569]">LeetCode profile</p>
                <a
                  href={`https://leetcode.com/u/${submission.student.leetcodeUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-[#CA6357] hover:underline inline-flex items-center gap-1"
                >
                  {submission.student.leetcodeUsername} <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                </a>
                <p className="text-xs text-[#94A3B8]">Check their accepted submissions list to verify.</p>
              </div>
            ) : (
              <p className="text-xs text-[#94A3B8]">Student hasn't set their LeetCode username yet.</p>
            )}
          </div>

          {problem?.leetcodeUrl && (
            <a
              href={problem.leetcodeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#CA6357] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View problem on LeetCode
            </a>
          )}

          <VerifyForm submission={submission} />

          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <p className="text-xs text-[#94A3B8]">
              Submitted {new Date(submission.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
            <div className="flex items-center gap-3">
              {submission.student?.leetcodeList !== 'javascript' && (
                <SwitchListButton studentId={submission.student?._id} studentName={studentName} qc={qc} />
              )}
              <button
                onClick={() => holdMutation.mutate()}
                disabled={holdMutation.isPending}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C76D64] hover:text-[#A94E43] transition-colors disabled:opacity-60"
              >
                {holdMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                Toggle Hold
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeetCodeVerificationPage() {
  const [search, setSearch] = useState('');

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['leetcode', 'pending'],
    queryFn: leetcodeService.getPendingSubmissions,
    refetchInterval: 30_000,
  });

  const filtered = submissions.filter((s) => {
    if (!search) return true;
    const name = s.student?.user?.name?.toLowerCase() ?? '';
    const email = s.student?.user?.email?.toLowerCase() ?? '';
    const title = s.problem?.title?.toLowerCase() ?? '';
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q) || title.includes(q);
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}>
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">LeetCode Verifications</h1>
          <p className="text-white/70 text-sm">Review student submissions and manage holds</p>
        </div>
      </div>

      {/* Count badge */}
      {submissions.length > 0 && (
        <div className="inline-flex items-center gap-2 bg-[#FFFBEB] border border-[#FCD34D] text-[#F59E0B] text-sm font-semibold px-4 py-2 rounded-xl">
          <Code2 className="w-4 h-4" />
          {submissions.length} pending submission{submissions.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name, email, or problem…"
          className="w-full pl-9 pr-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#CA6357] text-[#1E293B] bg-white"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <CheckCircle2 className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-base font-bold text-[#1E293B]">All clear!</p>
          <p className="text-sm text-[#94A3B8] mt-1">No pending LeetCode submissions to review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <SubmissionCard key={s._id} submission={s} />
          ))}
        </div>
      )}
    </div>
  );
}
