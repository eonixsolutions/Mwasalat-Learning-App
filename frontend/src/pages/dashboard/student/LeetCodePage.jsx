import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Code2, ExternalLink, CheckCircle2, Loader2, Send, Lock,
  Lightbulb, ChevronDown, ChevronUp, CalendarOff, Trophy, User, Edit2,
} from 'lucide-react';
import { leetcodeService } from '../../../services/leetcode.service.js';

// Color dot representing submission timing
function DaysLateDot({ daysLate, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  if (daysLate === null || daysLate === undefined) {
    return (
      <span
        className={`${sizeClass} rounded-full border-2 border-[#CBD5E1] inline-block flex-shrink-0`}
        title="Not submitted"
      />
    );
  }
  const config =
    daysLate === 0 ? { bg: '#22C55E', label: 'Submitted on time' }
    : daysLate === 1 ? { bg: '#EAB308', label: '1 day late' }
    : daysLate === 2 ? { bg: '#F97316', label: '2 days late' }
    : { bg: '#EF4444', label: `${daysLate} days late` };

  return (
    <span
      className={`${sizeClass} rounded-full inline-block flex-shrink-0`}
      style={{ backgroundColor: config.bg }}
      title={config.label}
    />
  );
}

function DaysLateLabel({ daysLate }) {
  if (daysLate === null || daysLate === undefined) {
    return <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Missed</span>;
  }
  const config =
    daysLate === 0 ? { color: '#16A34A', label: 'On time' }
    : daysLate === 1 ? { color: '#CA8A04', label: '1 day late' }
    : daysLate === 2 ? { color: '#EA580C', label: '2 days late' }
    : { color: '#DC2626', label: `${daysLate} days late` };

  return (
    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: config.color }}>
      {config.label}
    </span>
  );
}

