import { create } from 'zustand';
import { sessionFields } from './sessionFields';
import { clearResumeFlag, setResumeFlag } from '../utils/resumeFlag';
import type { AnonMatchStatus, AnonMessage, AnonReaction, Gender, VibeTag } from '../types';

type AnonState = {
  // Identity (survives `reset`, so backing out keeps the alias)
  displayName: string;
  vibeTags: VibeTag[];
  gender: Gender;
  /** Edited after the server last saved the card — must be re-saved before the next match. */
  identityDirty: boolean;
  /** Account the identity belongs to (null = guest). A different account wipes it. */
  ownerId: string | null;
  /** Last DM opened from a whisper; makes "DM opened" idempotent. Survives `reset`. */
  openedChatId: string | null;

  // Match state
  status: AnonMatchStatus;
  sessionId: string | null;
  partnerName: string | null;
  partnerTags: VibeTag[];
  /** Approximate number of people waiting — honest empty-queue copy. */
  queueSize: number | null;

  // Transport
  socketConnected: boolean;
  /** The socket dropped and is retrying; the server holds the match meanwhile. */
  reconnecting: boolean;
  error: string | null;

  // Like state
  likeSent: boolean;
  mutualLike: boolean;
  connectToken: string | null;
  /** When the mutual like landed; fallback clock for the connect countdown. */
  mutualAt: number | null;
  mutualVibeDismissed: boolean;
  partnerVibed: boolean;
  matchedAt: number | null;
  /**
   * The alias this match began with, frozen at `setMatch` time. `displayName` is
   * editable from the profile panel; this is what the *current thread* is called.
   */
  sessionAlias: string | null;
  /** Your vibe tags as they were when this match began — what the partner saw. */
  sessionTags: VibeTag[] | null;
  /** "Stay here" was chosen, so the thread-ended card collapsed to a bar. */
  partnerLeftPromptDismissed: boolean;
  /** When the partner left (Unix ms) — freezes the thread-ended summary. */
  endedAt: number | null;
  /** SESSION_END analytics already fired for this session. */
  sessionEndTracked: boolean;

  messages: AnonMessage[];

  chatId: string | null;
  connectionId: string | null;

  /** Restore / confirm an identity card without marking it as edited. */
  setIdentityFields: (displayName: string, vibeTags: VibeTag[], gender: Gender) => void;
  /** A user edit from the profile panel — applies from the NEXT match. */
  editIdentity: (displayName: string, vibeTags: VibeTag[], gender: Gender) => void;
  markIdentitySynced: () => void;
  /** Wipe everything (identity included) when the signed-in account changes. */
  bindOwner: (ownerId: string | null) => void;
  setStatus: (status: AnonMatchStatus) => void;
  /**
   * A match was announced. A reconnect replays MATCH_FOUND for the SAME session —
   * that must not reset the like/connect handshake, which the server does not
   * send back. Only a different `sessionId` starts clean.
   */
  setMatch: (
    sessionId: string,
    partnerName: string,
    partnerTags: VibeTag[],
    /** The session's real start (Unix ms). Falls back to now if absent. */
    startedAt?: number
  ) => void;
  clearSession: () => void;
  /**
   * The partner left or disconnected. The thread stays readable, and the
   * like/connect handshake is KEPT: a mutual like's connectToken stays valid for
   * its TTL whether or not the partner is still here.
   */
  markPartnerLeft: () => void;
  dismissPartnerLeftPrompt: () => void;
  endAtDoor: (message: string) => void;
  setSocketConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setError: (message: string | null) => void;
  setQueueSize: (size: number | null) => void;
  sendLike: () => void;
  rollbackLike: () => boolean;
  /** A refresh-resume failed or the chat is gone: back to the picker with a notice. */
  abortResume: (message: string) => void;
  setMutualLike: (connectToken: string) => void;
  dismissMutualVibePrompt: () => void;
  openMutualVibePrompt: () => void;
  setPartnerVibed: (v: boolean) => void;
  appendMessage: (msg: AnonMessage) => void;
  /** Replace history with the server's buffer, keeping our unsettled sends. */
  applyBuffered: (buffered: AnonMessage[]) => void;
  /** Settle an optimistic bubble once the server acks (or rejects) it. */
  settleMessage: (id: string, delivery: 'sent' | 'failed', reason?: string) => void;
  retryMessage: (id: string) => AnonMessage | null;
  applyReaction: (messageId: string, side: 'me' | 'them', reaction: AnonReaction) => void;
  setReaction: (
    messageId: string,
    side: 'me' | 'them',
    reaction: AnonReaction | undefined
  ) => void;
  setMessageReactions: (byMessageId: Record<string, AnonMessage['reactions']>) => void;
  setConnected: (chatId: string, connectionId: string) => void;
  markSessionEndTracked: () => void;
  markDmOpened: (chatId: string) => void;
  reset: () => void;
};

/** A cleared reaction is `delete`d, not assigned `undefined`. */
const setSide = (
  message: AnonMessage,
  side: 'me' | 'them',
  reaction: AnonReaction | undefined
): AnonMessage => {
  const reactions: NonNullable<AnonMessage['reactions']> = { ...message.reactions };
  if (reaction === undefined) delete reactions[side];
  else reactions[side] = reaction;
  return { ...message, reactions };
};

