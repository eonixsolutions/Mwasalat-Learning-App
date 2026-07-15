import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, Loader2, HelpCircle, ClipboardPaste, X } from 'lucide-react';
import { mwasalatQuizService } from '../../services/mwasalatQuiz.service.js';

const emptyQuestion = () => ({ text: '', options: ['', ''], correctIndex: 0 });

const BULK_EXAMPLE = `Q: What is the speed limit in residential areas?
A) 30 km/h
B) 50 km/h *
C) 80 km/h
D) 100 km/h

Q: When should you check your mirrors while driving?
A) Only when reversing
B) Every few seconds *
C) Never
D) Only at traffic lights`;

// Blocks separated by a blank line; first line is the question, the rest are
// options; mark the correct option with a trailing "*"
const parseBulkQuestions = (raw) => {
  const blocks = raw.trim().split(/\n\s*\n/).filter(Boolean);
  const parsed = [];
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 3) continue;

    const text = lines[0].replace(/^Q[:.)]\s*/i, '');
    let correctIndex = 0;
    const options = lines.slice(1).map((line, i) => {
      const isCorrect = /\*\s*$/.test(line) || /\(correct\)\s*$/i.test(line);
      if (isCorrect) correctIndex = i;
      return line
        .replace(/\*\s*$/, '')
        .replace(/\(correct\)\s*$/i, '')
        .replace(/^[A-Za-z][.)]\s*/, '')
        .replace(/^\d+[.)]\s*/, '')
        .replace(/^-\s*/, '')
        .trim();
    });

    if (text && options.length >= 2) parsed.push({ text, options, correctIndex });
  }
  return parsed;
};

export default function MwasalatQuizBuilder({ programId, onSaved }) {
  const [questions, setQuestions] = useState([]);
  const [passPercentage, setPassPercentage] = useState(70);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');

  useEffect(() => {
    mwasalatQuizService.getQuizForInstructor(programId)
      .then((quiz) => {
        if (quiz) {
          setQuestions(quiz.questions);
          setPassPercentage(quiz.passPercentage);
        } else {
          setQuestions([emptyQuestion()]);
        }
      })
      .catch(() => setQuestions([emptyQuestion()]))
      .finally(() => setIsLoading(false));
  }, [programId]);

  const updateQuestion = (i, patch) => {
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  };

  const updateOption = (qi, oi, value) => {
    setQuestions((prev) => prev.map((q, idx) => {
      if (idx !== qi) return q;
      const options = q.options.map((o, j) => (j === oi ? value : o));
      return { ...q, options };
    }));
  };

  const addOption = (qi) => {
    setQuestions((prev) => prev.map((q, idx) => (idx === qi ? { ...q, options: [...q.options, ''] } : q)));
  };

  const removeOption = (qi, oi) => {
    setQuestions((prev) => prev.map((q, idx) => {
      if (idx !== qi) return q;
      const options = q.options.filter((_, j) => j !== oi);
      const correctIndex = q.correctIndex >= options.length ? 0 : q.correctIndex;
      return { ...q, options, correctIndex };
    }));
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const removeQuestion = (i) => setQuestions((prev) => prev.filter((_, idx) => idx !== i));

  const handleBulkImport = () => {
    const parsed = parseBulkQuestions(bulkText);
    if (parsed.length === 0) {
      toast.error('Could not find any valid questions — check the format');
      return;
    }
    const isBlankDraft = questions.length === 1 && !questions[0].text.trim() && questions[0].options.every((o) => !o.trim());
    setQuestions((prev) => (isBlankDraft ? parsed : [...prev, ...parsed]));
    toast.success(`Imported ${parsed.length} question${parsed.length === 1 ? '' : 's'}`);
    setBulkText('');
    setShowBulkImport(false);
  };

  const handleSave = async () => {
    if (questions.length === 0) {
      toast.error('Add at least one question');
      return;
    }
    for (const q of questions) {
      if (!q.text.trim() || q.options.some((o) => !o.trim())) {
        toast.error('Fill in every question and option');
        return;
      }
    }
    setIsSaving(true);
    try {
      await mwasalatQuizService.upsertQuiz(programId, { questions, passPercentage });
      toast.success('Quiz saved');
      onSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save quiz');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-10 flex items-center justify-center text-[#94A3B8]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading quiz…
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-[#1E293B]">Pass score</label>
          <input
            type="number"
            min={0}
            max={100}
            value={passPercentage}
            onChange={(e) => setPassPercentage(Number(e.target.value))}
            className="w-20 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-sm text-center"
          />
          <span className="text-sm text-[#94A3B8]">%</span>
        </div>
        <button
          type="button"
          onClick={() => setShowBulkImport(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-mwasalatInk-500 hover:text-mwasalatInk-400 transition-colors"
        >
          <ClipboardPaste className="w-4 h-4" /> Bulk Import
        </button>
      </div>

      {questions.map((q, qi) => (
        <div key={qi} className="p-4 rounded-xl border border-[#E2E8F0] space-y-3">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-mwasalatInk-400 mt-2.5 flex-shrink-0" />
            <input
              value={q.text}
              onChange={(e) => updateQuestion(qi, { text: e.target.value })}
              placeholder={`Question ${qi + 1}`}
              className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm"
            />
            <button type="button" onClick={() => removeQuestion(qi)} className="p-2 text-mwasalatRed-500 hover:text-mwasalatRed-700 transition-colors flex-shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="pl-6 space-y-2">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${qi}`}
                  checked={q.correctIndex === oi}
                  onChange={() => updateQuestion(qi, { correctIndex: oi })}
                  className="accent-mwasalatInk-500"
                />
                <input
                  value={opt}
                  onChange={(e) => updateOption(qi, oi, e.target.value)}
                  placeholder={`Option ${oi + 1}`}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-sm"
                />
                {q.options.length > 2 && (
                  <button type="button" onClick={() => removeOption(qi, oi)} className="text-[#94A3B8] hover:text-mwasalatRed-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addOption(qi)}
              className="inline-flex items-center gap-1 text-xs font-medium text-mwasalatInk-500 hover:text-mwasalatInk-400 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add option
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-mwasalatInk-500 hover:text-mwasalatInk-400 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add question
      </button>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {isSaving ? 'Saving…' : 'Save Quiz'}
      </button>

      {showBulkImport && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-[#1E293B]">Bulk Import Questions</h3>
              <button onClick={() => setShowBulkImport(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#94A3B8] mb-3">
              Paste questions separated by a blank line. Mark the correct option with a trailing <code className="bg-[#F1F5F9] px-1 rounded">*</code>.
            </p>
            <textarea
              rows={10}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={BULK_EXAMPLE}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-mono bg-white text-[#1E293B] placeholder:text-[#94A3B8]/70 focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 mb-4"
            />
            <button
              type="button"
              onClick={handleBulkImport}
              className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              <ClipboardPaste className="w-4 h-4" /> Import Questions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
