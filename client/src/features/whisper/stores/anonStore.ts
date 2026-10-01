import { create } from 'zustand';
import type { AnonMatchStatus, AnonMessage, Gender, VibeTag } from '../types';

type AnonState = {
  // Identity
  anonId: string | null;
  displayName: string;
  vibeTags: VibeTag[];
  gender: Gender;

  // Match state
  status: AnonMatchStatus;
  sessionId: string | null;
  partnerName: string | null;
  partnerTags: VibeTag[];
  /** Approximate number of people waiting — honest empty-queue copy. */
  queueSize: number | null;

  // Transport
  socketConnected: boolean;
  sessionNotice: string | null;
  error: string | null;

  // Like state
  likeSent: boolean;
  mutualLike: boolean;
  connectToken: string | null;
  mutualVibeDismissed: boolean;
  partnerVibed: boolean;
  matchedAt: number | null;
  /** "Stay here" was chosen, so the partner-left prompt collapsed to a bar. */
  partnerLeftPromptDismissed: boolean;

  messages: AnonMessage[];

  chatId: string | null;
  connectionId: string | null;

  setIdentity: (
    anonId: string,
    displayName: string,
    vibeTags: VibeTag[],
    gender?: Gender
  ) => void;
  setStatus: (status: AnonMatchStatus) => void;
  setMatch: (sessionId: string, partnerName: string, partnerTags: VibeTag[]) => void;
  clearSession: () => void;
  /**
   * The partner left or disconnected.
   *
   * Deliberately NOT `clearSession`: the thread stays readable and the header
   * keeps their alias, because the conversation already happened and throwing it
   * away is more jarring than the event that ended it. Only the state that can no
   * longer be true is dropped — the like/connect handshake is dead once they are
   * gone. `matchedAt` is kept for the end-of-thread summary.
   *
   * Moving to `partner_left` rather than `idle` also keeps the socket connected
   * (the lifecycle hook connects whenever status isn't `idle`), so finding
   * someone new doesn't cost a fresh handshake.
   */
  markPartnerLeft: () => void;
  /** "Stay here" — collapse the prompt to a one-line bar. Thread still readable. */
  dismissPartnerLeftPrompt: () => void;
  setSocketConnected: (connected: boolean) => void;
  setSessionNotice: (notice: string | null) => void;
  setError: (message: string | null) => void;
  setQueueSize: (size: number | null) => void;
  sendLike: () => void;
  setMutualLike: (connectToken: string) => void;
  dismissMutualVibePrompt: () => void;
  openMutualVibePrompt: () => void;
  setPartnerVibed: (v: boolean) => void;
  appendMessage: (msg: AnonMessage) => void;
  setMessages: (msgs: AnonMessage[]) => void;
  /** Settle an optimistic bubble once the server acks (or rejects) it. */
  settleMessage: (id: string, delivery: 'sent' | 'failed', reason?: string) => void;
  /** Put a failed message back in flight. */
  retryMessage: (id: string) => AnonMessage | null;
  setConnected: (chatId: string, connectionId: string) => void;
  reset: () => void;
};

/** Everything that belongs to a single match and must not survive into the next. */
const sessionFields = {
  sessionId: null as string | null,
  partnerName: null as string | null,
  partnerTags: [] as VibeTag[],
  likeSent: false,
  mutualLike: false,
  connectToken: null as string | null,
  mutualVibeDismissed: false,
  partnerVibed: false,
  matchedAt: null as number | null,
  partnerLeftPromptDismissed: false,
  messages: [] as AnonMessage[],
  chatId: null as string | null,
  connectionId: null as string | null,
  queueSize: null as number | null,
} as const;

export const useAnonStore = create<AnonState>((set, get) => ({
  anonId: null,
  displayName: '',
  vibeTags: [],
  gender: 'prefer_not_to_say',
  status: 'idle',
  socketConnected: false,
  sessionNotice: null,
  error: null,
  ...sessionFields,

  setIdentity: (anonId, displayName, vibeTags, gender) =>
    set((s) => ({
      anonId,
      displayName,
      vibeTags,
      gender: gender ?? s.gender,
      // Identity is known → clear any stale "session expired" error.
      error: null,
    })),

  setStatus: (status) => set({ status }),

  setMatch: (sessionId, partnerName, partnerTags) =>
    set({
      ...sessionFields,
      sessionId,
      partnerName,
      partnerTags,
      status: 'matched',
      sessionNotice: null,
      error: null,
      matchedAt: Date.now(),
    }),

  clearSession: () => set({ ...sessionFields }),

  markPartnerLeft: () =>
    set({
      status: 'partner_left',
      sessionNotice: null,
      // The handshake is over — a like sent to someone who has left can never
      // come back, so offering the heart or the "open DM" CTA would be a lie.
      likeSent: false,
      mutualLike: false,
      connectToken: null,
      partnerVibed: false,
    }),

  dismissPartnerLeftPrompt: () => set({ partnerLeftPromptDismissed: true }),

  setSocketConnected: (socketConnected) => set({ socketConnected }),

  setSessionNotice: (sessionNotice) => set({ sessionNotice }),

  setError: (error) => set({ error }),

  setQueueSize: (queueSize) => set({ queueSize }),

  sendLike: () => set({ likeSent: true }),

  setMutualLike: (connectToken) =>
    set({
      mutualLike: true,
      connectToken,
      mutualVibeDismissed: false,
      partnerVibed: false,
    }),

  dismissMutualVibePrompt: () => set({ mutualVibeDismissed: true }),

  openMutualVibePrompt: () => set({ mutualVibeDismissed: false }),

  setPartnerVibed: (partnerVibed) => set({ partnerVibed }),

  appendMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  setMessages: (msgs) => set({ messages: msgs }),

  settleMessage: (id, delivery, reason) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id
          ? {
              ...m,
              delivery,
              failureReason: delivery === 'failed' ? reason : undefined,
            }
          : m
      ),
    })),

  retryMessage: (id) => {
    const target = get().messages.find((m) => m.id === id);
    if (!target || target.from !== 'me') return null;
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id
          ? { ...m, delivery: 'sending' as const, failureReason: undefined }
          : m
      ),
    }));
    return target;
  },

  setConnected: (chatId, connectionId) =>
    set({ chatId, connectionId, status: 'connected', sessionNotice: null }),

  reset: () =>
    set({
      status: 'idle',
      socketConnected: false,
      sessionNotice: null,
      error: null,
      // NOTE: anonId / displayName / vibeTags / gender deliberately survive a
      // reset — a user who backs out of a chat should rejoin with the same
      // alias, not be made to re-type it.
      ...sessionFields,
    }),
}));
