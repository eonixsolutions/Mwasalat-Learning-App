import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Save, Eye, EyeOff, ArrowLeft, Plus, Trash2,
  ChevronDown, ChevronUp, Wand2, AlertCircle, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { taskSheetContentService } from '../../../services/taskSheetContent.service.js';
import WeekTaskSheet from '../../../components/tasksheet/WeekTaskSheet.jsx';
import { parseFullWeek, itemsToText, textToItems } from '../../../utils/taskSheetParser.js';
import { cn } from '../../../utils/cn.js';
import Spinner from '../../../components/ui/Spinner.jsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const newTask = () => ({ _id: crypto.randomUUID(), title: 'Task:', intro: '', itemsRaw: '' });
const newDay  = (n) => ({
  _id: crypto.randomUUID(), dayNumber: n, isExtraDay: false,
  title: '', objective: '', contentRaw: '', tasks: [newTask()], finalStep: '',
});

// Convert structured day → editor form state
function dayToForm(day) {
  return {
    _id:        day._id ?? crypto.randomUUID(),
    dayNumber:  day.dayNumber,
    isExtraDay: day.isExtraDay ?? false,
    title:      day.title ?? '',
    objective:  day.objective ?? '',
    contentRaw: itemsToText(day.contentItems),
    finalStep:  day.finalStep ?? '',
    tasks: (day.tasks ?? []).map(t => ({
      _id:      t._id ?? crypto.randomUUID(),
      title:    t.title ?? '',
      intro:    t.intro ?? '',
      itemsRaw: itemsToText(t.items),
    })),
  };
}

// Strip client-side UUIDs — Mongoose generates its own ObjectIds for subdocs
const stripId = ({ _id, ...rest }) => rest;

// Convert editor form state → structured day for API
function formToDay(form) {
  return {
    dayNumber:    form.dayNumber,
    isExtraDay:   form.isExtraDay,
    title:        form.title,
    objective:    form.objective,
    contentItems: textToItems(form.contentRaw).map(stripId),
    finalStep:    form.finalStep,
    tasks: form.tasks.map(t => ({
      title: t.title,
      intro: t.intro,
      items: textToItems(t.itemsRaw).map(stripId),
    })),
  };
}

