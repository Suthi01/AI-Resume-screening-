import { create } from 'zustand';
import type { ReactNode } from 'react';
import type { Message } from '@/types/chat.types';

interface ChatState {
  messages: Message[];
  addUserMessage: (text: string) => void;
  addBotMessage: (content: ReactNode) => void;
  /** Replace the content of the last bot message (used by rerank to refresh results in-place) */
  updateLastBotMessage: (content: ReactNode) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addUserMessage: (text) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: crypto.randomUUID(), type: 'user', text, timestamp: new Date() },
      ],
    })),
  addBotMessage: (content) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: crypto.randomUUID(), type: 'bot', content, timestamp: new Date() },
      ],
    })),
  updateLastBotMessage: (content) =>
    set((s) => {
      const msgs = [...s.messages];
      // Walk backwards to find the last bot message
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].type === 'bot') {
          msgs[i] = { ...msgs[i], content };
          break;
        }
      }
      return { messages: msgs };
    }),
  clearMessages: () => set({ messages: [] }),
}));

