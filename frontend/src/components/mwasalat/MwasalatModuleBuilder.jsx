import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, Loader2,
  Video, FileText, Presentation, Music, Link2, ClipboardCheck, HelpCircle, BookOpen,
} from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import MwasalatQuizBuilder from './MwasalatQuizBuilder.jsx';
import MwasalatAssignmentBuilder from './MwasalatAssignmentBuilder.jsx';

const LESSON_TYPE_META = {
  intro: { icon: BookOpen, labelKey: 'moduleBuilder.lessonType.intro' },
  video: { icon: Video, labelKey: 'moduleBuilder.lessonType.video' },
  pdf: { icon: FileText, labelKey: 'moduleBuilder.lessonType.pdf' },
  ppt: { icon: Presentation, labelKey: 'moduleBuilder.lessonType.ppt' },
  audio: { icon: Music, labelKey: 'moduleBuilder.lessonType.audio' },
  link: { icon: Link2, labelKey: 'moduleBuilder.lessonType.link' },
  assignment: { icon: ClipboardCheck, labelKey: 'moduleBuilder.lessonType.assignment' },
  quiz: { icon: HelpCircle, labelKey: 'moduleBuilder.lessonType.quiz' },
};
const LESSON_TYPE_ORDER = ['intro', 'video', 'pdf', 'ppt', 'audio', 'link', 'assignment', 'quiz'];
const inputClass = 'px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20';

