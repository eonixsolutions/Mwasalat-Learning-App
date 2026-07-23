import { create } from 'zustand';

// How many prior turns are sent back to the backend as context — mirrors
// MAX_HISTORY_TURNS in backend/src/modules/mwasalatAi/mwasalatAi.constants.js.
const MAX_HISTORY_TURNS = 6;

export const useMwasalatAiStore = create((set, get) => ({
  isOpen: false,
  messages: [],
  isAsking: false,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  addMessage: (message) =>
    set((state) => {
      if (message._id && state.messages.some((m) => m._id === message._id)) return state;
      return { messages: [...state.messages, message] };
    }),

  setAsking: (isAsking) => set({ isAsking }),

  clearConversation: () => set({ messages: [] }),

  // {role, text} turns in the shape the backend expects — 'assistant' maps to
  // Gemini's 'model' role. Chat-only messages (no chart/table) keep history light.
  getHistoryForApi: () => get().messages
    .slice(-MAX_HISTORY_TURNS)
    .map((m) => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text })),
}));
