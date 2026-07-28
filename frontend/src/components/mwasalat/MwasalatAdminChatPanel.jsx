import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Send, Loader2, MessageCircle, Inbox, ArrowLeft } from 'lucide-react';
import { mwasalatAdminChatService } from '../../services/mwasalatAdminChat.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import useMwasalatAdminChatSocket from '../../hooks/useMwasalatAdminChatSocket.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

const TEAL = '#23181A';

// Shared inbox+thread UI for the Platform-Admin-hub escalation channel (see
// counterpartRolesFor in mwasalatAdminChat.service.js) — used by both
// MwasalatAdminChatPage (super/department/platform admin) and
// MwasalatInstructorAdminChatPage (instructor). The two pages differ only in
// which Layout wraps them and the title/subtitle shown above this panel.
export default function MwasalatAdminChatPanel({ initialCounterpartId } = {}) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const locale = i18n.language === 'ar' ? 'ar-OM' : 'en-GB';
  const { user } = useMwasalatAuthStore();
  const [inbox, setInbox] = useState([]);
  const [isLoadingInbox, setIsLoadingInbox] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [thread, setThread] = useState({ counterpart: null, messages: [] });
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef(null);
  const selectedIdRef = useRef(null);
  selectedIdRef.current = selectedId;

  const loadInbox = useCallback(() => {
    setIsLoadingInbox(true);
    return mwasalatAdminChatService.listInbox().then(setInbox).finally(() => setIsLoadingInbox(false));
  }, []);

  useEffect(() => { loadInbox(); }, [loadInbox]);

  const openThread = useCallback((counterpartId) => {
    setSelectedId(counterpartId);
    setIsLoadingThread(true);
    mwasalatAdminChatService.getThread(counterpartId)
      .then(setThread)
      .finally(() => setIsLoadingThread(false));
    mwasalatAdminChatService.markRead(counterpartId).catch(() => {});
    setInbox((prev) => prev.map((c) => (c._id === counterpartId ? { ...c, unreadCount: 0 } : c)));
  }, []);

  // Deep-link support: a "Message" button on the Instructors/Staff tables
  // passes ?with=<userId>, which jumps straight into that thread instead of
  // making Platform Admin hunt for the row in the inbox list.
  useEffect(() => {
    if (initialCounterpartId) openThread(initialCounterpartId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCounterpartId]);

  const handleSocketMessage = useCallback(({ message, senderId }) => {
    if (selectedIdRef.current === senderId) {
      setThread((prev) => (prev.messages.some((m) => m._id === message._id) ? prev : { ...prev, messages: [...prev.messages, message] }));
      mwasalatAdminChatService.markRead(senderId).catch(() => {});
    } else {
      setInbox((prev) => prev.map((c) => (c._id === senderId
        ? { ...c, unreadCount: (c.unreadCount ?? 0) + 1, lastMessageAt: message.createdAt, lastMessagePreview: message.text.slice(0, 140) }
        : c)));
    }
  }, []);

  useMwasalatAdminChatSocket(handleSocketMessage);

  // Only Platform Admin's inbox mixes multiple counterpart tiers (Super
  // Admin + Department Admin + Instructor) — every other role only ever sees
  // Platform Admins, so the badge would be redundant noise for them.
  const showRoleBadge = user?.role === 'platform_admin';

  // Platform Admin talks to every Department Admin, so a generic "Department
  // Admin" badge on every row is indistinguishable — show the actual
  // department instead so Platform Admin knows who they're picking.
  const counterpartBadgeLabel = useCallback((c) => {
    if (!c) return null;
    if (c.role === 'department_admin' && c.department) {
      return i18n.language === 'ar' ? (c.department.nameAr || c.department.name) : c.department.name;
    }
    return c.role ? t(`adminChat.roleLabels.${c.role}`) : null;
  }, [i18n.language, t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSending || !selectedId) return;
    setText('');
    setIsSending(true);
    try {
      const message = await mwasalatAdminChatService.sendMessage(selectedId, trimmed);
      setThread((prev) => ({ ...prev, messages: [...prev.messages, message] }));
      setInbox((prev) => prev.map((c) => (c._id === selectedId
        ? { ...c, lastMessageAt: message.createdAt, lastMessagePreview: message.text.slice(0, 140) }
        : c)));
    } catch (err) {
      toast.error(err.response?.data?.message || t('adminChat.sendFailed'));
      setText(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto card overflow-hidden flex" style={{ height: 'calc(100vh - 10rem)' }}>
      {/* Inbox — full width on mobile, hidden once a thread is open (WhatsApp-
          style single-pane nav); always visible side-by-side from lg up. */}
      <div className={`${selectedId ? 'hidden' : 'flex'} lg:flex flex-col w-full lg:w-64 lg:flex-shrink-0 border-e-0 lg:border-e border-[#E2E8F0]`}>
        <div className="px-4 py-3.5 border-b border-[#E2E8F0]">
          <p className="text-sm font-semibold text-[#1E293B]">{t('adminChat.inboxTitle')}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoadingInbox ? (
            <div className="p-6 flex items-center justify-center text-[#94A3B8]">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : inbox.length === 0 ? (
            <div className="p-6 text-center">
              <Inbox className="w-5 h-5 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-xs text-[#94A3B8]">{t('adminChat.noCounterparts')}</p>
            </div>
          ) : (
            inbox.map((c) => {
              const hasUnread = (c.unreadCount ?? 0) > 0;
              return (
                <button
                  key={c._id}
                  onClick={() => openThread(c._id)}
                  className={`w-full text-start flex items-start gap-2.5 px-4 py-3 border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8F9FB] transition-colors ${
                    selectedId === c._id ? 'bg-mwasalatInk-100/50' : hasUnread ? 'bg-mwasalatInk-100/30' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-mwasalatInk-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-0.5">
                    {c.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${hasUnread ? 'font-bold text-[#1E293B]' : 'font-medium text-[#1E293B]'}`}>{c.name}</p>
                      {showRoleBadge && c.role && (
                        <span className="text-[10px] font-medium text-mwasalatInk-400 bg-mwasalatInk-100 px-1.5 py-0.5 rounded-full flex-shrink-0 truncate max-w-[120px]">
                          {counterpartBadgeLabel(c)}
                        </span>
                      )}
                      {hasUnread && (
                        <span className="min-w-[16px] h-4 px-1 rounded-full bg-mwasalatRed-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {localizeNumber(c.unreadCount > 9 ? '9+' : c.unreadCount, i18n.language)}
                        </span>
                      )}
                    </div>
                    {c.lastMessagePreview ? (
                      <p className="text-xs text-[#94A3B8] truncate mt-0.5">{c.lastMessagePreview}</p>
                    ) : (
                      <p className="text-xs text-[#94A3B8] truncate mt-0.5">{t('adminChat.sayHello')}</p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Thread — full width on mobile once opened, back arrow returns to the
          inbox pane; always visible alongside the inbox from lg up. */}
      <div className={`${selectedId ? 'flex' : 'hidden'} lg:flex flex-1 flex-col min-w-0`}>
        {!selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-14 h-14 rounded-2xl bg-mwasalatInk-100 flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-mwasalatInk-500" />
            </div>
            <p className="text-sm font-semibold text-[#1E293B] mb-1">{t('adminChat.pickCounterpart')}</p>
            <p className="text-xs text-[#94A3B8] max-w-[240px]">{t('adminChat.pickCounterpartHint')}</p>
          </div>
        ) : (
          <>
            <div className="px-3 sm:px-5 py-4 border-b border-[#E2E8F0] flex items-center gap-3 flex-shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label={t('adminChat.backToInbox')}
                className="lg:hidden w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              </button>
              <div className="w-9 h-9 rounded-full bg-mwasalatInk-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {thread.counterpart?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <p className="text-sm font-semibold text-[#1E293B] truncate">{thread.counterpart?.name}</p>
              {showRoleBadge && thread.counterpart?.role && (
                <span className="text-[10px] font-medium text-mwasalatInk-400 bg-mwasalatInk-100 px-1.5 py-0.5 rounded-full flex-shrink-0 truncate max-w-[160px]">
                  {counterpartBadgeLabel(thread.counterpart)}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 bg-[#F8F9FB]">
              {isLoadingThread ? (
                <div className="h-full flex items-center justify-center text-[#94A3B8]">
                  <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('chatPanel.loading')}
                </div>
              ) : thread.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-8">
                  <p className="text-sm font-semibold text-[#1E293B] mb-1">{t('adminChat.sayHello')}</p>
                  <p className="text-xs text-[#94A3B8] max-w-[220px]">
                    {t('chatPanel.startConversationWith', { name: thread.counterpart?.name ?? t('chatPanel.otherFallback') })}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {thread.messages.map((m) => {
                    const isMine = String(m.sender) === String(user?._id);
                    return (
                      <div key={m._id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] sm:max-w-[60%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMine ? 'text-white rounded-ee-md' : 'bg-white text-[#1E293B] rounded-es-md border border-[#E2E8F0]'
                          }`}
                          style={isMine ? { background: TEAL } : undefined}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.text}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? 'text-white/70' : 'text-[#94A3B8]'}`}>
                            {localizeNumber(new Date(m.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }), i18n.language)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-[#E2E8F0] flex items-center gap-2 flex-shrink-0 bg-white">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('learnerChat.typeMessage')}
                className="flex-1 px-4 py-2.5 rounded-full border border-[#E2E8F0] text-sm bg-[#F8F9FB] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={!text.trim() || isSending}
                className="w-10 h-10 rounded-full bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-50 text-white flex items-center justify-center transition-colors flex-shrink-0"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rtl:scale-x-[-1]" />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
