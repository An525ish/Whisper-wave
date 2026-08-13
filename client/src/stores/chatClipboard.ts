import { create } from 'zustand';
import type { ChatCopyPayload } from '@/utils/chatClipboard';

type ChatClipboardState = {
  payload: ChatCopyPayload | null;
  setPayload: (payload: ChatCopyPayload) => void;
  takePayload: () => ChatCopyPayload | null;
  clear: () => void;
};

export const useChatClipboardStore = create<ChatClipboardState>((set, get) => ({
  payload: null,
  setPayload: (payload) => set({ payload }),
  takePayload: () => {
    const payload = get().payload;
    set({ payload: null });
    return payload;
  },
  clear: () => set({ payload: null }),
}));