// ─── Day editor card ──────────────────────────────────────────────────────────
function DayEditor({ day, onChange, onRemove, canRemove }) {
  const [open, setOpen] = useState(true);

  const set = (field, val) => onChange({ ...day, [field]: val });

  const setTask = (ti, field, val) =>
    onChange({ ...day, tasks: day.tasks.map((t, i) => i === ti ? { ...t, [field]: val } : t) });

  const addTask = () => onChange({ ...day, tasks: [...day.tasks, newTask()] });
  const removeTask = (ti) => onChange({ ...day, tasks: day.tasks.filter((_, i) => i !== ti) });

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#F8F9FB] border-b border-[#E2E8F0]">
        <button className="flex-1 flex items-center gap-2 text-left min-w-0" onClick={() => setOpen(o => !o)}>
          <span className="w-8 h-8 rounded-xl bg-[#FDEFEE] border border-[#F2B3AC] text-[#CA6357] text-xs font-bold flex items-center justify-center shrink-0">
            {day.isExtraDay ? 'EX' : `D${day.dayNumber}`}
          </span>
          <span className="font-medium text-sm text-[#1E293B] truncate">
            {day.isExtraDay ? 'Extra Day' : `Day ${day.dayNumber}`}
            {day.title ? ` — ${day.title}` : ''}
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-[#94A3B8] ml-auto shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8] ml-auto shrink-0" />}
        </button>
        {canRemove && (
          <button onClick={onRemove} className="p-1.5 rounded-lg hover:bg-red-50 text-[#94A3B8] hover:text-red-500 shrink-0">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="p-4 space-y-4">
          {/* Day number + isExtraDay + title */}
          <div className="flex gap-3 flex-wrap">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#94A3B8]">Day #</label>
              <input
                type="number" min={0} value={day.dayNumber}
                onChange={e => set('dayNumber', parseInt(e.target.value) || 0)}
                className="w-20 px-3 py-2 text-sm rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#CA6357]/30 focus:border-[#CA6357]"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer self-end mb-2">
              <input type="checkbox" checked={!!day.isExtraDay} onChange={e => set('isExtraDay', e.target.checked)}
                className="w-4 h-4 rounded accent-[#CA6357]" />
              <span className="text-sm text-[#475569]">Extra day</span>
            </label>
            <div className="flex-1 min-w-48 space-y-1">
              <label className="text-xs font-medium text-[#94A3B8]">Title (optional)</label>
              <input value={day.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. HTML Basics: Build Your First Page"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#CA6357]/30 focus:border-[#CA6357] text-[#1E293B] placeholder-[#CBD5E1]"
              />
            </div>
          </div>

          {/* Objective */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#94A3B8]">Objective (optional)</label>
            <textarea value={day.objective} onChange={e => set('objective', e.target.value)}
              placeholder="What students will understand by the end of this day..."
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#CA6357]/30 focus:border-[#CA6357] text-[#1E293B] placeholder-[#CBD5E1] resize-none"
            />
          </div>

          {/* Topics */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#CA6357]">Topics / Content</label>
              <span className="text-[10px] text-[#CBD5E1]">Paste bullets as-is · indent sub-items with 4 spaces or use "o" prefix</span>
            </div>
            <textarea value={day.contentRaw} onChange={e => set('contentRaw', e.target.value)}
              placeholder={"What is HTML?\noTags and elements\noAttributes\nSemantic Tags"}
              rows={6}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#CA6357]/30 focus:border-[#CA6357] text-[#1E293B] placeholder-[#CBD5E1] resize-y font-mono"
            />
          </div>

          {/* Tasks */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#D96C5F]">Tasks</p>
            {day.tasks.map((task, ti) => (
              <div key={task._id} className="bg-[#FBE9E7]/40 border border-[#F2B3AC] rounded-xl p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <input value={task.title} onChange={e => setTask(ti, 'title', e.target.value)}
                    placeholder="Task label (e.g. Task:, Task 1:)"
                    className="flex-1 px-2.5 py-1.5 text-sm rounded-lg border border-[#F2B3AC] bg-white focus:outline-none focus:ring-1 focus:ring-[#D96C5F]/30 focus:border-[#D96C5F] text-[#1E293B] placeholder-[#CBD5E1]"
                  />
                  {day.tasks.length > 1 && (
                    <button onClick={() => removeTask(ti)} className="p-1 rounded-lg hover:bg-red-100 text-[#F2B3AC] hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input value={task.intro} onChange={e => setTask(ti, 'intro', e.target.value)}
                  placeholder="Intro line (e.g. Create a webpage with:)"
                  className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-[#F2B3AC] bg-white focus:outline-none focus:ring-1 focus:ring-[#D96C5F]/30 focus:border-[#D96C5F] text-[#1E293B] placeholder-[#CBD5E1]"
                />
                <textarea value={task.itemsRaw} onChange={e => setTask(ti, 'itemsRaw', e.target.value)}
                  placeholder={"• Use semantic HTML\n• No custom CSS\n    – Only Tailwind utility classes"}
                  rows={5}
                  className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-[#F2B3AC] bg-white focus:outline-none focus:ring-1 focus:ring-[#D96C5F]/30 focus:border-[#D96C5F] text-[#1E293B] placeholder-[#CBD5E1] resize-y font-mono"
                />
              </div>
            ))}
            <button onClick={addTask}
              className="flex items-center gap-1.5 text-xs text-[#D96C5F] font-medium hover:text-[#C45E52]">
              <Plus className="w-3.5 h-3.5" /> Add task block
            </button>
          </div>

          {/* Final step */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#94A3B8]">Final Step (optional)</label>
            <input value={day.finalStep} onChange={e => set('finalStep', e.target.value)}
              placeholder="Publish your project to GitHub Pages…"
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#CA6357]/30 focus:border-[#CA6357] text-[#1E293B] placeholder-[#CBD5E1]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TaskSheetEditorPage() {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const weekParam = Number(searchParams.get('week') ?? 1);
  const [weekNum, setWeekNum]               = useState(weekParam);
  const [program, setProgram]               = useState('');
  const [topicsOverview, setTopicsOverview] = useState('');
  const [days, setDays]                     = useState([newDay(1)]);
  const [docId, setDocId]                   = useState(null);
  const [isPublished, setIsPublished]       = useState(false);
  const [previewMode, setPreviewMode]       = useState(false);

  // Import mode state
  const [importMode, setImportMode]   = useState(false);
  const [rawPaste, setRawPaste]       = useState('');
  const [parseResult, setParseResult] = useState(null); // null | 'ok' | 'error'

  // Fetch existing content for this week
  const { data: existing, isLoading } = useQuery({
    queryKey: ['task-sheet-admin', courseId, weekNum],
    queryFn: () => taskSheetContentService.getAdminWeek(courseId, weekNum),
    enabled: !!courseId,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Populate form from fetched data
  useEffect(() => {
    if (existing) {
      setDocId(existing._id);
      setProgram(existing.program ?? '');
      setTopicsOverview(existing.topicsOverview ?? '');
      setDays(existing.days?.length ? existing.days.map(dayToForm) : [newDay(1)]);
      setIsPublished(existing.isPublished ?? false);
    }
  }, [existing]);

  // ─── Import / parse ─────────────────────────────────────────────────────────
  const handleParse = () => {
    try {
      const result = parseFullWeek(rawPaste);
      if (!result.days.length) {
        toast.error('No days found — make sure each day starts with "DAY 1", "Day 2", etc.');
        setParseResult('error');
        return;
      }
      if (result.week)           setWeekNum(result.week);
      if (result.topicsOverview) setTopicsOverview(result.topicsOverview);
      setDays(result.days.map(dayToForm));
      setParseResult('ok');
      setImportMode(false);
      toast.success(`Parsed ${result.days.length} day${result.days.length > 1 ? 's' : ''} — review and save`);
    } catch (e) {
      console.error(e);
      toast.error('Parse failed — check the pasted content and try again');
      setParseResult('error');
    }
  };

  // ─── Save mutation ───────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () => taskSheetContentService.upsertWeek(courseId, weekNum, {
      program,
      topicsOverview,
      days: days.map(formToDay),
    }),
    onSuccess: (data) => {
      setDocId(data._id);
      setIsPublished(data.isPublished ?? false);
      queryClient.invalidateQueries({ queryKey: ['task-sheet-admin', courseId, weekNum] });
      queryClient.invalidateQueries({ queryKey: ['task-sheet-content', courseId, weekNum] });
      queryClient.invalidateQueries({ queryKey: ['task-sheet-list', courseId] });
      toast.success('Saved');
    },
    onError: () => toast.error('Failed to save'),
  });

  // ─── Publish mutation ────────────────────────────────────────────────────────
  const publishMutation = useMutation({
    mutationFn: (pub) => taskSheetContentService.togglePublish(docId, pub),
    onSuccess: (data) => {
      setIsPublished(data.isPublished);
      queryClient.invalidateQueries({ queryKey: ['task-sheet-admin', courseId, weekNum] });
      queryClient.invalidateQueries({ queryKey: ['task-sheet-content', courseId, weekNum] });
      queryClient.invalidateQueries({ queryKey: ['task-sheet-published', courseId] });
      queryClient.invalidateQueries({ queryKey: ['task-sheet-list', courseId] });
      toast.success(data.isPublished ? 'Published — students can see this' : 'Moved to draft');
    },
    onError: () => toast.error('Failed'),
  });

  const updateDay = useCallback((idx, day) => setDays(prev => prev.map((d, i) => i === idx ? day : d)), []);
  const removeDay = (idx) => setDays(prev => prev.filter((_, i) => i !== idx));
  const addDay    = () => {
    const nextNum = Math.max(...days.map(d => d.dayNumber), 0) + 1;
    setDays(d => [...d, newDay(nextNum)]);
  };

  // Preview uses structured data
  const previewContent = {
    week: weekNum,
    topicsOverview,
    days: days.map(formToDay),
  };

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#CA6357]">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[#1E293B]">Task Sheet Editor</h1>
          <p className="text-xs text-[#94A3B8]">Week {weekNum}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setImportMode(m => !m)}
            className={cn('flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border font-medium transition-colors',
              importMode ? 'bg-[#7C6AF2] text-white border-[#7C6AF2]' : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#7C6AF2] hover:text-[#7C6AF2]')}>
            <Wand2 className="w-4 h-4" /> {importMode ? 'Cancel import' : 'Import raw text'}
          </button>
          <button onClick={() => setPreviewMode(p => !p)}
            className={cn('flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border font-medium transition-colors',
              previewMode ? 'bg-[#CA6357] text-white border-[#CA6357]' : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CA6357] hover:text-[#CA6357]')}>
            {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {previewMode ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Spinner /></div>
      ) : previewMode ? (
        <WeekTaskSheet content={previewContent} />
      ) : (
        <>
          {/* ── Import panel ──────────────────────────────────────────── */}
          {importMode && (
            <div className="bg-[#F5F3FF] border border-[#C4B5FD] rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-2">
                <Wand2 className="w-4 h-4 text-[#7C6AF2] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#4C1D95]">Paste full week content</p>
                  <p className="text-xs text-[#6D28D9] mt-0.5">
                    Paste the week text as-is (including WEEK, TOPICS, and all DAY sections). The parser will extract everything automatically.
                  </p>
                </div>
              </div>
              <textarea
                value={rawPaste}
                onChange={e => { setRawPaste(e.target.value); setParseResult(null); }}
                placeholder={"CODE2CAREER\nWEEK\t: 2\nTOPICS\t: Tailwind CSS & JavaScript Basics\n\nDAY 1\n\nTopics\n• What is Tailwind?...\n\nTask\nCreate a responsive webpage..."}
                rows={14}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#C4B5FD] bg-white focus:outline-none focus:ring-2 focus:ring-[#7C6AF2]/30 focus:border-[#7C6AF2] text-[#1E293B] placeholder-[#C4B5FD] resize-y font-mono"
              />
              <div className="flex items-center gap-3">
                <button onClick={handleParse} disabled={!rawPaste.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#7C6AF2] text-white rounded-xl text-sm font-semibold hover:bg-[#6D5FD3] transition-colors disabled:opacity-50">
                  <Wand2 className="w-4 h-4" /> Parse & apply
                </button>
                {parseResult === 'ok' && (
                  <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Parsed successfully
                  </span>
                )}
                {parseResult === 'error' && (
                  <span className="flex items-center gap-1.5 text-xs text-[#D96C5F] font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> Parse failed
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Sheet meta ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Sheet info</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#94A3B8]">Week number</label>
                <input type="number" min={1} value={weekNum} onChange={e => setWeekNum(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#CA6357]/30 focus:border-[#CA6357]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#94A3B8]">Program</label>
                <input value={program} onChange={e => setProgram(e.target.value)} placeholder="code2career"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#CA6357]/30 focus:border-[#CA6357] text-[#1E293B] placeholder-[#CBD5E1]"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#94A3B8]">Topics overview (shown in the week header)</label>
              <input value={topicsOverview} onChange={e => setTopicsOverview(e.target.value)} placeholder="Tailwind CSS & JavaScript Basics"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#CA6357]/30 focus:border-[#CA6357] text-[#1E293B] placeholder-[#CBD5E1]"
              />
            </div>
          </div>

          {/* ── Day editors ────────────────────────────────────────────── */}
          <div className="space-y-3">
            {days.map((day, idx) => (
              <DayEditor
                key={day._id}
                day={day}
                onChange={(d) => updateDay(idx, d)}
                onRemove={() => removeDay(idx)}
                canRemove={days.length > 1}
              />
            ))}
            <button onClick={addDay}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-[#F2B3AC] text-[#CA6357] text-sm font-medium hover:bg-[#FDEFEE] transition-colors">
              <Plus className="w-4 h-4" /> Add day
            </button>
          </div>

          {/* ── Action bar ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-wrap gap-3 items-center justify-between">
            <span className={cn(
              'flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg',
              isPublished ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0]',
            )}>
              {isPublished ? '● Published' : '○ Draft'}
            </span>
            <div className="flex gap-2">
              {docId && (
                <button onClick={() => publishMutation.mutate(!isPublished)} disabled={publishMutation.isPending}
                  className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors',
                    isPublished ? 'border-orange-200 text-orange-600 hover:bg-orange-50' : 'border-green-200 text-green-600 hover:bg-green-50')}>
                  {isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {isPublished ? 'Unpublish' : 'Publish'}
                </button>
              )}
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !program.trim()}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#D96C5F] text-white text-sm font-semibold hover:bg-[#C45E52] transition-colors disabled:opacity-50">
                <Save className="w-4 h-4" />
                {saveMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {!program.trim() && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Program is required before saving.
            </div>
          )}
        </>
      )}
    </div>
  );
}
