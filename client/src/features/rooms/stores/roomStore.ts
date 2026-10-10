import { create } from 'zustand';
import type { RoomMessage, RoomYou } from '../types';

type RoomStore = {
  instanceId: string | null;
  slug: string | null;
  title: string;
  rules: string[];
  messages: RoomMessage[];
  online: number;
  you: RoomYou | null;
  socketConnected: boolean;
  kicked: boolean;
  closedReason: string | null;
  error: string | null;
  /** Self-harm language seen in my post — show the resources card once. */
  supportNotice: boolean;
  applyState: (state: {
    instanceId: string;
    slug: string;
    title: string;
    rules: string[];
    messages: RoomMessage[];
    online: number;
    you: RoomYou;
  }) => void;
  appendMessage: (message: RoomMessage) => void;
  applyReaction: (messageId: string, reaction: string, count: number) => void;
  removeMessage: (messageId: string) => void;
  setPresence: (online: number) => void;
  setSocketConnected: (connected: boolean) => void;
  setKicked: () => void;
  setClosed: (reason: string) => void;
  setError: (error: string | null) => void;
  setSupportNotice: () => void;
  clearSupportNotice: () => void;
  reset: () => void;
};

const initial = {
  instanceId: null as string | null,
  slug: null as string | null,
  title: '',
  rules: [] as string[],
  messages: [] as RoomMessage[],
  online: 0,
  you: null as RoomYou | null,
  socketConnected: false,
  kicked: false,
  closedReason: null as string | null,
  error: null as string | null,
  supportNotice: false,
};

/**
 * Live room session state. The thread lives here (server keeps the ring, the
 * store keeps this tab's view) — cleared on leave so a returned visit starts
 * clean. Server data shape, client lifetime: same split as the anon store.
 */
export const useRoomStore = create<RoomStore>()((set) => ({
  ...initial,

  applyState: (state) =>
    set({
      ...state,
      kicked: false,
      closedReason: null,
      error: null,
    }),

  appendMessage: (message) =>
    set((s) => ({
      messages: [...s.messages, message].slice(-100),
    })),

  applyReaction: (messageId, reaction, count) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId
          ? { ...m, reactions: { ...m.reactions, [reaction]: count } }
          : m
      ),
    })),

  removeMessage: (messageId) =>
    set((s) => ({
      messages: s.messages.filter((m) => m.id !== messageId),
    })),

  setPresence: (online) => set({ online }),
  setSocketConnected: (socketConnected) => set({ socketConnected }),
  setKicked: () => set({ kicked: true }),
  setClosed: (closedReason) => set({ closedReason }),
  setError: (error) => set({ error }),
  setSupportNotice: () => set({ supportNotice: true }),
  clearSupportNotice: () => set({ supportNotice: false }),
  reset: () => set({ ...initial, messages: [] }),
}));
