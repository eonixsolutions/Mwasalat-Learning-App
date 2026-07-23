import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react';
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

// Deterrent-level controlled playback: native controls are replaced with a custom
// bar so forward-seeking past the furthest-watched point can be blocked (dragging,
// clicking ahead, or the element's own `seeking` event all funnel through the same
// checks below) — rewatching backward is always free. Progress is reported to the
// backend on a throttle, not every frame, to stay light on the API.
export default function MwasalatControlledVideoPlayer({ programId }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const lastPingRef = useRef(0);
  const hasResumedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoUrl, setVideoUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    mwasalatProgramService.getVideoUrl(programId)
      .then((data) => {
        setVideoUrl(data.url);
        setDuration(data.durationSeconds ?? 0);
        setFurthest(data.furthestSeconds ?? 0);
      })
      .catch((err) => setError(err.response?.data?.message || t('controlledVideoPlayer.loadFailed')))
      .finally(() => setIsLoading(false));
  }, [programId]);

  const sendProgress = useCallback((position) => {
    if (!duration) return;
    mwasalatProgramService.updateVideoProgress(programId, Math.floor(position), Math.floor(duration)).catch(() => {});
  }, [programId, duration]);

  useEffect(() => () => {
    // Final ping on unmount so leaving mid-video isn't lost.
    if (videoRef.current) sendProgress(videoRef.current.currentTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTimeUpdate = (e) => {
    const t = e.target.currentTime;
    setCurrentTime(t);
    if (t > furthest) {
      setFurthest(t);
      if (t - lastPingRef.current >= PROGRESS_PING_INTERVAL_S) {
        lastPingRef.current = t;
        sendProgress(t);
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
    sendProgress(videoRef.current?.currentTime ?? currentTime);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current.requestFullscreen();
  };

  const handleSeekBarClick = (e) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    // Clamp to furthest-watched — clicking ahead in the locked region does nothing.
    video.currentTime = Math.min(ratio * duration, furthest);
  };

  if (isLoading) {
    return (
      <div className="min-h-[280px] flex items-center justify-center text-white/70 bg-[#0D1117] rounded-2xl">
        <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('controlledVideoPlayer.loading')}
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-sm text-mwasalatRed-300 bg-[#0D1117] rounded-2xl">{error}</div>;
  }

  const watchedPct = duration ? Math.min((furthest / duration) * 100, 100) : 0;
  const playedPct = duration ? Math.min((currentTime / duration) * 100, 100) : 0;

  return (
    // dir="ltr" is intentional: the seek bar's click math is physical-left based
    // and time always reads left-to-right in video players, even in RTL apps —
    // mirroring it would desync the visual scrubber from playback position.
    <div ref={containerRef} dir="ltr" className="relative bg-black rounded-2xl overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full aspect-video bg-black"
        controls={false}
        controlsList="nodownload"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onPlay={() => setIsPlaying(true)}
        onPause={handlePause}
        onClick={togglePlay}
        onLoadedMetadata={(e) => {
          if (!duration) setDuration(e.target.duration);
          // Resume where they left off, once — a later src reload (e.g. the
          // signed URL refreshing) shouldn't yank an actively-rewatching
          // learner back to their furthest point.
          if (!hasResumedRef.current && furthest > 0) {
            e.target.currentTime = furthest;
            setCurrentTime(furthest);
            hasResumedRef.current = true;
          }
        }}
      />

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 sm:px-4 pt-8 pb-3">
        <div
          onClick={handleSeekBarClick}
          className="relative h-1.5 rounded-full bg-white/20 cursor-pointer mb-3"
        >
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${watchedPct}%` }} />
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${playedPct}%`, backgroundColor: TEAL }} />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow"
            style={{ left: `calc(${playedPct}% - 6px)` }}
          />
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
          <button type="button" onClick={toggleFullscreen} className="hover:text-mwasalatInk-300 transition-colors">
            <Maximize className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