// A module can only ever have one quiz lesson (it's the module's gate) — the
// type picker hides 'quiz' once one already exists, matching the backend's
// "A module can only have one quiz" rejection instead of just surfacing it
// as an error after the fact.
function AddLessonForm({ programId, moduleId, hasQuiz, onAdded, onCancel }) {
  const { t } = useTranslation('mwasalatApp');
  const [type, setType] = useState(null);
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [content, setContent] = useState('');
  const [contentAr, setContentAr] = useState('');
  const [videoMode, setVideoMode] = useState('link');
  const [videoLink, setVideoLink] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [instructionsAr, setInstructionsAr] = useState('');
  const [maxScore, setMaxScore] = useState(100);
  const [file, setFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const needsFile = type === 'pdf' || type === 'ppt' || type === 'audio' || (type === 'video' && videoMode === 'upload');

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error(t('moduleBuilder.toastLessonTitleRequired')); return; }
    if (type === 'intro' && !content.trim()) { toast.error(t('moduleBuilder.toastIntroContentRequired')); return; }
    if (type === 'link' && !externalUrl.trim()) { toast.error(t('moduleBuilder.toastLinkUrlRequired')); return; }
    if (type === 'video' && videoMode === 'link' && !videoLink.trim()) { toast.error(t('moduleBuilder.toastVideoLinkRequired')); return; }
    if (needsFile && !file) { toast.error(t('moduleBuilder.toastFileRequired')); return; }
    if (type === 'assignment' && !instructions.trim()) { toast.error(t('moduleBuilder.toastInstructionsRequired')); return; }

    setIsSaving(true);
    try {
      const data = { type, title, titleAr };
      if (type === 'intro') { data.content = content; data.contentAr = contentAr; }
      if (type === 'link') data.externalUrl = externalUrl;
      if (type === 'video' && videoMode === 'link') data.videoLink = videoLink;
      if (type === 'assignment') { data.instructions = instructions; data.instructionsAr = instructionsAr; data.maxScore = maxScore; }
      const program = await mwasalatProgramService.addLesson(programId, moduleId, data, needsFile ? file : undefined);
      toast.success(t('moduleBuilder.toastLessonAdded'));
      onAdded(program);
    } catch (err) {
      toast.error(err.response?.data?.message || t('moduleBuilder.toastLessonAddFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-dashed border-mwasalatInk-300 bg-mwasalatInk-100/30 space-y-4">
      {!type ? (
        <>
          <p className="text-sm font-medium text-[#1E293B]">{t('moduleBuilder.pickLessonType')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LESSON_TYPE_ORDER.filter((lt) => lt !== 'quiz' || !hasQuiz).map((lt) => {
              const Icon = LESSON_TYPE_META[lt].icon;
              return (
                <button
                  key={lt}
                  type="button"
                  onClick={() => setType(lt)}
                  className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-[#E2E8F0] hover:border-mwasalatInk-300 hover:bg-white text-xs font-medium text-[#475569] transition-colors"
                >
                  <Icon className="w-4 h-4 text-mwasalatInk-500" />
                  {t(LESSON_TYPE_META[lt].labelKey)}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={onCancel} className="text-xs font-medium text-[#94A3B8] hover:text-[#475569]">{t('common.cancel')}</button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            {(() => { const Icon = LESSON_TYPE_META[type].icon; return <Icon className="w-4 h-4 text-mwasalatInk-500 flex-shrink-0" />; })()}
            <span className="text-sm font-semibold text-[#1E293B]">{t(LESSON_TYPE_META[type].labelKey)}</span>
            <button type="button" onClick={() => setType(null)} className="ms-auto text-xs font-medium text-[#94A3B8] hover:text-[#475569]">{t('moduleBuilder.changeTypeBtn')}</button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('moduleBuilder.lessonTitlePlaceholder')} className={inputClass} />
            <input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} dir="rtl" placeholder={t('moduleBuilder.lessonTitleArPlaceholder')} className={inputClass} />
          </div>

          {type === 'intro' && (
            <div className="grid sm:grid-cols-2 gap-3">
              <textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder={t('moduleBuilder.introContentPlaceholder')} className={`${inputClass} w-full resize-y`} />
              <textarea rows={4} dir="rtl" value={contentAr} onChange={(e) => setContentAr(e.target.value)} placeholder={t('moduleBuilder.introContentArPlaceholder')} className={`${inputClass} w-full resize-y`} />
            </div>
          )}

          {type === 'link' && (
            <input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} dir="ltr" placeholder="https://…" className={`${inputClass} w-full`} />
          )}

          {type === 'video' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button type="button" onClick={() => setVideoMode('link')} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${videoMode === 'link' ? 'bg-mwasalatInk-500 text-white border-mwasalatInk-500' : 'border-[#E2E8F0] text-[#475569]'}`}>{t('moduleBuilder.videoModeLink')}</button>
                <button type="button" onClick={() => setVideoMode('upload')} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${videoMode === 'upload' ? 'bg-mwasalatInk-500 text-white border-mwasalatInk-500' : 'border-[#E2E8F0] text-[#475569]'}`}>{t('moduleBuilder.videoModeUpload')}</button>
              </div>
              {videoMode === 'link' ? (
                <input value={videoLink} onChange={(e) => setVideoLink(e.target.value)} dir="ltr" placeholder="https://…" className={`${inputClass} w-full`} />
              ) : (
                <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm text-[#475569]" />
              )}
            </div>
          )}

          {type === 'pdf' && <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm text-[#475569]" />}
          {type === 'ppt' && <input type="file" accept=".ppt,.pptx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm text-[#475569]" />}
          {type === 'audio' && <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm text-[#475569]" />}

          {type === 'assignment' && (
            <div className="space-y-3">
              <textarea rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder={t('moduleBuilder.assignmentInstructionsPlaceholder')} className={`${inputClass} w-full resize-y`} />
              <textarea rows={3} dir="rtl" value={instructionsAr} onChange={(e) => setInstructionsAr(e.target.value)} placeholder={t('moduleBuilder.assignmentInstructionsArPlaceholder')} className={`${inputClass} w-full resize-y`} />
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-[#475569]">{t('moduleBuilder.maxScoreLabel')}</label>
                <input type="number" min={1} dir="ltr" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} className={`${inputClass} w-20 text-center`} />
              </div>
            </div>
          )}

          {type === 'quiz' && <p className="text-xs text-[#94A3B8]">{t('moduleBuilder.quizConfigureAfterNote')}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-1.5 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {t('moduleBuilder.addLessonBtn')}
            </button>
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#475569] hover:bg-white transition-colors">{t('common.cancel')}</button>
          </div>
        </>
      )}
    </div>
  );
}

function LessonRow({ programId, moduleId, lesson, index, total, onMove, onProgramUpdated }) {
  const { t } = useTranslation('mwasalatApp');
  const Icon = LESSON_TYPE_META[lesson.type]?.icon ?? FileText;
  const [expanded, setExpanded] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const handleRemove = async () => {
    setIsBusy(true);
    try {
      const program = await mwasalatProgramService.removeLesson(programId, moduleId, lesson._id);
      onProgramUpdated(program);
    } catch (err) {
      toast.error(err.response?.data?.message || t('moduleBuilder.toastLessonRemoveFailed'));
    } finally {
      setIsBusy(false);
    }
  };

  const showsInlineBuilder = lesson.type === 'quiz' || lesson.type === 'assignment';

  return (
    <div className="rounded-lg border border-[#E2E8F0] overflow-hidden">
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white">
        <Icon className="w-4 h-4 text-mwasalatInk-500 flex-shrink-0" />
        <span className="text-sm font-medium text-[#1E293B] truncate flex-1">{lesson.title}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="p-1 text-[#94A3B8] hover:text-mwasalatInk-500 disabled:opacity-30 transition-colors"><ChevronUp className="w-3.5 h-3.5" /></button>
          <button type="button" disabled={index === total - 1} onClick={() => onMove(1)} className="p-1 text-[#94A3B8] hover:text-mwasalatInk-500 disabled:opacity-30 transition-colors"><ChevronDown className="w-3.5 h-3.5" /></button>
          {showsInlineBuilder && (
            <button type="button" onClick={() => setExpanded((e) => !e)} className="p-1 text-[#94A3B8] hover:text-mwasalatInk-500 transition-colors">
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          )}
          <button type="button" disabled={isBusy} onClick={handleRemove} className="p-1 text-[#94A3B8] hover:text-mwasalatRed-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {showsInlineBuilder && expanded && (
        <div className="border-t border-[#E2E8F0]">
          {lesson.type === 'quiz'
            ? <MwasalatQuizBuilder programId={programId} moduleId={moduleId} />
            : <MwasalatAssignmentBuilder programId={programId} moduleId={moduleId} lessonId={lesson._id} />}
        </div>
      )}
    </div>
  );
}

function ModuleCard({ programId, mod, index, total, onMove, onRemove, onProgramUpdated }) {
  const { t } = useTranslation('mwasalatApp');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(mod.title);
  const [titleAr, setTitleAr] = useState(mod.titleAr ?? '');
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  const lessons = (mod.lessons ?? []).slice().sort((a, b) => a.order - b.order);
  const hasQuiz = lessons.some((l) => l.type === 'quiz');

  const handleSaveTitle = async () => {
    if (!title.trim()) { toast.error(t('moduleBuilder.toastModuleTitleRequired')); return; }
    setIsSavingTitle(true);
    try {
      const program = await mwasalatProgramService.updateModule(programId, mod._id, { title, titleAr });
      onProgramUpdated(program);
      setIsEditingTitle(false);
    } catch (err) {
      toast.error(err.response?.data?.message || t('moduleBuilder.toastModuleUpdateFailed'));
    } finally {
      setIsSavingTitle(false);
    }
  };

  const moveLesson = async (lessonId, delta) => {
    const idx = lessons.findIndex((l) => l._id === lessonId);
    const swapIdx = idx + delta;
    if (swapIdx < 0 || swapIdx >= lessons.length) return;
    const reordered = [...lessons];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    try {
      const program = await mwasalatProgramService.reorderLessons(programId, mod._id, reordered.map((l) => l._id));
      onProgramUpdated(program);
    } catch (err) {
      toast.error(err.response?.data?.message || t('moduleBuilder.toastReorderFailed'));
    }
  };

  return (
    <div className="rounded-xl border border-[#E2E8F0] overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-[#F8F9FB]">
        <span className="w-6 h-6 rounded-full bg-mwasalatInk-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{index + 1}</span>
        {isEditingTitle ? (
          <div className="flex-1 grid sm:grid-cols-2 gap-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputClass} w-full`} />
            <input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} dir="rtl" className={`${inputClass} w-full`} />
          </div>
        ) : (
          <button type="button" onClick={() => setIsEditingTitle(true)} className="flex-1 min-w-0 text-start text-sm font-semibold text-[#1E293B] hover:text-mwasalatInk-500 transition-colors truncate">
            {mod.title}
          </button>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isEditingTitle && (
            <button type="button" onClick={handleSaveTitle} disabled={isSavingTitle} className="text-xs font-semibold text-mwasalatInk-500 hover:underline px-1.5">{t('common.save')}</button>
          )}
          <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="p-1 text-[#94A3B8] hover:text-mwasalatInk-500 disabled:opacity-30 transition-colors"><ChevronUp className="w-4 h-4" /></button>
          <button type="button" disabled={index === total - 1} onClick={() => onMove(1)} className="p-1 text-[#94A3B8] hover:text-mwasalatInk-500 disabled:opacity-30 transition-colors"><ChevronDown className="w-4 h-4" /></button>
          <button type="button" onClick={onRemove} className="p-1 text-[#94A3B8] hover:text-mwasalatRed-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {lessons.map((lesson, li) => (
          <LessonRow
            key={lesson._id}
            programId={programId}
            moduleId={mod._id}
            lesson={lesson}
            index={li}
            total={lessons.length}
            onMove={(delta) => moveLesson(lesson._id, delta)}
            onProgramUpdated={onProgramUpdated}
          />
        ))}

        {isAddingLesson ? (
          <AddLessonForm
            programId={programId}
            moduleId={mod._id}
            hasQuiz={hasQuiz}
            onAdded={(program) => { onProgramUpdated(program); setIsAddingLesson(false); }}
            onCancel={() => setIsAddingLesson(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingLesson(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-[#E2E8F0] hover:border-mwasalatInk-300 text-sm font-medium text-mwasalatInk-500 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> {t('moduleBuilder.addLessonBtn')}
          </button>
        )}
      </div>
    </div>
  );
}

export default function MwasalatModuleBuilder({ programId }) {
  const { t } = useTranslation('mwasalatApp');
  const [modules, setModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleTitleAr, setNewModuleTitleAr] = useState('');
  const [isAddingModule, setIsAddingModule] = useState(false);

  const applyProgram = (program) => {
    setModules((program.modules ?? []).slice().sort((a, b) => a.order - b.order));
  };

  useEffect(() => {
    mwasalatProgramService.getById(programId).then(applyProgram).finally(() => setIsLoading(false));
  }, [programId]);

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) { toast.error(t('moduleBuilder.toastModuleTitleRequired')); return; }
    setIsAddingModule(true);
    try {
      const program = await mwasalatProgramService.addModule(programId, { title: newModuleTitle, titleAr: newModuleTitleAr });
      applyProgram(program);
      setNewModuleTitle('');
      setNewModuleTitleAr('');
      toast.success(t('moduleBuilder.toastModuleAdded'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('moduleBuilder.toastModuleAddFailed'));
    } finally {
      setIsAddingModule(false);
    }
  };

  const moveModule = async (moduleId, delta) => {
    const idx = modules.findIndex((m) => m._id === moduleId);
    const swapIdx = idx + delta;
    if (swapIdx < 0 || swapIdx >= modules.length) return;
    const reordered = [...modules];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    try {
      const program = await mwasalatProgramService.reorderModules(programId, reordered.map((m) => m._id));
      applyProgram(program);
    } catch (err) {
      toast.error(err.response?.data?.message || t('moduleBuilder.toastReorderFailed'));
    }
  };

  const removeModule = async (moduleId) => {
    try {
      const program = await mwasalatProgramService.removeModule(programId, moduleId);
      applyProgram(program);
    } catch (err) {
      toast.error(err.response?.data?.message || t('moduleBuilder.toastModuleRemoveFailed'));
    }
  };

  if (isLoading) {
    return (
      <div className="p-10 flex items-center justify-center text-[#94A3B8]">
        <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('moduleBuilder.loading')}
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      {modules.map((mod, index) => (
        <ModuleCard
          key={mod._id}
          programId={programId}
          mod={mod}
          index={index}
          total={modules.length}
          onMove={(delta) => moveModule(mod._id, delta)}
          onRemove={() => removeModule(mod._id)}
          onProgramUpdated={applyProgram}
        />
      ))}

      <div className="p-4 rounded-xl border border-[#E2E8F0] space-y-3">
        <p className="text-sm font-semibold text-[#1E293B]">{t('moduleBuilder.addModuleHeading')}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} placeholder={t('moduleBuilder.moduleTitlePlaceholder')} className={`${inputClass} w-full`} />
          <input value={newModuleTitleAr} onChange={(e) => setNewModuleTitleAr(e.target.value)} dir="rtl" placeholder={t('moduleBuilder.moduleTitleArPlaceholder')} className={`${inputClass} w-full`} />
        </div>
        <button
          type="button"
          onClick={handleAddModule}
          disabled={isAddingModule}
          className="flex items-center gap-1.5 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {isAddingModule ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} {t('moduleBuilder.addModuleBtn')}
        </button>
      </div>
    </div>
  );
}
