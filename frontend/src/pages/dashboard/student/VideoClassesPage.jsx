import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Video, Loader2, Play, X, BookOpen, MonitorPlay, Lock, IndianRupee } from 'lucide-react';
import { videoService } from '../../../services/video.service.js';
import { courseService } from '../../../services/course.service.js';
import { QK } from '../../../constants/queryKeys.js';
import useBodyScrollLock from '../../../hooks/useBodyScrollLock.js';

const dayLabel = (day) => (day === 0 ? 'Extra' : `Day ${day}`);

function PlayerModal({ video, onClose }) {
  useBodyScrollLock();
  const [showHint, setShowHint] = useState(true);

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#0D1117] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl">

          {/* Modal header */}
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#CA6357] flex items-center justify-center flex-shrink-0">
                <MonitorPlay className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{video.title}</p>
                <p className="text-[11px] text-white/40">Week {video.week} · {dayLabel(video.day ?? 0)}</p>
              </div>
            </div>
            <button onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 ml-4">
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Microsoft sign-in hint */}
          {showHint && (
            <div className="mx-5 mb-3 flex items-start gap-2.5 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-[#C45E52] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-[11px] text-white/50 leading-relaxed flex-1">
                If the video shows a black screen, make sure you are signed into your <strong className="text-white/70">Microsoft account</strong> in this browser first, then reload the page.
              </p>
              <button onClick={() => setShowHint(false)} className="text-white/30 hover:text-white/60 flex-shrink-0 ml-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* iframe player */}
          <div style={{ aspectRatio: '16/9' }}>
            <iframe
              src={video.embedUrl}
              title={video.title}
              className="w-full h-full"
              style={{ border: 'none' }}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
          </div>

          {/* Description */}
          {video.description && (
            <div className="px-5 py-4 border-t border-white/10">
              <p className="text-sm text-white/60 leading-relaxed">{video.description}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function VideoCard({ video, onWatch }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden transition-shadow hover:shadow-md"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>

      {/* Thumbnail area */}
      <div className="relative bg-gradient-to-br from-[#CA6357] to-[#A94E43]"
        style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </div>
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            {video.duration}
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-sm font-semibold text-[#1E293B] leading-snug mb-1 line-clamp-2">{video.title}</p>
        {video.description && (
          <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-2 mb-3">{video.description}</p>
        )}
        <button onClick={() => onWatch(video)}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors">
          <Play className="w-3 h-3 fill-white" /> Watch
        </button>
      </div>
    </div>
  );
}

export default function VideoClassesPage() {
  const [selectedWeek, setSelectedWeek]   = useState(1);
  const [playingVideo, setPlayingVideo]   = useState(null);

  const { data: videos = [], isLoading, isError } = useQuery({
    queryKey: ['videos', 'my'],
    queryFn: videoService.getMyVideos,
  });

  const { data: enrollment } = useQuery({
    queryKey: QK.ENROLLMENT,
    queryFn: courseService.getMyEnrollment,
  });

  // null feeAccount → no fee structure → all weeks open
  const feeAccount           = enrollment?.feeAccount ?? null;
  const accessValidUntilWeek = feeAccount ? (feeAccount.accessValidUntilWeek ?? 0) : Infinity;
  const isWeekLocked         = (w) => w > accessValidUntilWeek;

  // Group videos by week
  const byWeek = videos.reduce((acc, v) => {
    if (!acc[v.week]) acc[v.week] = [];
    acc[v.week].push(v);
    return acc;
  }, {});

  const weeks = Object.keys(byWeek).map(Number).sort((a, b) => a - b);

  // Default to the first accessible week when videos load
  const firstUnlockedWeek = weeks.find(w => !isWeekLocked(w)) ?? weeks[0] ?? 1;
  const activeWeek        = weeks.includes(selectedWeek) ? selectedWeek : firstUnlockedWeek;

  const currentWeekVideos = byWeek[activeWeek] ?? [];
  const currentWeekLocked = isWeekLocked(activeWeek);

  // Group current week videos by day
  const byDay = currentWeekVideos.reduce((acc, v) => {
    if (!acc[v.day]) acc[v.day] = [];
    acc[v.day].push(v);
    return acc;
  }, {});

  const dayKeys = Object.keys(byDay).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <MonitorPlay className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">Zero2Code</p>
            <h2 className="text-2xl font-bold text-white mb-1">Video Classes</h2>
            <p className="text-white/60 text-sm">{videos.length} recording{videos.length !== 1 ? 's' : ''} available</p>
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
        </div>
      )}

      {isError && (
        <div className="bg-white rounded-2xl p-10 flex flex-col items-center text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <p className="text-base font-bold text-[#1E293B] mb-2">Failed to load videos</p>
          <p className="text-sm text-[#94A3B8]">Please refresh the page or contact your coordinator.</p>
        </div>
      )}

      {!isLoading && !isError && videos.length === 0 && (
        <div className="bg-white rounded-2xl p-10 flex flex-col items-center text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div className="w-16 h-16 rounded-2xl bg-[#FDEFEE] flex items-center justify-center mb-5">
            <Video className="w-8 h-8 text-[#CA6357]" strokeWidth={1.5} />
          </div>
          <p className="text-base font-bold text-[#1E293B] mb-2">No videos yet</p>
          <p className="text-sm text-[#94A3B8] max-w-xs">Recorded sessions will appear here once your mentor publishes them.</p>
        </div>
      )}

      {!isLoading && !isError && videos.length > 0 && (
        <>
          {/* Week tabs */}
          <div className="flex gap-1 bg-white rounded-2xl p-1.5 overflow-x-auto" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            {weeks.map((w) => {
              const locked = isWeekLocked(w);
              const active = activeWeek === w;
              return (
                <button key={w} onClick={() => setSelectedWeek(w)}
                  className={`flex-shrink-0 inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                    active && locked  ? 'bg-[#D96C5F] text-white'
                    : active          ? 'bg-[#CA6357] text-white'
                    : locked          ? 'text-[#D96C5F] hover:bg-[#FEE2E2]'
                    :                   'text-[#475569] hover:bg-[#F8F9FB]'
                  }`}>
                  {locked ? <Lock className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                  Week {w}
                  {!locked && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/25 text-white' : 'bg-[#FDEFEE] text-[#CA6357]'}`}>
                      {(byWeek[w] ?? []).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Fee gate — shown when selected week is locked */}
          {currentWeekLocked ? (
            <div className="bg-white rounded-2xl p-10 flex flex-col items-center text-center"
              style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1.5px solid #F2B3AC' }}>
              <div className="w-16 h-16 rounded-2xl bg-[#FBE9E7] flex items-center justify-center mb-5">
                <Lock className="w-8 h-8 text-[#D96C5F]" strokeWidth={1.5} />
              </div>
              <p className="text-base font-bold text-[#1E293B] mb-1">Week {activeWeek} is locked</p>
              <p className="text-sm text-[#94A3B8] max-w-xs leading-relaxed mb-5">
                {accessValidUntilWeek === 0
                  ? 'No fee installment paid yet. Submit your receipt to unlock your first week of content.'
                  : `Your fee covers up to Week ${accessValidUntilWeek}. Submit your next installment receipt to unlock Week ${selectedWeek}.`}
              </p>
              <Link to="/student/fees"
                className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
                <IndianRupee className="w-4 h-4" /> Submit Receipt
              </Link>
            </div>
          ) : currentWeekVideos.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 flex flex-col items-center text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
              <p className="text-sm text-[#94A3B8]">No videos published for Week {activeWeek} yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {dayKeys.map((dayNum) => (
                <div key={dayNum}>
                  {/* Day label */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-[#FDEFEE] text-[#CA6357] font-bold text-[11px] flex items-center justify-center">
                      {dayNum === 0 ? '★' : dayNum}
                    </div>
                    <p className="text-sm font-bold text-[#1E293B]">{dayLabel(dayNum)}</p>
                    <div className="flex-1 h-px bg-[#F1F5F9]" />
                    <span className="text-xs text-[#94A3B8]">{byDay[dayNum].length} video{byDay[dayNum].length !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {byDay[dayNum].map((video) => (
                      <VideoCard key={video._id} video={video} onWatch={setPlayingVideo} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Player modal */}
      {playingVideo && (
        <PlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}
    </div>
  );
}