function UsernameSetup({ current, onSaved }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(!current);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { leetcodeUsername: current ?? '' },
  });

  const mutation = useMutation({
    mutationFn: ({ leetcodeUsername }) => leetcodeService.setLeetcodeUsername(leetcodeUsername),
    onSuccess: (data) => {
      toast.success('Username saved!');
      qc.invalidateQueries({ queryKey: ['leetcode', 'me'] });
      setEditing(false);
      onSaved?.(data.leetcodeUsername);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Failed to save'),
  });

  if (!editing && current) {
    return (
      <div className="flex items-center gap-3 bg-[#FDEFEE] rounded-xl px-4 py-2.5">
        <User className="w-4 h-4 text-[#CA6357] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#475569]">Your LeetCode username</p>
          <a
            href={`https://leetcode.com/u/${current}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-[#CA6357] hover:underline"
          >
            {current}
          </a>
        </div>
        <button onClick={() => setEditing(true)} className="text-[#94A3B8] hover:text-[#475569] transition-colors">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFBEB] border border-[#FCD34D]/60 rounded-xl p-4 space-y-3">
      <div>
        <p className="text-sm font-bold text-[#92400E]">Set your LeetCode username</p>
        <p className="text-xs text-[#78350F] mt-0.5">
          Your mentor checks your public LeetCode profile. Make sure it is set to <strong>public</strong>.
        </p>
      </div>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex gap-2">
        <div className="flex-1">
          <input
            {...register('leetcodeUsername', { required: 'Username is required' })}
            placeholder="e.g. john_doe"
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357] text-[#1E293B]"
          />
          {errors.leetcodeUsername && (
            <p className="text-xs text-red-500 mt-1">{errors.leetcodeUsername.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center gap-1.5 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm disabled:opacity-60 flex-shrink-0"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
        </button>
        {current && (
          <button type="button" onClick={() => setEditing(false)}
            className="px-3 py-2 rounded-xl border border-[#E2E8F0] text-[#94A3B8] text-sm hover:text-[#475569]">
            Cancel
          </button>
        )}
      </form>
    </div>
  );
}

function MarkDoneButton({ problem }) {
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const mutation = useMutation({
    mutationFn: () => leetcodeService.submitSolution(problem._id),
    onSuccess: () => {
      toast.success('Marked as done!');
      qc.invalidateQueries({ queryKey: ['leetcode', 'me'] });
      setConfirming(false);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Submission failed'),
  });

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C76D64] hover:text-[#A94E43] transition-colors"
      >
        <Send className="w-4 h-4" /> Mark as Done
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <p className="text-xs text-[#475569]">Confirm you've solved this on LeetCode?</p>
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="inline-flex items-center gap-1.5 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-3 py-1.5 rounded-xl text-xs disabled:opacity-60"
      >
        {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
        Yes, done
      </button>
      <button onClick={() => setConfirming(false)} className="text-xs text-[#94A3B8] hover:text-[#475569]">
        Cancel
      </button>
    </div>
  );
}

function TodayCard({ problem, list }) {
  const sub = problem.submission;

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      <div className="px-5 py-3 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}>
        <Trophy className="w-4 h-4 text-[#F2B3AC]" />
        <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase">Today's Problem</p>
        <span className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
          list === 'javascript' ? 'text-[#F59E0B] bg-[#F59E0B]/20' : 'text-[#F2B3AC] bg-white/10'
        }`}>
          {list === 'javascript' ? 'JavaScript' : 'General'}
        </span>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-[#94A3B8] font-mono mb-1">#{problem.order}{problem.leetcodeNo ? ` · LC #${problem.leetcodeNo}` : ''}</p>
            <h2 className="text-lg font-bold text-[#1E293B]">{problem.title}</h2>
            {problem.topic && <p className="text-xs text-[#94A3B8] mt-0.5">{problem.topic}</p>}
          </div>
          {sub ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <DaysLateDot daysLate={sub.daysLate} />
              <DaysLateLabel daysLate={sub.daysLate} />
            </div>
          ) : (
            <span className="text-xs font-bold text-[#94A3B8] flex-shrink-0">Not submitted</span>
          )}
        </div>

        {problem.hints?.length > 0 && (
          <div className="bg-[#FFFBEB] border border-[#FCD34D]/40 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-[#F59E0B]" />
              <p className="text-xs font-bold text-[#92400E]">Hints</p>
            </div>
            <ul className="space-y-1.5 pl-1">
              {problem.hints.map((hint, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#78350F]">
                  <span className="w-4 h-4 rounded-full bg-[#FCD34D]/50 text-[#92400E] font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {hint}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <a href={problem.leetcodeUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#CA6357] hover:text-[#A94E43] transition-colors">
            <ExternalLink className="w-4 h-4" /> Open on LeetCode
          </a>
          {!sub && <MarkDoneButton problem={problem} />}
        </div>
      </div>
    </div>
  );
}

function HistoryRow({ problem }) {
  const [expanded, setExpanded] = useState(false);
  const sub = problem.submission;

  return (
    <div className={`rounded-xl border transition-all ${
      sub ? 'border-[#E2E8F0] bg-white' : 'border-[#E2E8F0] bg-[#F8F9FB]'
    }`}>
      <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <span className="w-7 text-center font-mono text-xs text-[#94A3B8] flex-shrink-0">{problem.order}</span>
        <DaysLateDot daysLate={sub?.daysLate ?? null} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1E293B] truncate">{problem.title}</p>
          {problem.topic && <p className="text-[10px] text-[#94A3B8] hidden sm:block">{problem.topic}</p>}
        </div>
        <DaysLateLabel daysLate={sub?.daysLate ?? null} />
        {expanded ? <ChevronUp className="w-4 h-4 text-[#94A3B8] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />}
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[#F1F5F9] pt-3 space-y-3">
          <a href={problem.leetcodeUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#CA6357] hover:text-[#A94E43] transition-colors">
            <ExternalLink className="w-4 h-4" /> Open on LeetCode
          </a>

          {problem.hints?.length > 0 && (
            <div className="bg-[#FFFBEB] border border-[#FCD34D]/40 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-[#F59E0B]" />
                <p className="text-xs font-bold text-[#92400E]">Hints</p>
              </div>
              <ul className="space-y-1.5 pl-1">
                {problem.hints.map((hint, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#78350F]">
                    <span className="w-4 h-4 rounded-full bg-[#FCD34D]/50 text-[#92400E] font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {hint}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!sub && <MarkDoneButton problem={problem} />}
        </div>
      )}
    </div>
  );
}

export default function LeetCodePage() {
  const [activeList, setActiveList] = useState('general');

  const { data, isLoading } = useQuery({
    queryKey: ['leetcode', 'me'],
    queryFn: leetcodeService.getMyProgress,
  });

  const leetcodeHold      = data?.leetcodeHold ?? false;
  const leetcodeUsername  = data?.leetcodeUsername ?? null;
  const leetcodeList      = data?.leetcodeList ?? 'general';
  const onJsList          = leetcodeList === 'javascript';
  const dayNumber         = data?.dayNumber ?? 0;
  const cycleNumber       = data?.cycleNumber ?? 1;
  const todayProblem      = data?.todayProblem ?? null;
  const history           = data?.history ?? [];

  const totalDone = history.filter((p) => p.submission).length;
  const historyFiltered = history.filter((p) => p.list === activeList);
  const filteredDone = historyFiltered.filter((p) => p.submission).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase">LeetCode Practice</p>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                onJsList ? 'bg-[#F59E0B]/20 text-[#F59E0B]' : 'bg-white/10 text-[#F2B3AC]'
              }`}>
                {onJsList ? 'JavaScript List' : 'General List'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Day {dayNumber}
              {!onJsList && cycleNumber > 1 && (
                <span className="ml-2 text-sm font-semibold text-[#F59E0B] bg-[#F59E0B]/20 px-2 py-0.5 rounded-full">
                  Round {cycleNumber}
                </span>
              )}
            </h2>
            <p className="text-white/60 text-sm">{totalDone} done · {history.length} past problems</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/10 rounded-2xl px-4 py-3 text-center min-w-[72px]">
              <p className="text-white/60 text-xs mb-1">Day</p>
              <p className="text-white font-bold text-xl">{dayNumber}</p>
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-3 text-center min-w-[72px]">
              <p className="text-white/60 text-xs mb-1">Done</p>
              <p className="text-white font-bold text-xl">{totalDone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
        <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mr-1">Color guide</p>
        {[
          { daysLate: 0, label: 'On time' },
          { daysLate: 1, label: '1 day late' },
          { daysLate: 2, label: '2 days late' },
          { daysLate: 99, label: '3+ days late' },
          { daysLate: null, label: 'Not submitted' },
        ].map(({ daysLate, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <DaysLateDot daysLate={daysLate} size="sm" />
            <span className="text-xs text-[#64748B]">{label}</span>
          </div>
        ))}
      </div>

      {/* Hold banner */}
      {leetcodeHold && (
        <div className="rounded-2xl border border-[#F2B3AC] bg-[#FFF8F7] p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-[#C76D64] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-[#C76D64]">LeetCode Hold Active</p>
            <p className="text-sm text-[#475569] mt-0.5">
              Your access to new course content is limited. Mark your pending LeetCode problems as done and contact your mentor to remove the hold.
            </p>
          </div>
        </div>
      )}

      {/* LeetCode username setup */}
      {!isLoading && <UsernameSetup current={leetcodeUsername} />}

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {todayProblem ? (
            <TodayCard problem={todayProblem} list={todayProblem.list} />
          ) : dayNumber === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
              <Code2 className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-base font-bold text-[#1E293B]">Starting soon</p>
              <p className="text-sm text-[#94A3B8] mt-1">Your LeetCode schedule hasn't started yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 text-center border border-[#E2E8F0]">
              <p className="text-sm text-[#94A3B8]">No problem scheduled for today.</p>
            </div>
          )}

          {dayNumber > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Previous Questions</p>
                <span className="text-xs text-[#94A3B8]">{filteredDone}/{historyFiltered.length} done</span>
              </div>

              <div className="flex gap-2">
                {[
                  { key: 'general', label: 'General', sub: 'C, Java, etc.' },
                  { key: 'javascript', label: 'JavaScript', sub: 'JS only' },
                ].map(({ key, label }) => {
                  const count  = history.filter((p) => p.list === key).length;
                  const done   = history.filter((p) => p.list === key && p.submission).length;
                  const locked    = key === 'javascript' && !onJsList;
                  const completed = key === 'general' && onJsList;
                  return (
                    <button key={key}
                      onClick={() => !locked && setActiveList(key)}
                      disabled={locked}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-left transition-all ${
                        locked
                          ? 'bg-[#F1F5F9] border border-[#E2E8F0] cursor-not-allowed opacity-60'
                          : activeList === key
                          ? 'bg-[#CA6357] text-white'
                          : 'bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#CA6357]'
                      }`}
                      style={activeList !== key && !locked ? { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } : {}}>
                      <p className={`text-sm font-bold ${activeList === key && !locked ? 'text-white' : 'text-[#1E293B]'}`}>
                        {label}
                        {completed && <span className="ml-1.5 text-[10px] font-bold text-[#22A66E] bg-[#E8F8F2] px-1.5 py-0.5 rounded-full uppercase tracking-wider">Done</span>}
                        {locked && <span className="ml-1.5 text-[10px] font-bold text-[#94A3B8] bg-[#F1F5F9] px-1.5 py-0.5 rounded-full uppercase tracking-wider">Locked</span>}
                      </p>
                      <p className={`text-xs mt-0.5 ${activeList === key && !locked ? 'text-white/70' : 'text-[#94A3B8]'}`}>
                        {locked ? 'Starts after General list' : `${done}/${count} done`}
                      </p>
                    </button>
                  );
                })}
              </div>

              {historyFiltered.length === 0 ? (
                <div className="bg-white rounded-xl p-6 text-center border border-[#E2E8F0]">
                  <CalendarOff className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-sm text-[#94A3B8]">No previous questions in this list yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {[...historyFiltered].reverse().map((p) => (
                    <HistoryRow key={p._id} problem={p} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