export const useAnonStore = create<AnonState>((set, get) => ({
  displayName: '',
  vibeTags: [],
  gender: 'prefer_not_to_say',
  identityDirty: false,
  ownerId: null,
  openedChatId: null,
  status: 'idle',
  socketConnected: false,
  reconnecting: false,
  error: null,
  ...sessionFields,

  setIdentityFields: (displayName, vibeTags, gender) =>
    set({ displayName, vibeTags, gender, error: null }),

  editIdentity: (displayName, vibeTags, gender) =>
    set({ displayName, vibeTags, gender, identityDirty: true }),

  markIdentitySynced: () => set({ identityDirty: false }),

  bindOwner: (ownerId) => {
    const { ownerId: current, status } = get();
    if (current === ownerId) return;
    // Auth hydrates after first paint: null → account while restoring a refresh
    // is the same person, not an account switch.
    if (current === null && status === 'resuming') {
      set({ ownerId });
      return;
    }
    clearResumeFlag();
    set({
      ownerId,
      displayName: '',
      vibeTags: [],
      gender: 'prefer_not_to_say',
      identityDirty: false,
      status: 'idle',
      socketConnected: false,
      reconnecting: false,
      error: null,
      ...sessionFields,
    });
  },

  setStatus: (status) => set({ status }),

  setMatch: (sessionId, partnerName, partnerTags, startedAt) => {
    setResumeFlag();
    set((s) => {
      const same = s.sessionId === sessionId;
      return {
        ...(same ? {} : sessionFields),
        sessionId,
        partnerName,
        partnerTags,
        // Freeze the alias this match started with. The partner already has it,
        // so renaming mid-thread must not change what the thread calls you.
        sessionAlias: same ? (s.sessionAlias ?? s.displayName) : s.displayName,
        sessionTags: same ? (s.sessionTags ?? s.vibeTags) : s.vibeTags,
        status: 'matched' as const,
        reconnecting: false,
        error: null,
        // The server's real session start, not `Date.now()` — a resumed session
        // must keep the clock it already had.
        matchedAt: startedAt || (same ? s.matchedAt : null) || Date.now(),
      };
    });
  },

  clearSession: () => {
    clearResumeFlag();
    set({ ...sessionFields });
  },

  markPartnerLeft: () => {
    clearResumeFlag();
    set((s) => ({ status: 'partner_left' as const, reconnecting: false, endedAt: s.endedAt ?? Date.now() }));
  },

  dismissPartnerLeftPrompt: () => set({ partnerLeftPromptDismissed: true }),

  endAtDoor: (message) => {
    clearResumeFlag();
    set({
      ...sessionFields,
      status: 'idle',
      error: message,
      reconnecting: false,
      socketConnected: false,
    });
  },

  setSocketConnected: (socketConnected) => set({ socketConnected }),

  setReconnecting: (reconnecting) => set({ reconnecting }),

  setError: (error) => set({ error }),

  setQueueSize: (queueSize) => set({ queueSize }),

  sendLike: () => set({ likeSent: true }),

  rollbackLike: () => {
    const { likeSent, mutualLike } = get();
    if (!likeSent || mutualLike) return false;
    set({ likeSent: false });
    return true;
  },

  abortResume: (message) => {
    clearResumeFlag();
    set({
      ...sessionFields,
      status: 'idle',
      error: message,
      reconnecting: false,
      socketConnected: false,
    });
  },

  setMutualLike: (connectToken) =>
    set({
      likeSent: true,
      mutualLike: true,
      connectToken,
      mutualAt: Date.now(),
      mutualVibeDismissed: false,
      partnerVibed: false,
    }),

  dismissMutualVibePrompt: () => set({ mutualVibeDismissed: true }),

  openMutualVibePrompt: () => set({ mutualVibeDismissed: false }),

  setPartnerVibed: (partnerVibed) => set({ partnerVibed }),

  appendMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  applyBuffered: (buffered) =>
    set((s) => {
      const ids = new Set(buffered.map((m) => m.id));
      const pending = s.messages.filter(
        (m) => m.from === 'me' && m.delivery !== 'sent' && !ids.has(m.id)
      );
      return { messages: [...buffered, ...pending] };
    }),

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

  applyReaction: (messageId, side, reaction) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId
          ? setSide(m, side, m.reactions?.[side] === reaction ? undefined : reaction)
          : m
      ),
    })),

  setReaction: (messageId, side, reaction) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId ? setSide(m, side, reaction) : m
      ),
    })),

  setMessageReactions: (byMessageId) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        byMessageId[m.id] === undefined ? m : { ...m, reactions: byMessageId[m.id] }
      ),
    })),

  setConnected: (chatId, connectionId) => {
    clearResumeFlag();
    set({ chatId, connectionId, status: 'connected', reconnecting: false });
  },

  markSessionEndTracked: () => set({ sessionEndTracked: true }),

  markDmOpened: (openedChatId) => set({ openedChatId }),

  reset: () =>
    set({
      status: 'idle',
      socketConnected: false,
      reconnecting: false,
      error: null,
      // Identity (alias / vibes / gender) deliberately survives a reset — a user
      // who backs out of a chat should rejoin with the same alias.
      ...sessionFields,
    }),
}));
