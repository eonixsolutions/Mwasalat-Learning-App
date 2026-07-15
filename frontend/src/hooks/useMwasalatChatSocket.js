import { useEffect } from 'react';
import toast from 'react-hot-toast';
import mwasalatSocket from '../api/mwasalatSocket.js';
import { useMwasalatAuthStore } from '../store/mwasalatAuthStore.js';
import { useMwasalatChatStore } from '../store/mwasalatChatStore.js';
import { mwasalatChatService } from '../services/mwasalatChat.service.js';

export default function useMwasalatChatSocket() {
  const { isAuthenticated, user } = useMwasalatAuthStore();
  const addMessage = useMwasalatChatStore((s) => s.addMessage);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleMessage = ({ conversationId, message, senderName, programTitle }) => {
      addMessage(conversationId, message);
      const { activeConversationId, hasConversation, bumpUnread, setConversations } = useMwasalatChatStore.getState();
      const isActive = activeConversationId === conversationId;

      if (isActive) return;

      if (hasConversation(conversationId)) {
        bumpUnread(conversationId, { lastMessageAt: message.createdAt, lastMessagePreview: message.text.slice(0, 140) });
      } else {
        // Brand-new conversation we haven't fetched yet (the other side just started it) — resync.
        mwasalatChatService.listMyConversations().then(setConversations).catch(() => {});
      }

      toast(`💬 ${senderName ?? 'New message'}${programTitle ? ` · ${programTitle}` : ''}\n${message.text}`, { duration: 4000 });
    };

    const handleConnect = () => {
      if (user?._id) mwasalatSocket.emit('join-room', user._id);
    };

    mwasalatSocket.on('mwasalat:chat:message', handleMessage);
    mwasalatSocket.on('connect', handleConnect);
    mwasalatSocket.connect();
    if (mwasalatSocket.connected) handleConnect();

    return () => {
      mwasalatSocket.off('mwasalat:chat:message', handleMessage);
      mwasalatSocket.off('connect', handleConnect);
      mwasalatSocket.disconnect();
    };
  }, [isAuthenticated, user?._id, addMessage]);
}
