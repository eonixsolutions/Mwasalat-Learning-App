import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Video, Loader2, ExternalLink } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import MwasalatControlledVideoPlayer from '../../components/mwasalat/MwasalatControlledVideoPlayer.jsx';
import { getLocalizedProgramField } from '../../utils/mwasalatLocalize.js';

// Normalize common video links into embeddable iframe URLs.
// Returns null if the link isn't a valid absolute URL — an iframe with a bad
// src (undefined/relative) can end up loading the current page inside itself.
const toEmbeddableUrl = (link) => {
  if (!link) return null;
  let url;
  try {
    url = new URL(link);
  } catch {
    return null; // not an absolute URL — refuse to embed it
  }
  if (url.hostname.includes('youtube.com') || url.hostname === 'youtu.be') {
    const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v');
    if (id) return `https://www.youtube.com/embed/${id}`;
  }
  if (url.hostname.includes('vimeo.com')) {
    const id = url.pathname.match(/\/(\d+)/)?.[1];
    if (id) return `https://player.vimeo.com/video/${id}`;
  }
  return url.href; // SharePoint embed.aspx and similar already embed-ready
};

export default function MwasalatWatchRecordingPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    mwasalatProgramService.getById(id).then((p) => {
      setProgram(p);
      // Uploaded videos earn content-credit from real watch-time (see
      // MwasalatControlledVideoPlayer) — only pasted-link recordings (no visibility
      // into a third-party player) still mark "opened" the moment the page loads.
      if (!p.recordingVideoPublicId) {
        mwasalatProgramService.markContentOpened(id, 'recording').catch(() => {});
      }
    }).finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center text-white/70">
        <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('learnerWatch.loading')}
      </div>
    );
  }

  const embedUrl = toEmbeddableUrl(program?.recordingLink);

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col">
      <header className="h-16 flex items-center justify-between px-5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-mwasalatInk-500/20 flex items-center justify-center flex-shrink-0">
            <Video className="w-4 h-4 text-mwasalatInk-400" />
          </div>
          <p className="text-sm font-medium text-white truncate">{getLocalizedProgramField(program, 'title', i18n.language)}</p>
        </div>
      </header>

      {program?.recordingVideoPublicId ? (
        <div className="flex-1 min-h-0 flex items-center justify-center p-2 sm:p-4">
          <div className="relative w-full" style={{ maxWidth: 'calc((100vh - 4rem) * 16 / 9)' }}>
            <MwasalatControlledVideoPlayer programId={id} />
          </div>
        </div>
      ) : embedUrl ? (
        <div className="flex-1 min-h-0 flex items-center justify-center p-2 sm:p-4">
          {/* Sized to true 16:9 first (capped by whichever of width/height runs out),
              so the video fills its box edge to edge instead of the player itself
              letterboxing inside an oddly-shaped container. */}
          <div className="relative w-full" style={{ maxWidth: 'calc((100vh - 4rem) * 16 / 9)' }}>
            <div style={{ paddingTop: '56.25%' }} />
            <iframe
              src={embedUrl}
              title={getLocalizedProgramField(program, 'title', i18n.language)}
              className="absolute inset-0 w-full h-full"
              style={{ border: 'none' }}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-10 text-center">
          <div>
            <p className="text-sm text-white/70 mb-4">{t('learnerWatch.cantPlayInline')}</p>
            <a
              href={program?.recordingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              {t('learnerWatch.openRecording')} <ExternalLink className="w-4 h-4 rtl:scale-x-[-1]" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
