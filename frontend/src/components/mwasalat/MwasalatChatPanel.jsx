import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, Loader2, MessageCircle } from 'lucide-react';
import { mwasalatChatService } from '../../services/mwasalatChat.service.js';
import { useMwasalatChatStore } from '../../store/mwasalatChatStore.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

const TEAL = '#23181A';

const formatDateSeparator = (date, t, locale, lang) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return t('chatPanel.today');
  if (d.toDateString() === yesterday.toDateString()) return t('chatPanel.yesterday');
  return localizeNumber(d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }), lang);
};

const groupByDay = (messages, t, locale, lang) => {
  const groups = [];
  let currentDay = null;
  let currentGroup = null;
  messages.forEach((m) => {
    const day = new Date(m.createdAt).toDateString();
    if (day !== currentDay) {
      currentDay = day;
      currentGroup = { day, label: formatDateSeparator(m.createdAt, t, locale, lang), messages: [] };
      groups.push(currentGroup);
    }
    currentGroup.messages.push(m);
  });
  return groups;
};

export default function MwasalatChatPanel({ conversationId, currentUserId, otherName, subtitle, backTo }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const locale = i18n.language === 'ar' ? 'ar-OM' : 'en-GB';
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef(null);
  const messages = useMwasalatChatStore((s) => s.messagesByConversation[conversationId] ?? []);
  const setMessages = useMwasalatChatStore((s) => s.setMessages);
  const addMessage = useMwasalatChatStore((s) => s.addMessage);
  const setActiveConversation = useMwasalatChatStore((s) => s.setActiveConversation);
  const clearUnread = useMwasalatChatStore((s) => s.clearUnread);

  useEffect(() => {
    if (!conversationId) return;
    setActiveConversation(conversationId);
    setIsLoading(true);
    mwasalatChatService.getMessages(conversationId)
      .then(({ messages: history }) => setMessages(conversationId, history))
      .finally(() => setIsLoading(false));
    mwasalatChatService.markRead(conversationId).catch(() => {});
    clearUnread(conversationId);
    return () => setActiveConversation(null);
  }, [conversationId, setMessages, setActiveConversation, clearUnread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setText('');
    setIsSending(true);
    try {
      const message = await mwasalatChatService.sendMessage(conversationId, trimmed);
      addMessage(conversationId, message);
    } catch (err) {
      toast.error(err.response?.data?.message || t('chatPanel.sendFailed'));
      setText(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  const dayGroups = groupByDay(messages, t, locale, i18n.language);

  return (
    <div className="card overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center gap-3 flex-shrink-0 bg-white">
        {backTo && (
          <Link
            to={backTo}
            className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>
        )}
        <div className="w-9 h-9 rounded-full bg-mwasalatInk-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          {otherName?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#1E293B] truncate">{otherName}</p>
          {subtitle && <p className="text-xs text-[#94A3B8] truncate">{subtitle}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 bg-[#F8F9FB]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-[#94A3B8]">
            <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('chatPanel.loading')}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="w-14 h-14 rounded-2xl bg-mwasalatInk-100 flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-mwasalatInk-500" />
            </div>
            <p className="text-sm font-semibold text-[#1E293B] mb-1">{t('chatPanel.sayHello')}</p>
            <p className="text-xs text-[#94A3B8] max-w-[220px]">
              {t('chatPanel.startConversationWith', { name: otherName ?? t('chatPanel.otherFallback') })}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {dayGroups.map((group) => (
              <div key={group.day}>
                <div className="flex items-center justify-center mb-4">
                  <span className="px-3 py-1 rounded-full bg-white border border-[#E2E8F0] text-[11px] font-medium text-[#94A3B8]">
                    {group.label}
                  </span>
                </div>
                <div className="space-y-3">
                  {group.messages.map((m) => {
                    const isMine = String(m.sender) === String(currentUserId);
                    return (
                      <div key={m._id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        {!isMine && (
                          <div className="w-6 h-6 rounded-full bg-mwasalatInk-500 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                            {otherName?.[0]?.toUpperCase() ?? '?'}
                          </div>
                        )}
                        <div className={`max-w-[75%] sm:max-w-[60%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMine
                            ? 'text-white rounded-ee-md'
                            : 'bg-white text-[#1E293B] rounded-es-md border border-[#E2E8F0]'
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
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
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
    </div>
  );
}
