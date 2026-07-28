import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Video, Radio, MapPin, ExternalLink, CheckCircle2, Lock } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

// Calendar-day equality (not a 24h window) — a class scheduled 9am today is
// still "today" at 11pm, but no longer joinable once the date rolls over.
const isSameCalendarDay = (a, b) => a.getFullYear() === b.getFullYear()
  && a.getMonth() === b.getMonth()
  && a.getDate() === b.getDate();

export default function MwasalatContentAccess({ program, openedContentTypes = [], pdfProgress = null, onContentOpened }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const locale = i18n.language === 'ar' ? 'ar-OM' : 'en-GB';
  const types = program?.contentTypes ?? [];
  const pdfFinished = openedContentTypes.includes('pdf');
  const isDayBasedPdf = Boolean(pdfProgress);
  const pdfPercent = isDayBasedPdf
    ? Math.min(100, Math.round((pdfProgress.openedDays / pdfProgress.totalDays) * 100))
    : 0;
  // The daily click both records today's read and, once it's the day that
  // crosses the required-days threshold, finalizes the PDF — so on that final
  // day the same button is presented as the explicit "complete" action.
  const isFinalPdfDay = isDayBasedPdf && !pdfProgress.openedToday && pdfProgress.openedDays >= pdfProgress.totalDays - 1;

  const liveScheduledAt = program?.liveScheduledAt ? new Date(program.liveScheduledAt) : null;
  const isLiveDayToday = liveScheduledAt ? isSameCalendarDay(liveScheduledAt, new Date()) : true;

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
      {types.includes('pdf') && (program.documents?.length > 0 || program.pdfUrl) && (
        <div className="space-y-1.5">
          {program.documents?.length > 0 ? (
            program.documents.map((doc, index) => (
              <a
                key={doc._id ?? doc.url}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[#E2E8F0] hover:border-mwasalatInk-300 text-sm font-medium text-[#1E293B] transition-colors"
              >
                <FileText className="w-4 h-4 text-mwasalatInk-500 flex-shrink-0" />
                <span className="truncate">{doc.name || t('contentAccess.viewPdf')}</span>
                {program.documents.length > 1 && (
                  <span className="text-[10px] text-[#94A3B8] flex-shrink-0">{localizeNumber(index + 1, i18n.language)}/{localizeNumber(program.documents.length, i18n.language)}</span>
                )}
                <ExternalLink className="w-3 h-3 text-[#94A3B8] ms-auto rtl:scale-x-[-1] flex-shrink-0" />
              </a>
            ))
          ) : (
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
          )}
          {isDayBasedPdf && !pdfFinished && (
            <div className="px-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-[#94A3B8]">
                  {t('contentAccess.pdfDayProgress', { done: pdfProgress.openedDays, total: pdfProgress.totalDays })}
                </p>
                <p className="text-[11px] font-semibold text-mwasalatInk-500">{localizeNumber(pdfPercent, i18n.language)}%</p>
              </div>
              <div className="h-1.5 w-full rounded-full bg-mwasalatInk-100 overflow-hidden">
                <div className="h-full rounded-full bg-mwasalatInk-400 transition-all" style={{ width: `${pdfPercent}%` }} />
              </div>
            </div>
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
              <CheckCircle2 className="w-4 h-4" />
              {!isDayBasedPdf || isFinalPdfDay ? t('contentAccess.completeFullPdf') : t('contentAccess.markTodayDone')}
            </button>
          )}
        </div>
      )}

      {types.includes('recording') && (program.recordingLink || program.recordingVideoPublicId) && (
        // No onClick "opened" credit here on purpose — that would mark the
        // recording finished the instant this link is clicked, before any
        // actual watching happens. Real credit comes from watch tracking:
        // MwasalatWatchRecordingPage marks a pasted-link recording opened on
        // load (no visibility into a third-party player's progress), while an
        // uploaded video only counts once updateVideoProgress crosses 90%
        // watched (see MwasalatControlledVideoPlayer).
        <Link
          to={`/learner/programs/${program._id}/watch`}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[#E2E8F0] hover:border-mwasalatInk-300 text-sm font-medium text-[#1E293B] transition-colors"
        >
          <Video className="w-4 h-4 text-mwasalatInk-500 flex-shrink-0" />
          {t('contentAccess.watchRecording')}
        </Link>
      )}

      {types.includes('live') && program.liveMeetingLink && (
        isLiveDayToday ? (
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
        ) : (
          <div
            aria-disabled="true"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-dashed border-[#E2E8F0] text-sm font-medium text-[#94A3B8] cursor-not-allowed select-none"
          >
            <Radio className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
            <span className="flex-1 text-start">
              {t('contentAccess.joinLiveClass')}
              {program.liveScheduledAt && (
                <span className="block text-xs text-[#94A3B8] font-normal">
                  {t('contentAccess.liveClassLocked', { date: localizeNumber(liveScheduledAt.toLocaleString(locale), i18n.language) })}
                </span>
              )}
            </span>
            <Lock className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0" />
          </div>
        )
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
