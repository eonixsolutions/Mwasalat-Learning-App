import { create } from 'zustand';

const sumUnread = (conversations) => conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

export const useMwasalatChatStore = create((set, get) => ({
  messagesByConversation: {},
  activeConversationId: null,
  conversations: [],
  unreadTotal: 0,

  setActiveConversation: (conversationId) => set({ activeConversationId: conversationId }),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messagesByConversation: { ...state.messagesByConversation, [conversationId]: messages },
    })),

  addMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messagesByConversation[conversationId] ?? [];
      if (existing.some((m) => m._id === message._id)) return state;
      return {
        messagesByConversation: { ...state.messagesByConversation, [conversationId]: [...existing, message] },
      };
    }),

  setConversations: (conversations) => set({ conversations, unreadTotal: sumUnread(conversations) }),

  bumpUnread: (conversationId, patch) =>
    set((state) => {
      const known = state.conversations.some((c) => c._id === conversationId);
      const conversations = known
        ? state.conversations.map((c) => (c._id === conversationId
          ? { ...c, unreadCount: (c.unreadCount ?? 0) + 1, lastMessageAt: patch?.lastMessageAt ?? c.lastMessageAt, lastMessagePreview: patch?.lastMessagePreview ?? c.lastMessagePreview }
          : c))
        : state.conversations;
      return { conversations, unreadTotal: sumUnread(conversations) };
    }),

  hasConversation: (conversationId) => get().conversations.some((c) => c._id === conversationId),

  clearUnread: (conversationId) =>
    set((state) => {
      const conversations = state.conversations.map((c) => (c._id === conversationId ? { ...c, unreadCount: 0 } : c));
      return { conversations, unreadTotal: sumUnread(conversations) };
    }),

  isConversationActive: (conversationId) => get().activeConversationId === conversationId,
}));
