import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, BookPlus, Sparkles, FileText, Video, Radio, MapPin, HelpCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import MwasalatQuizBuilder from '../../components/mwasalat/MwasalatQuizBuilder.jsx';

const CONTENT_TYPES = [
  { value: 'pdf', label: 'PDF', icon: FileText, hint: 'Upload a PDF handout or reading material' },
  { value: 'recording', label: 'Recording', icon: Video, hint: 'Link to a pre-recorded video lesson' },
  { value: 'live', label: 'Live Class', icon: Radio, hint: 'Schedule a live session with a meeting link' },
  { value: 'ilt', label: 'ILT', icon: MapPin, hint: 'In-person classroom session with QR check-in' },
];

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

export default function MwasalatAddCoursePage() {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  const [aiSuggested, setAiSuggested] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [createdProgram, setCreatedProgram] = useState(null);
  const [recordingMode, setRecordingMode] = useState('link');
  const title = watch('title');
  const pdfFile = watch('pdfFile');
  const videoFile = watch('videoFile');

  const toggleType = (value) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const { mutate: autofill, isPending: isAutofilling } = useMutation({
    mutationFn: mwasalatProgramService.aiAutofill,
    onSuccess: (suggestion) => {
      setValue('category', suggestion.category, { shouldValidate: true });
      setValue('subCategory', suggestion.subCategory);
      setValue('description', suggestion.description);
      setAiSuggested(true);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Autofill failed'),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: mwasalatProgramService.create,
    onSuccess: (program) => {
      toast.success('Course created — now add an assessment');
      setCreatedProgram(program);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create course'),
  });

  const onSubmit = (data) => {
    if (selectedTypes.length === 0) {
      toast.error('Select at least one content type');
      return;
    }

    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('category', data.category);
    formData.append('subCategory', data.subCategory ?? '');
    formData.append('description', data.description ?? '');
    formData.append('duration', data.duration ?? '');
    formData.append('price', data.price ?? 0);
    formData.append('expiryDate', data.expiryDate ?? '');
    formData.append('contentTypes', JSON.stringify(selectedTypes));

    if (selectedTypes.includes('pdf') && data.pdfFile?.[0]) {
      formData.append('pdfFile', data.pdfFile[0]);
    }
    if (selectedTypes.includes('recording')) {
      if (recordingMode === 'upload' && data.videoFile?.[0]) {
        formData.append('videoFile', data.videoFile[0]);
      } else {
        formData.append('recordingLink', data.recordingLink ?? '');
      }
    }
    if (selectedTypes.includes('live')) {
      formData.append('liveScheduledAt', data.liveScheduledAt ?? '');
      formData.append('liveMeetingLink', data.liveMeetingLink ?? '');
    }
    if (selectedTypes.includes('ilt')) {
      formData.append('iltVenue', data.iltVenue ?? '');
      formData.append('iltScheduledAt', data.iltScheduledAt ?? '');
    }

    mutate(formData);
  };

  if (createdProgram) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center gap-4 px-8">
          <div className="w-9 h-9 rounded-xl bg-mwasalatInk-100 flex items-center justify-center text-mwasalatInk-500 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1E293B]">{createdProgram.title}</p>
            <p className="text-xs text-[#94A3B8]">Step 2 of 2 — Add an assessment quiz</p>
          </div>
        </header>

        <main className="p-8 max-w-2xl mx-auto">
          <div className="card p-5 mb-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-mwasalatInk-100 flex items-center justify-center text-mwasalatInk-500 flex-shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1E293B]">Add an assessment for this course</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Learners must pass this quiz (and submit feedback) to earn a certificate. You can also add or edit
                questions later from the course page.
              </p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <MwasalatQuizBuilder
              programId={createdProgram._id}
              onSaved={() => navigate(`/mwasalat/instructor/programs/${createdProgram._id}`)}
            />
          </div>

          <button
            type="button"
            onClick={() => navigate(`/mwasalat/instructor/programs/${createdProgram._id}`)}
            className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-[#475569] hover:text-mwasalatInk-500 transition-colors mt-4"
          >
            Skip for now — I'll add it later <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center gap-4 px-8">
        <Link to="/mwasalat/instructor/dashboard" className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <p className="text-sm font-semibold text-[#1E293B]">Add Course</p>
          <p className="text-xs text-[#94A3B8]">Create a new training program</p>
        </div>
      </header>

      <main className="p-8 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Course Title</label>
            <input className={inputClass} placeholder="e.g. Defensive Driving Fundamentals" {...register('title', { required: 'Title is required', onChange: () => setAiSuggested(false) })} />
            {errors.title && <p className="text-xs text-[#C22033] mt-1">{errors.title.message}</p>}
            <button
              type="button"
              disabled={!title?.trim() || isAutofilling}
              onClick={() => autofill(title)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-mwasalatInk-500 hover:text-mwasalatInk-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isAutofilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {isAutofilling ? 'Suggesting…' : 'Autofill with AI'}
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-[#1E293B] mb-1.5">
                Category
                {aiSuggested && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-mwasalatInk-500 bg-mwasalatInk-100 px-1.5 py-0.5 rounded-full"><Sparkles className="w-2.5 h-2.5" /> AI Suggested</span>}
              </label>
              <input className={inputClass} placeholder="e.g. Safety Training" {...register('category', { required: 'Category is required' })} />
              {errors.category && <p className="text-xs text-[#C22033] mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Sub-category</label>
              <input className={inputClass} placeholder="e.g. Road Safety" {...register('subCategory')} />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-[#1E293B] mb-1.5">
              Description
              {aiSuggested && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-mwasalatInk-500 bg-mwasalatInk-100 px-1.5 py-0.5 rounded-full"><Sparkles className="w-2.5 h-2.5" /> AI Suggested</span>}
            </label>
            <textarea rows={3} className={inputClass} placeholder="What will learners take away from this course?" {...register('description')} />
          </div>

          {/* Content type multi-select */}
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">Content Type</label>
            <div className="grid sm:grid-cols-2 gap-3">
              {CONTENT_TYPES.map(({ value, label, icon: Icon, hint }) => {
                const active = selectedTypes.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleType(value)}
                    className={`text-left p-3.5 rounded-xl border transition-colors ${
                      active ? 'border-mwasalatInk-500 bg-mwasalatInk-100' : 'border-[#E2E8F0] hover:border-mwasalatInk-300'
                    }`}
                  >
                    <Icon className={`w-4.5 h-4.5 mb-2 ${active ? 'text-mwasalatInk-500' : 'text-[#94A3B8]'}`} />
                    <p className={`text-sm font-semibold ${active ? 'text-mwasalatInk-500' : 'text-[#1E293B]'}`}>{label}</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">{hint}</p>
                  </button>
                );
              })}
            </div>
            {selectedTypes.length === 0 && (
              <p className="text-xs text-[#94A3B8] mt-2">Select one or more — combine any mix of PDF, Recording, Live, and ILT.</p>
            )}
          </div>

          {selectedTypes.includes('pdf') && (
            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0]">
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Upload PDF</label>
              <input
                type="file"
                accept="application/pdf"
                className={inputClass}
                {...register('pdfFile', { required: selectedTypes.includes('pdf') ? 'A PDF file is required' : false })}
              />
              {errors.pdfFile && <p className="text-xs text-[#C22033] mt-1">{errors.pdfFile.message}</p>}
              {pdfFile?.[0] && <p className="text-xs text-mwasalatInk-500 mt-1">{pdfFile[0].name}</p>}
            </div>
          )}

          {selectedTypes.includes('recording') && (
            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0]">
              <div className="flex items-center gap-1.5 mb-3">
                <button
                  type="button"
                  onClick={() => setRecordingMode('link')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    recordingMode === 'link' ? 'bg-mwasalatInk-500 text-white' : 'bg-white text-[#475569] border border-[#E2E8F0]'
                  }`}
                >
                  Paste Link
                </button>
                <button
                  type="button"
                  onClick={() => setRecordingMode('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    recordingMode === 'upload' ? 'bg-mwasalatInk-500 text-white' : 'bg-white text-[#475569] border border-[#E2E8F0]'
                  }`}
                >
                  Upload Video
                </button>
              </div>

              {recordingMode === 'link' ? (
                <>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Recording Link</label>
                  <input
                    className={inputClass}
                    placeholder="Paste a SharePoint, YouTube, or Vimeo link"
                    {...register('recordingLink', { required: recordingMode === 'link' && selectedTypes.includes('recording') ? 'A recording link is required' : false })}
                  />
                  {errors.recordingLink && <p className="text-xs text-[#C22033] mt-1">{errors.recordingLink.message}</p>}
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Upload Video</label>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className={inputClass}
                    {...register('videoFile', { required: recordingMode === 'upload' && selectedTypes.includes('recording') ? 'A video file is required' : false })}
                  />
                  {errors.videoFile && <p className="text-xs text-[#C22033] mt-1">{errors.videoFile.message}</p>}
                  {videoFile?.[0] && <p className="text-xs text-mwasalatInk-500 mt-1">{videoFile[0].name}</p>}
                  <p className="text-xs text-[#94A3B8] mt-1.5">
                    MP4, WebM, or MOV, up to 100MB. Learners get a controlled player — no download, no skipping ahead.
                  </p>
                </>
              )}
            </div>
          )}

          {selectedTypes.includes('live') && (
            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0] space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Date & Time</label>
                <input
                  type="datetime-local"
                  className={inputClass}
                  {...register('liveScheduledAt', { required: selectedTypes.includes('live') ? 'Date and time are required' : false })}
                />
                {errors.liveScheduledAt && <p className="text-xs text-[#C22033] mt-1">{errors.liveScheduledAt.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Meeting Link</label>
                <input
                  className={inputClass}
                  placeholder="Zoom, Google Meet, or Teams link"
                  {...register('liveMeetingLink', { required: selectedTypes.includes('live') ? 'A meeting link is required' : false })}
                />
                {errors.liveMeetingLink && <p className="text-xs text-[#C22033] mt-1">{errors.liveMeetingLink.message}</p>}
              </div>
            </div>
          )}

          {selectedTypes.includes('ilt') && (
            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0] space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Venue</label>
                <input
                  className={inputClass}
                  placeholder="e.g. Mwasalat Training Centre, Muscat"
                  {...register('iltVenue', { required: selectedTypes.includes('ilt') ? 'A venue is required' : false })}
                />
                {errors.iltVenue && <p className="text-xs text-[#C22033] mt-1">{errors.iltVenue.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Date & Time</label>
                <input
                  type="datetime-local"
                  className={inputClass}
                  {...register('iltScheduledAt', { required: selectedTypes.includes('ilt') ? 'Date and time are required' : false })}
                />
                {errors.iltScheduledAt && <p className="text-xs text-[#C22033] mt-1">{errors.iltScheduledAt.message}</p>}
              </div>
              <p className="text-xs text-[#94A3B8]">A QR check-in code will be generated automatically once the course is created.</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Duration</label>
              <input className={inputClass} placeholder="e.g. 3 Days" {...register('duration')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Price (OMR)</label>
              <input type="number" step="0.01" className={inputClass} placeholder="0.00" {...register('price', { valueAsNumber: true })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Expiry Date</label>
            <input type="date" className={inputClass} {...register('expiryDate')} />
            <p className="text-xs text-[#94A3B8] mt-1">Course automatically archives after this date. Leave blank for no expiry.</p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookPlus className="w-4 h-4" />}
            {isPending ? 'Creating…' : 'Create Course'}
          </button>
        </form>
      </main>
    </div>
  );
}
