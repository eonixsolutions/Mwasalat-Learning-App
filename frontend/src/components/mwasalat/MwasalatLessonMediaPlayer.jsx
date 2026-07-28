import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2, Music } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

const PROGRESS_PING_INTERVAL_S = 7;
const TEAL = '#23181A';

const formatTime = (s) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

// Module-lesson analogue of MwasalatControlledVideoPlayer — same
// furthest-watched tracking + forward-seek blocking, just keyed by
// {programId, lessonId} instead of a single scalar per course, and shared
// between video and audio lessons (audio just skips the <video> visual and
// shows a compact bar instead).
export default function MwasalatLessonMediaPlayer({ programId, moduleId, lessonId, mediaType, onOpened }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const mediaRef = useRef(null);
  const containerRef = useRef(null);
  const lastPingRef = useRef(0);
  const hasResumedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [mediaUrl, setMediaUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError('');
    hasResumedRef.current = false;
    mwasalatProgramService.getLessonMediaUrl(programId, moduleId, lessonId)
      .then((data) => {
        setMediaUrl(data.url);
        setDuration(data.durationSeconds ?? 0);
        setFurthest(data.furthestSeconds ?? 0);
      })
      .catch((err) => setError(err.response?.data?.message || t('controlledVideoPlayer.loadFailed')))
      .finally(() => setIsLoading(false));
  }, [programId, moduleId, lessonId]);

  const sendProgress = useCallback((position) => {
    if (!duration) return;
    mwasalatProgramService.updateLessonMediaProgress(programId, moduleId, lessonId, Math.floor(position), Math.floor(duration))
      .then((res) => { if (res?.watchedEnough) onOpened?.(); })
      .catch(() => {});
  }, [programId, moduleId, lessonId, duration, onOpened]);

  useEffect(() => () => {
    if (mediaRef.current) sendProgress(mediaRef.current.currentTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const handleTimeUpdate = (e) => {
    const time = e.target.currentTime;
    setCurrentTime(time);
    if (time > furthest) {
      setFurthest(time);
      if (time - lastPingRef.current >= PROGRESS_PING_INTERVAL_S) {
        lastPingRef.current = time;
        sendProgress(time);
      }
    }
  };

  const handleSeeking = (e) => {
    if (e.target.currentTime > furthest + 0.5) {
      e.target.currentTime = furthest;
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    sendProgress(mediaRef.current?.currentTime ?? currentTime);
  };

  const togglePlay = () => {
    const media = mediaRef.current;
    if (!media) return;
    if (media.paused) media.play();
    else media.pause();
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;
    media.muted = !media.muted;
    setIsMuted(media.muted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current || mediaType !== 'video') return;
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current.requestFullscreen();
  };

  const handleSeekBarClick = (e) => {
    const media = mediaRef.current;
    if (!media || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    media.currentTime = Math.min(ratio * duration, furthest);
  };

  if (isLoading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center text-white/70 bg-[#0D1117] rounded-2xl">
        <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('controlledVideoPlayer.loading')}
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-sm text-mwasalatRed-300 bg-[#0D1117] rounded-2xl">{error}</div>;
  }

  const watchedPct = duration ? Math.min((furthest / duration) * 100, 100) : 0;
  const playedPct = duration ? Math.min((currentTime / duration) * 100, 100) : 0;

  const MediaTag = mediaType === 'audio' ? 'audio' : 'video';

  return (
    <div ref={containerRef} dir="ltr" className={`relative bg-black rounded-2xl overflow-hidden ${mediaType === 'audio' ? 'p-6' : ''}`}>
      {mediaType === 'audio' && (
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
            <Music className="w-6 h-6 text-white/80" />
          </div>
        </div>
      )}
      <MediaTag
        ref={mediaRef}
        src={mediaUrl}
        className={mediaType === 'audio' ? 'hidden' : 'w-full aspect-video bg-black'}
        controls={false}
        controlsList="nodownload"
        disablePictureInPicture={mediaType === 'video' ? true : undefined}
        onContextMenu={(e) => e.preventDefault()}
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onPlay={() => setIsPlaying(true)}
        onPause={handlePause}
        onClick={mediaType === 'video' ? togglePlay : undefined}
        onLoadedMetadata={(e) => {
          if (!duration) setDuration(e.target.duration);
          if (!hasResumedRef.current && furthest > 0) {
            e.target.currentTime = furthest;
            setCurrentTime(furthest);
            hasResumedRef.current = true;
          }
        }}
      />

      <div className={mediaType === 'audio' ? 'px-1 pb-1' : 'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 sm:px-4 pt-8 pb-3'}>
        <div onClick={handleSeekBarClick} className="relative h-1.5 rounded-full bg-white/20 cursor-pointer mb-3">
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${watchedPct}%` }} />
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${playedPct}%`, backgroundColor: TEAL }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow" style={{ left: `calc(${playedPct}% - 6px)` }} />
        </div>

        <div className="flex items-center gap-3 text-white">
          <button type="button" onClick={togglePlay} className="hover:text-mwasalatInk-300 transition-colors">
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button type="button" onClick={toggleMute} className="hover:text-mwasalatInk-300 transition-colors">
            {isMuted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
          </button>
          <span className="text-xs text-white/80 font-mono">{localizeNumber(formatTime(currentTime), i18n.language)} / {localizeNumber(formatTime(duration), i18n.language)}</span>
          <div className="flex-1" />
          {mediaType === 'video' && (
            <button type="button" onClick={toggleFullscreen} className="hover:text-mwasalatInk-300 transition-colors">
              <Maximize className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
