import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Code2, ExternalLink, Loader2, Lock, Unlock, ChevronDown, ChevronUp,
  User, AlertTriangle, CheckCircle2, List, X, Lightbulb,
} from 'lucide-react';
import { staffService } from '../../../services/staff.service.js';
import { leetcodeService } from '../../../services/leetcode.service.js';

// ── Shared color-dot primitives ───────────────────────────────────────────────

const DOT_CONFIG = {
  0:    { bg: '#22C55E', label: 'On time' },
  1:    { bg: '#EAB308', label: '1 day late' },
  2:    { bg: '#F97316', label: '2 days late' },
  null: { bg: null,      label: 'Not submitted' },
};

function DaysLateDot({ daysLate, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  if (daysLate === null || daysLate === undefined) {
    return <span className={`${sizeClass} rounded-full border-2 border-[#CBD5E1] inline-block flex-shrink-0`} title="Not submitted" />;
  }
  const { bg, label } = daysLate <= 2 ? DOT_CONFIG[daysLate] : { bg: '#EF4444', label: `${daysLate} days late` };
  return <span className={`${sizeClass} rounded-full inline-block flex-shrink-0`} style={{ backgroundColor: bg }} title={label} />;
}

function DaysLateLabel({ daysLate }) {
  if (daysLate === null || daysLate === undefined) return <span className="text-[10px] text-[#94A3B8]">Missed</span>;
  const config =
    daysLate === 0 ? { color: '#16A34A', label: 'On time' }
    : daysLate === 1 ? { color: '#CA8A04', label: '1 day late' }
    : daysLate === 2 ? { color: '#EA580C', label: '2 days late' }
    : { color: '#DC2626', label: `${daysLate}d late` };
  return <span className="text-[10px] font-semibold" style={{ color: config.color }}>{config.label}</span>;
}

// ── Student full-detail modal ─────────────────────────────────────────────────

function StudentDetailModal({ studentId, studentName, leetcodeUsername, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['leetcode', 'student', studentId],
    queryFn: () => leetcodeService.getStudentProgress(studentId),
    enabled: !!studentId,
  });

  const history = data?.history ?? [];
  const todayProblem = data?.todayProblem ?? null;
  const allProblems = todayProblem ? [...history, todayProblem] : history;
  const [activeList, setActiveList] = useState('general');

  const filtered = allProblems.filter((p) => p.list === activeList);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <div>
            <p className="text-xs text-[#94A3B8] uppercase tracking-wider font-bold">LeetCode Progress</p>
            <p className="text-base font-bold text-[#1E293B]">{studentName}</p>
            {leetcodeUsername ? (
              <a
                href={`https://leetcode.com/u/${leetcodeUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#CA6357] hover:underline mt-0.5"
              >
                <ExternalLink className="w-3 h-3" />
                leetcode.com/u/{leetcodeUsername}
              </a>
            ) : (
              <p className="text-xs text-[#94A3B8] italic mt-0.5">No LeetCode username set</p>
            )}
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#475569] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List tabs */}
        <div className="px-5 pt-4 flex gap-2">
          {['general', 'javascript'].map((key) => {
            const label = key === 'general' ? 'General' : 'JavaScript';
            const count = allProblems.filter((p) => p.list === key).length;
            const done  = allProblems.filter((p) => p.list === key && p.submission).length;
            return (
              <button
                key={key}
                onClick={() => setActiveList(key)}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all ${
                  activeList === key
                    ? 'bg-[#CA6357] text-white'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                {label} <span className="opacity-70 text-xs font-normal">({done}/{count})</span>
              </button>
            );
          })}
        </div>

        {/* Problem list */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-[#94A3B8]">No problems in this list yet.</div>
          ) : (
            [...filtered].reverse().map((p) => {
              const sub = p.submission;
              const isToday = todayProblem && String(p._id) === String(todayProblem._id);
              return (
                <div
                  key={p._id}
                  className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${
                    isToday ? 'border-[#A94E43] bg-[#FDEFEE]' : 'border-[#E2E8F0] bg-white'
                  }`}
                >
                  <span className="font-mono text-xs text-[#94A3B8] w-7 flex-shrink-0 pt-0.5">{p.order}</span>
                  <DaysLateDot daysLate={sub?.daysLate ?? null} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#1E293B]">{p.title}</p>
                      {isToday && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#CA6357] bg-[#F2B3AC]/30 px-1.5 py-0.5 rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    {p.topic && <p className="text-[10px] text-[#94A3B8]">{p.topic}</p>}
                    <div className="flex items-center gap-3 mt-1.5">
                      <DaysLateLabel daysLate={sub?.daysLate ?? null} />
                      <a
                        href={p.leetcodeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-[#CA6357] hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> LeetCode
                      </a>
                    </div>
                    {p.hints?.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-[10px] text-[#94A3B8] cursor-pointer flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" /> {p.hints.length} hint{p.hints.length > 1 ? 's' : ''}
                        </summary>
                        <ul className="mt-1 space-y-1 pl-2">
                          {p.hints.map((h, i) => (
                            <li key={i} className="text-[10px] text-[#78350F]">{i + 1}. {h}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── Student row ───────────────────────────────────────────────────────────────

function StudentRow({ student, batchId }) {
  const qc = useQueryClient();
  const [showDetail, setShowDetail] = useState(false);

  const holdMutation = useMutation({
    mutationFn: () => leetcodeService.toggleHold(student.studentId),
    onSuccess: (data) => {
      toast.success(`Hold ${data.leetcodeHold ? 'activated' : 'removed'} for ${student.name}`);
      qc.invalidateQueries({ queryKey: ['leetcode', 'batch', batchId] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Failed'),
  });

  const switchMutation = useMutation({
    mutationFn: () => leetcodeService.switchStudentList(student.studentId),
    onSuccess: () => {
      toast.success(`${student.name} switched to JavaScript list`);
      qc.invalidateQueries({ queryKey: ['leetcode', 'batch', batchId] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Failed'),
  });

  const { stats, recent } = student;
  const missed = (stats?.submitted != null && student.leetcodeList)
    ? 0  // we don't have totalAssigned in the summary; just show dots
    : 0;

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-3">
        {/* Student header */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FDEFEE] flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-[#CA6357]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-[#1E293B]">{student.name}</p>
              {student.leetcodeHold && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#C76D64] bg-[#FFF8F7] border border-[#F2B3AC] px-2 py-0.5 rounded-full">
                  <Lock className="w-2.5 h-2.5" /> On Hold
                </span>
              )}
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                student.leetcodeList === 'javascript'
                  ? 'text-[#F59E0B] bg-[#F59E0B]/10'
                  : 'text-[#CA6357] bg-[#FDEFEE]'
              }`}>
                {student.leetcodeList === 'javascript' ? 'JS List' : 'General'}
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">{student.email}</p>
            {student.leetcodeUsername ? (
              <a
                href={`https://leetcode.com/u/${student.leetcodeUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#CA6357] hover:underline mt-0.5"
              >
                <ExternalLink className="w-3 h-3" />
                leetcode.com/u/{student.leetcodeUsername}
              </a>
            ) : (
              <p className="text-xs text-[#94A3B8] mt-0.5 italic">No LeetCode username set</p>
            )}
          </div>
        </div>

        {/* Recent submissions timeline */}
        {recent?.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Recent (newest first)</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {recent.map((r, i) => (
                <DaysLateDot key={i} daysLate={r.daysLate} size="sm" />
              ))}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatChip label="Done" value={stats?.submitted ?? 0} color="#CA6357" bg="#FDEFEE" />
          <StatChip label="On time" value={stats?.onTime ?? 0} color="#16A34A" bg="#DCFCE7" />
          <StatChip label="1d late" value={stats?.late1 ?? 0} color="#CA8A04" bg="#FEF9C3" />
          <StatChip label="2d late" value={stats?.late2 ?? 0} color="#EA580C" bg="#FFEDD5" />
          <StatChip label="3d+ late" value={stats?.lateMore ?? 0} color="#DC2626" bg="#FEE2E2" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[#F1F5F9]">
          <button
            onClick={() => setShowDetail(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CA6357] hover:text-[#A94E43] transition-colors"
          >
            <List className="w-3.5 h-3.5" /> View Full List
          </button>

          <div className="ml-auto flex items-center gap-2">
            {student.leetcodeList === 'general' && (
              <button
                onClick={() => {
                  if (window.confirm(`Switch ${student.name} to the JavaScript list?`)) switchMutation.mutate();
                }}
                disabled={switchMutation.isPending}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#475569] hover:text-[#1E293B] transition-colors disabled:opacity-50"
              >
                {switchMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Code2 className="w-3.5 h-3.5" />}
                Switch to JS
              </button>
            )}
            <button
              onClick={() => holdMutation.mutate()}
              disabled={holdMutation.isPending}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                student.leetcodeHold
                  ? 'text-[#22A66E] hover:text-[#16A34A]'
                  : 'text-[#C76D64] hover:text-[#A94E43]'
              }`}
            >
              {holdMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : student.leetcodeHold ? (
                <><Unlock className="w-3.5 h-3.5" /> Remove Hold</>
              ) : (
                <><Lock className="w-3.5 h-3.5" /> Put on Hold</>
              )}
            </button>
          </div>
        </div>
      </div>

      {showDetail && (
        <StudentDetailModal
          studentId={student.studentId}
          studentName={student.name}
          leetcodeUsername={student.leetcodeUsername}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}

function StatChip({ label, value, color, bg }) {
  return (
    <div className="flex items-center gap-1 rounded-lg px-2.5 py-1" style={{ backgroundColor: bg }}>
      <span className="text-xs font-bold" style={{ color }}>{value}</span>
      <span className="text-[10px]" style={{ color }}>{label}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MentorLeetCodePage() {
  const [activeBatchId, setActiveBatchId] = useState(null);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['staff', 'me'],
    queryFn: staffService.getMyProfile,
    onSuccess: (d) => {
      if (!activeBatchId && d?.batches?.length) {
        setActiveBatchId(d.batches[0]._id);
      }
    },
  });

  const batches = profile?.batches ?? [];

  // Auto-select first batch once loaded
  const selectedBatchId = activeBatchId ?? batches[0]?._id ?? null;

  const { data: batchStudents = [], isLoading: batchLoading } = useQuery({
    queryKey: ['leetcode', 'batch', selectedBatchId],
    queryFn: () => leetcodeService.getBatchProgress(selectedBatchId),
    enabled: !!selectedBatchId,
  });

  const selectedBatch = batches.find((b) => b._id === selectedBatchId);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-60">
        <Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" />
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-3">
        <AlertTriangle className="w-10 h-10 text-[#CBD5E1]" strokeWidth={1.5} />
        <p className="text-base font-bold text-[#1E293B]">No batches assigned</p>
        <p className="text-sm text-[#94A3B8]">Ask your coordinator to assign you to a batch.</p>
      </div>
    );
  }

  const onHold    = batchStudents.filter((s) => s.leetcodeHold).length;
  const noUsername = batchStudents.filter((s) => !s.leetcodeUsername).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >
        <div className="relative z-10">
          <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">LeetCode Monitor</p>
          <h2 className="text-2xl font-bold text-white mb-1">{selectedBatch?.name ?? 'Batch'}</h2>
          <p className="text-white/60 text-sm">
            {batchStudents.length} students · {onHold} on hold
            {noUsername > 0 && ` · ${noUsername} missing username`}
          </p>
        </div>
      </div>

      {/* Color legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
        <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mr-1">Color guide</p>
        {[
          { daysLate: 0,    label: 'On time' },
          { daysLate: 1,    label: '1 day late' },
          { daysLate: 2,    label: '2 days late' },
          { daysLate: 99,   label: '3+ days late' },
          { daysLate: null, label: 'Not submitted' },
        ].map(({ daysLate, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <DaysLateDot daysLate={daysLate} size="sm" />
            <span className="text-xs text-[#64748B]">{label}</span>
          </div>
        ))}
      </div>

      {/* Batch tabs */}
      {batches.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {batches.map((b) => (
            <button
              key={b._id}
              onClick={() => setActiveBatchId(b._id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedBatchId === b._id
                  ? 'bg-[#CA6357] text-white'
                  : 'bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#CA6357]'
              }`}
              style={selectedBatchId !== b._id ? { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } : {}}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Students list */}
      {batchLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" />
        </div>
      ) : batchStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center">
          <Code2 className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm font-bold text-[#1E293B]">No students in this batch yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {batchStudents.map((student) => (
            <StudentRow key={student.studentId} student={student} batchId={selectedBatchId} />
          ))}
        </div>
      )}
    </div>
  );
}
