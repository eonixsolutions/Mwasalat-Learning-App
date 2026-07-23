import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Video, Radio, MapPin, ExternalLink, CheckCircle2 } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

export default function MwasalatContentAccess({ program, openedContentTypes = [], pdfProgress = null, onContentOpened }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const locale = i18n.language === 'ar' ? 'ar-OM' : 'en-GB';
  const types = program?.contentTypes ?? [];
  const pdfFinished = openedContentTypes.includes('pdf');
  const isDayBasedPdf = Boolean(pdfProgress);

  // Fire-and-forget: marks this specific content type as opened. The
  // assessment only unlocks once every content type on the course has been
  // opened at least once — see markContentOpened on the backend.
  const notifyOpened = (contentType) => {
    if (program?._id) mwasalatProgramService.markContentOpened(program._id, contentType).catch(() => {});
  };

  const handleFinishPdf = () => {
    notifyOpened('pdf');
    onContentOpened?.();
  };

  // Meeting links (Zoom/Meet/Teams) open in a small contained popup instead
  // of a full browser tab — a full tab takes over the whole screen with no
  // obvious way back to the app; a sized popup makes it clear it's a
  // secondary window that can just be closed to return here.
  const openLiveMeeting = (e) => {
    e.preventDefault();
    notifyOpened('live');
    window.open(program.liveMeetingLink, 'mwasalat-live-class', 'noopener,noreferrer,width=1100,height=720');
  };

  if (types.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {types.includes('pdf') && program.pdfUrl && (
        <div className="space-y-1.5">
          <a
            href={program.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[#E2E8F0] hover:border-mwasalatInk-300 text-sm font-medium text-[#1E293B] transition-colors"
          >
            <FileText className="w-4 h-4 text-mwasalatInk-500 flex-shrink-0" />
            {t('contentAccess.viewPdf')}
            <ExternalLink className="w-3 h-3 text-[#94A3B8] ms-auto rtl:scale-x-[-1]" />
          </a>
          {isDayBasedPdf && !pdfFinished && (
            <p className="text-[11px] font-medium text-[#94A3B8] px-1">
              {t('contentAccess.pdfDayProgress', { done: pdfProgress.openedDays, total: pdfProgress.totalDays })}
            </p>
          )}
          {pdfFinished ? (
            <p className="flex items-center gap-1.5 text-xs font-medium text-[#22C55E] px-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('contentAccess.markedFinished')}
            </p>
          ) : isDayBasedPdf && pdfProgress.openedToday ? (
            <p className="flex items-center gap-1.5 text-xs font-medium text-[#94A3B8] px-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('contentAccess.markedToday')}
            </p>
          ) : (
            <button
              type="button"
              onClick={handleFinishPdf}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-mwasalatInk-100 hover:bg-mwasalatInk-200 text-mwasalatInk-500 text-sm font-medium transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" /> {isDayBasedPdf ? t('contentAccess.markTodayDone') : t('contentAccess.markAsFinished')}
            </button>
          )}
        </div>
      )}

      {types.includes('recording') && (program.recordingLink || program.recordingVideoPublicId) && (
        <Link
          to={`/mwasalat/learner/programs/${program._id}/watch`}
          onClick={() => notifyOpened('recording')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[#E2E8F0] hover:border-mwasalatInk-300 text-sm font-medium text-[#1E293B] transition-colors"
        >
          <Video className="w-4 h-4 text-mwasalatInk-500 flex-shrink-0" />
          {t('contentAccess.watchRecording')}
        </Link>
      )}

      {types.includes('live') && program.liveMeetingLink && (
        <a
          href={program.liveMeetingLink}
          onClick={openLiveMeeting}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[#E2E8F0] hover:border-mwasalatInk-300 text-sm font-medium text-[#1E293B] transition-colors"
        >
          <Radio className="w-4 h-4 text-mwasalatInk-500 flex-shrink-0" />
          <span className="flex-1 text-start">
            {t('contentAccess.joinLiveClass')}
            {program.liveScheduledAt && (
              <span className="block text-xs text-[#94A3B8] font-normal">{localizeNumber(new Date(program.liveScheduledAt).toLocaleString(locale), i18n.language)}</span>
            )}
          </span>
          <ExternalLink className="w-3 h-3 text-[#94A3B8] rtl:scale-x-[-1]" />
        </a>
      )}

      {types.includes('ilt') && program.iltVenue && (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#F8F9FB] text-sm text-[#475569]">
          <MapPin className="w-4 h-4 text-mwasalatInk-500 flex-shrink-0" />
          <span>
            {program.iltVenue}
            {program.iltScheduledAt && (
              <span className="block text-xs text-[#94A3B8]">
                {localizeNumber(t('contentAccess.scheduledCheckInNote', { date: new Date(program.iltScheduledAt).toLocaleString(locale) }), i18n.language)}
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
