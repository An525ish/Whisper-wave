import { create } from 'zustand';
import { ROOM_LISTENING_COPY, ROOM_NOTICE_FROM, ROOM_THREAD_CAP } from '../constants';
import type { RoomMessage, RoomStore } from '../types';

const initial = {
  instanceId: null,
  slug: null,
  title: '',
  rules: [],
  messages: [],
  online: 0,
  you: null,
  socketStatus: 'connecting',
  joinStatus: 'idle',
  joinParams: null,
  joinError: null,
  endState: null,
  mutedUntil: null,
  supportNotice: false,
  listening: false,
  paused: false,
  myReactions: {},
} satisfies Partial<RoomStore>;

const capped = (messages: RoomMessage[]): RoomMessage[] => messages.slice(-ROOM_THREAD_CAP);

let noticeSeq = 0;

const noticeMessage = (text: string): RoomMessage => ({
  id: `notice-${(noticeSeq += 1)}`,
  from: ROOM_NOTICE_FROM,
  text,
  ts: Date.now(),
  system: true,
});

/**
 * Live room session state. The thread lives here (server keeps the ring, the
 * store keeps this tab's view) — cleared on leave so a returned visit starts
 * clean. `joinParams` outlives a dropped socket on purpose: it is what the
 * reconnect handler re-emits `ROOM_JOIN` with.
 */
export const useRoomStore = create<RoomStore>()((set) => ({
  ...initial,

  applyState: (state) =>
    set({
      instanceId: state.roomId,
      slug: state.slug,
      title: state.title,
      rules: state.rules,
      listening: state.requiresModPresence === true,
      paused: state.paused === true,
      messages: capped(
        state.paused ? [...state.recent, noticeMessage(ROOM_LISTENING_COPY.paused)] : state.recent
      ),
      online: state.online,
      you: state.you,
      joinStatus: 'joined',
      joinError: null,
      endState: null,
      myReactions: {},
    }),

  appendMessage: (message) =>
    set((s) =>
      s.messages.some((m) => m.id === message.id)
        ? s
        : { messages: capped([...s.messages, message]) }
    ),

  appendNotice: (text) =>
    set((s) => ({
      messages: capped([...s.messages, noticeMessage(text)]),
    })),

  applyReaction: (messageId, reaction, count) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId ? { ...m, reactions: { ...m.reactions, [reaction]: count } } : m
      ),
    })),

  toggleMine: (messageId, reaction) =>
    set((s) => {
      const held = s.myReactions[messageId] ?? [];
      const next = held.includes(reaction) ? held.filter((r) => r !== reaction) : [...held, reaction];
      return { myReactions: { ...s.myReactions, [messageId]: next } };
    }),

  // Everyone drops a deleted message; mods keep it greyed (with Unhide).
  deleteMessage: (messageId) =>
    set((s) => ({
      messages:
        s.you && s.you.role !== 'member'
          ? s.messages.map((m) => (m.id === messageId ? { ...m, hidden: true } : m))
          : s.messages.filter((m) => m.id !== messageId),
    })),

  restoreMessage: (message) =>
    set((s) => {
      const restored: RoomMessage = { ...message, hidden: false };
      if (s.messages.some((m) => m.id === message.id)) {
        return { messages: s.messages.map((m) => (m.id === message.id ? { ...m, ...restored } : m)) };
      }
      const at = s.messages.findIndex((m) => m.ts > message.ts);
      const next = at === -1 ? [...s.messages, restored] : [...s.messages.slice(0, at), restored, ...s.messages.slice(at)];
      return { messages: capped(next) };
    }),

  setPresence: (online) => set({ online }),
  setSocketStatus: (socketStatus) => set({ socketStatus }),

  beginJoin: (joinParams) => set({ joinParams, joinStatus: 'joining', joinError: null, endState: null }),
  joinFailed: (joinError) => set({ joinStatus: 'idle', joinError }),
  markRejoining: () => set((s) => (s.joinStatus === 'joined' ? { joinStatus: 'rejoining' } : s)),

  setEnd: (endState, opts) =>
    set((s) => ({
      endState,
      joinStatus: 'idle',
      joinParams: opts?.keepParams ? s.joinParams : null,
    })),
  clearEnd: () => set({ endState: null, joinError: null }),

  setMutedUntil: (mutedUntil) => set({ mutedUntil }),
  // A flip leaves an inline line in the thread; a repeat of the same state adds nothing.
  setPaused: (paused) =>
    set((s) =>
      s.paused === paused
        ? s
        : {
            paused,
            messages: capped([
              ...s.messages,
              noticeMessage(paused ? ROOM_LISTENING_COPY.paused : ROOM_LISTENING_COPY.resumed),
            ]),
          }
    ),
  setSupportNotice: () => set({ supportNotice: true }),
  clearSupportNotice: () => set({ supportNotice: false }),
  reset: () => set({ ...initial, messages: [], myReactions: {} }),
}));
