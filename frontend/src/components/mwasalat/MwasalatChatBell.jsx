import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Inbox } from 'lucide-react';
import { mwasalatChatService } from '../../services/mwasalatChat.service.js';
import { useMwasalatChatStore } from '../../store/mwasalatChatStore.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import useMwasalatChatSocket from '../../hooks/useMwasalatChatSocket.js';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function MwasalatChatBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { user } = useMwasalatAuthStore();
  const { conversations, unreadTotal, setConversations, clearUnread } = useMwasalatChatStore();

  useMwasalatChatSocket();

  useEffect(() => {
    mwasalatChatService.listMyConversations().then(setConversations).catch(() => {});
  }, [setConversations]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openConversation = (conversation) => {
    setOpen(false);
    clearUnread(conversation._id);
    const iAmLearner = String(conversation.learner?._id) === String(user?._id);
    if (iAmLearner) {
      navigate(`/mwasalat/learner/programs/${conversation.program?._id}/chat`);
    } else {
      navigate(`/mwasalat/instructor/programs/${conversation.program?._id}/chat/${conversation.learner?._id}`);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        {unreadTotal > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-mwasalatRed-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadTotal > 9 ? '9+' : unreadTotal}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-white rounded-2xl border border-[#E2E8F0] z-50 overflow-hidden"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
            <p className="text-sm font-semibold text-[#1E293B]">Messages</p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <Inbox className="w-6 h-6 text-[#94A3B8] mx-auto mb-2" />
                <p className="text-xs text-[#94A3B8]">No conversations yet</p>
              </div>
            ) : (
              conversations.map((c) => {
                const iAmLearner = String(c.learner?._id) === String(user?._id);
                const otherName = iAmLearner ? c.instructor?.name : c.learner?.name;
                const hasUnread = (c.unreadCount ?? 0) > 0;
                return (
                  <button
                    key={c._id}
                    onClick={() => openConversation(c)}
                    className={`w-full text-left flex items-start gap-2.5 px-4 py-3 border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8F9FB] transition-colors ${
                      hasUnread ? 'bg-mwasalatInk-100/40' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-mwasalatInk-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-0.5">
                      {otherName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${hasUnread ? 'font-bold text-[#1E293B]' : 'font-semibold text-[#1E293B]'}`}>
                          {otherName ?? 'Unknown'}
                        </p>
                        {hasUnread && (
                          <span className="min-w-[16px] h-4 px-1 rounded-full bg-mwasalatRed-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {c.unreadCount > 9 ? '9+' : c.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#94A3B8] truncate">{c.program?.title}</p>
                      {c.lastMessagePreview && (
                        <p className={`text-xs mt-0.5 truncate ${hasUnread ? 'text-[#475569] font-medium' : 'text-[#94A3B8]'}`}>
                          {c.lastMessagePreview}
                        </p>
                      )}
                      <p className="text-[10px] text-[#94A3B8] mt-1">{timeAgo(c.lastMessageAt)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
