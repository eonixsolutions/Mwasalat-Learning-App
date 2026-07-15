import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, ChevronRight, MessageCircle } from 'lucide-react';
import { themeForCategory } from '../../utils/mwasalatCategoryTheme.js';
import { stageProgress } from '../../utils/mwasalatProgress.js';
import { useMwasalatChatStore } from '../../store/mwasalatChatStore.js';
import MwasalatProgressRoad from './MwasalatProgressRoad.jsx';

export default function MwasalatEnrollmentCard({ enrollment: e, completion: c }) {
  const theme = themeForCategory(e.program?.category);
  const progress = stageProgress(c);
  const unreadCount = useMwasalatChatStore(
    (s) => s.conversations.find((conv) => conv.program?._id === e.program?._id)?.unreadCount ?? 0
  );

  return (
    <Link
      to={`/mwasalat/learner/programs/${e.program?._id}`}
      data-card-id={e.program?._id}
      className="card card-hover overflow-hidden flex flex-col relative"
    >
      {unreadCount > 0 && (
        <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-mwasalatRed-500 text-white shadow-sm z-10">
          <MessageCircle className="w-3 h-3" /> {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${theme.solid}, ${theme.solid}99)` }} />
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${theme.bg} ${theme.text}`}>
            {e.program?.category || 'General'}
          </span>
          {c?.certificateIssued ? (
            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
          )}
        </div>

        <h3 className="text-sm font-semibold text-[#1E293B] leading-snug mb-1 line-clamp-2">{e.program?.title}</h3>
        <p className="text-xs text-[#94A3B8] mb-3">
          {c?.certificateIssued && e.completedAt
            ? `Completed ${new Date(e.completedAt).toLocaleDateString()}`
            : `Enrolled ${new Date(e.purchasedAt).toLocaleDateString()}`}
        </p>

        <div className="mt-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">Progress</span>
            <span className="text-[11px] font-semibold" style={{ color: theme.solid }}>{progress}%</span>
          </div>
          <MwasalatProgressRoad progress={progress} color={theme.solid} size="sm" />
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-mwasalatInk-500 mt-1.5">
            View details <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
