import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Loader2, Plus, Send, Pin, PinOff, CheckCircle2, RotateCcw, Trash2, MessagesSquare, X,
} from 'lucide-react';
import { mwasalatDiscussionService } from '../../services/mwasalatDiscussion.service.js';
import useMwasalatDiscussionSocket from '../../hooks/useMwasalatDiscussionSocket.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

// Same "just now / 5m ago" convention as MwasalatNotificationBell's local timeAgo.
function useTimeAgo() {
  const { t, i18n } = useTranslation('mwasalatApp');
  return (dateStr) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return t('common.justNow');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return localizeNumber(t('common.minutesAgo', { count: minutes }), i18n.language);
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return localizeNumber(t('common.hoursAgo', { count: hours }), i18n.language);
    const days = Math.floor(hours / 24);
    return localizeNumber(t('common.daysAgo', { count: days }), i18n.language);
  };
}

function Avatar({ name }) {
  return (
    <div className="w-8 h-8 rounded-full bg-mwasalatInk-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

function ThreadRow({ thread, onOpen }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const timeAgo = useTimeAgo();
  return (
    <button
      type="button"
      onClick={() => onOpen(thread._id)}
      className="w-full text-start flex items-start gap-3 px-5 py-4 border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8F9FB] transition-colors"
    >
      <Avatar name={thread.authorName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          {thread.isPinned && <Pin className="w-3 h-3 text-mwasalatRed-500 flex-shrink-0" />}
          <p className="text-sm font-semibold text-[#1E293B] truncate">{thread.title}</p>
          {thread.isResolved && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#DCFCE7] text-[#16A34A] flex-shrink-0">
              <CheckCircle2 className="w-3 h-3" /> {t('discussion.resolved')}
            </span>
          )}
        </div>
        <p className="text-xs text-[#94A3B8] line-clamp-1 mb-1">{thread.body}</p>
        <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
          <span className="font-medium text-[#475569]">{thread.authorName}</span>
          <span>·</span>
          <span>{timeAgo(thread.lastReplyAt ?? thread.createdAt)}</span>
          <span>·</span>
          <span>{localizeNumber(t('discussion.replyCount', { count: thread.replyCount }), i18n.language)}</span>
        </div>
      </div>
    </button>
  );
}

function ReplyRow({ reply, canDelete, onDelete }) {
  const { t } = useTranslation('mwasalatApp');
  const timeAgo = useTimeAgo();
  return (
    <div className="flex items-start gap-3 py-4 border-b border-[#F1F5F9] last:border-0">
      <Avatar name={reply.authorName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-[#1E293B]">{reply.authorName}</p>
            {reply.authorRole === 'instructor' && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-mwasalatInk-100 text-mwasalatInk-500">
                {t('common.roles.instructor')}
              </span>
            )}
            <span className="text-[11px] text-[#94A3B8]">{timeAgo(reply.createdAt)}</span>
          </div>
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(reply._id)}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-mwasalatRed-100 hover:text-mwasalatRed-600 transition-colors flex-shrink-0"
              title={t('discussion.deleteReply')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="text-sm text-[#475569] leading-relaxed mt-1 whitespace-pre-wrap break-words">{reply.body}</p>
      </div>
    </div>
  );
}

export default function MwasalatDiscussionPanel({ programId, currentUser, programTitle, backTo }) {
  const { t, i18n } = useTranslation('mwasalatApp');

  const [view, setView] = useState('list');
  const [threads, setThreads] = useState([]);
  const [canModerate, setCanModerate] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);

  const [activeThread, setActiveThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [isLoadingThread, setIsLoadingThread] = useState(false);

  const [showComposer, setShowComposer] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const loadThreads = useCallback(() => {
    setIsLoadingList(true);
    mwasalatDiscussionService.listThreads(programId)
      .then(({ threads: list, canModerate: mod }) => {
        setThreads(list);
        setCanModerate(mod);
      })
      .finally(() => setIsLoadingList(false));
  }, [programId]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const openThread = (threadId) => {
    setView('detail');
    setIsLoadingThread(true);
    mwasalatDiscussionService.getThread(threadId)
      .then(({ thread, replies: list }) => {
        setActiveThread(thread);
        setReplies(list);
      })
      .catch(() => toast.error(t('discussion.loadThreadFailed')))
      .finally(() => setIsLoadingThread(false));
  };

  const backToList = () => {
    setView('list');
    setActiveThread(null);
    setReplies([]);
  };

  // Real-time sync — dedupe by _id since the actor's own REST response already
  // applies the change locally before the broadcast round-trips back.
  useMwasalatDiscussionSocket(programId, {
    onThread: (thread) => {
      setThreads((prev) => (prev.some((t2) => t2._id === thread._id) ? prev : [thread, ...prev]));
    },
    onReply: ({ threadId, reply, replyCount, lastReplyAt }) => {
      setThreads((prev) => prev.map((t2) => (t2._id === threadId ? { ...t2, replyCount, lastReplyAt } : t2)));
      setActiveThread((prev) => (prev && prev._id === threadId ? { ...prev, replyCount, lastReplyAt } : prev));
      setReplies((prev) => (prev.some((r) => r._id === reply._id) ? prev : [...prev, reply]));
    },
    onThreadUpdated: (thread) => {
      setThreads((prev) => prev
        .map((t2) => (t2._id === thread._id ? thread : t2))
        .sort((a, b) => (b.isPinned - a.isPinned) || (new Date(b.lastReplyAt ?? b.createdAt) - new Date(a.lastReplyAt ?? a.createdAt))));
      setActiveThread((prev) => (prev && prev._id === thread._id ? thread : prev));
    },
    onThreadDeleted: ({ threadId }) => {
      setThreads((prev) => prev.filter((t2) => t2._id !== threadId));
      setActiveThread((prev) => {
        if (prev && prev._id === threadId) {
          toast(t('discussion.threadRemoved'));
          setView('list');
          return null;
        }
        return prev;
      });
    },
    onReplyDeleted: ({ threadId, replyId, replyCount }) => {
      setThreads((prev) => prev.map((t2) => (t2._id === threadId ? { ...t2, replyCount } : t2)));
      setActiveThread((prev) => (prev && prev._id === threadId ? { ...prev, replyCount } : prev));
      setReplies((prev) => prev.filter((r) => r._id !== replyId));
    },
  });

  const handlePostThread = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim() || isPosting) return;
    setIsPosting(true);
    try {
      const thread = await mwasalatDiscussionService.createThread(programId, { title: newTitle, body: newBody });
      setThreads((prev) => (prev.some((t2) => t2._id === thread._id) ? prev : [thread, ...prev]));
      setNewTitle('');
      setNewBody('');
      setShowComposer(false);
    } catch (err) {
      toast.error(err.response?.data?.message || t('discussion.postFailed'));
    } finally {
      setIsPosting(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed || isReplying || !activeThread) return;
    setIsReplying(true);
    try {
      const reply = await mwasalatDiscussionService.addReply(activeThread._id, trimmed);
      setReplies((prev) => (prev.some((r) => r._id === reply._id) ? prev : [...prev, reply]));
      setActiveThread((prev) => (prev ? { ...prev, replyCount: prev.replyCount + 1, lastReplyAt: reply.createdAt } : prev));
      setReplyText('');
    } catch (err) {
      toast.error(err.response?.data?.message || t('discussion.replyFailed'));
    } finally {
      setIsReplying(false);
    }
  };

  const handleDeleteThread = async () => {
    if (!activeThread || !window.confirm(t('discussion.confirmDeleteThread'))) return;
    try {
      await mwasalatDiscussionService.deleteThread(activeThread._id);
      setThreads((prev) => prev.filter((t2) => t2._id !== activeThread._id));
      backToList();
    } catch (err) {
      toast.error(err.response?.data?.message || t('discussion.deleteFailed'));
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm(t('discussion.confirmDeleteReply'))) return;
    try {
      await mwasalatDiscussionService.deleteReply(replyId);
      setReplies((prev) => prev.filter((r) => r._id !== replyId));
      setActiveThread((prev) => (prev ? { ...prev, replyCount: Math.max(0, prev.replyCount - 1) } : prev));
    } catch (err) {
      toast.error(err.response?.data?.message || t('discussion.deleteFailed'));
    }
  };

  const handleTogglePin = async () => {
    if (!activeThread) return;
    try {
      const thread = await mwasalatDiscussionService.togglePin(activeThread._id);
      setActiveThread(thread);
    } catch (err) {
      toast.error(err.response?.data?.message || t('discussion.updateFailed'));
    }
  };

  const handleToggleResolved = async () => {
    if (!activeThread) return;
    try {
      const thread = await mwasalatDiscussionService.toggleResolved(activeThread._id);
      setActiveThread(thread);
    } catch (err) {
      toast.error(err.response?.data?.message || t('discussion.updateFailed'));
    }
  };

  const isThreadOwner = activeThread && currentUser?._id && String(activeThread.author) === String(currentUser._id);
  const canDeleteThread = isThreadOwner || canModerate;
  const canResolveThread = isThreadOwner || canModerate;

  return (
    <div className="card overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      {view === 'list' ? (
        <>
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center gap-3 flex-shrink-0 bg-white">
            {backTo && (
              <Link
                to={backTo}
                className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              </Link>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#1E293B] truncate">{t('discussion.title')}</p>
              {programTitle && <p className="text-xs text-[#94A3B8] truncate">{programTitle}</p>}
            </div>
            <button
              type="button"
              onClick={() => setShowComposer((v) => !v)}
              className="inline-flex items-center gap-1.5 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-3.5 py-2 rounded-xl text-xs transition-colors flex-shrink-0"
            >
              {showComposer ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {t('discussion.askQuestion')}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-white">
            {showComposer && (
              <form onSubmit={handlePostThread} className="p-5 border-b border-[#F1F5F9] bg-[#F8F9FB] space-y-3">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t('discussion.titlePlaceholder')}
                  maxLength={150}
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors"
                />
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder={t('discussion.bodyPlaceholder')}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newTitle.trim() || !newBody.trim() || isPosting}
                    className="inline-flex items-center gap-1.5 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors"
                  >
                    {isPosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {t('discussion.postQuestion')}
                  </button>
                </div>
              </form>
            )}

            {isLoadingList ? (
              <div className="p-10 flex items-center justify-center text-[#94A3B8]">
                <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('discussion.loading')}
              </div>
            ) : threads.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-8 py-16">
                <div className="w-14 h-14 rounded-2xl bg-mwasalatInk-100 flex items-center justify-center mb-4">
                  <MessagesSquare className="w-6 h-6 text-mwasalatInk-500" />
                </div>
                <p className="text-sm font-semibold text-[#1E293B] mb-1">{t('discussion.emptyTitle')}</p>
                <p className="text-xs text-[#94A3B8] max-w-[240px]">{t('discussion.emptyBody')}</p>
              </div>
            ) : (
              threads.map((thread) => <ThreadRow key={thread._id} thread={thread} onOpen={openThread} />)
            )}
          </div>
        </>
      ) : (
        <>
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center gap-3 flex-shrink-0 bg-white">
            <button
              type="button"
              onClick={backToList}
              className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#1E293B] truncate">{activeThread?.title ?? t('discussion.title')}</p>
              {programTitle && <p className="text-xs text-[#94A3B8] truncate">{programTitle}</p>}
            </div>
            {activeThread && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {canModerate && (
                  <button
                    type="button"
                    onClick={handleTogglePin}
                    title={t(activeThread.isPinned ? 'discussion.unpin' : 'discussion.pin')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      activeThread.isPinned ? 'bg-mwasalatRed-100 text-mwasalatRed-600' : 'text-[#94A3B8] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    {activeThread.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </button>
                )}
                {canResolveThread && (
                  <button
                    type="button"
                    onClick={handleToggleResolved}
                    title={t(activeThread.isResolved ? 'discussion.reopen' : 'discussion.markResolved')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      activeThread.isResolved ? 'bg-[#DCFCE7] text-[#16A34A]' : 'text-[#94A3B8] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    {activeThread.isResolved ? <RotateCcw className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </button>
                )}
                {canDeleteThread && (
                  <button
                    type="button"
                    onClick={handleDeleteThread}
                    title={t('discussion.deleteQuestion')}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-mwasalatRed-100 hover:text-mwasalatRed-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 bg-[#F8F9FB]">
            {isLoadingThread ? (
              <div className="h-full flex items-center justify-center text-[#94A3B8]">
                <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('discussion.loading')}
              </div>
            ) : !activeThread ? (
              <div className="h-full flex items-center justify-center text-sm text-[#94A3B8]">{t('discussion.threadNotFound')}</div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] px-5">
                <div className="flex items-start gap-3 py-4 border-b border-[#F1F5F9]">
                  <Avatar name={activeThread.authorName} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-[#1E293B]">{activeThread.authorName}</p>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#F1F5F9] text-[#475569] capitalize">
                        {t(`common.roles.${activeThread.authorRole}`)}
                      </span>
                      {activeThread.isResolved && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#DCFCE7] text-[#16A34A]">
                          <CheckCircle2 className="w-3 h-3" /> {t('discussion.resolved')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#475569] leading-relaxed mt-1.5 whitespace-pre-wrap break-words">{activeThread.body}</p>
                  </div>
                </div>

                <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide pt-4">
                  {localizeNumber(t('discussion.replyCount', { count: replies.length }), i18n.language)}
                </p>
                {replies.length === 0 ? (
                  <p className="text-sm text-[#94A3B8] py-6 text-center">{t('discussion.noReplies')}</p>
                ) : (
                  replies.map((reply) => (
                    <ReplyRow
                      key={reply._id}
                      reply={reply}
                      canDelete={canModerate || String(reply.author) === String(currentUser?._id)}
                      onDelete={handleDeleteReply}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {activeThread && (
            <form onSubmit={handleReply} className="p-4 border-t border-[#E2E8F0] flex items-center gap-2 flex-shrink-0 bg-white">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t('discussion.replyPlaceholder')}
                className="flex-1 px-4 py-2.5 rounded-full border border-[#E2E8F0] text-sm bg-[#F8F9FB] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || isReplying}
                className="w-10 h-10 rounded-full bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-50 text-white flex items-center justify-center transition-colors flex-shrink-0"
              >
                {isReplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rtl:scale-x-[-1]" />}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
