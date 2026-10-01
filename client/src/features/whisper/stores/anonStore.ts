import { create } from 'zustand';
import type { AnonReaction } from '@/shared/types/socket';
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
  /**
   * The alias this match began with, frozen at `setMatch` time.
   *
   * `displayName` is editable from the profile panel; this is what the *current
   * thread* is called. They diverge only while editing mid-conversation, and
   * the next match re-freezes it.
   */
  sessionAlias: string | null;
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
  setMatch: (
    sessionId: string,
    partnerName: string,
    partnerTags: VibeTag[],
    /** The session's real start (Unix ms). Falls back to now if absent. */
    startedAt?: number
  ) => void;
  /**
   * Update the identity card in place (alias / vibes / gender).
   *
   * Separate from `setIdentity` because that one also records a *new* `anonId`
   * from a join, which must not happen when someone just renames themselves
   * mid-session.
   */
  setIdentityFields: (
    displayName: string,
    vibeTags: VibeTag[],
    gender: Gender
  ) => void;
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
  /**
   * Refused before we ever entered a queue — another device already holds this
   * account's match, or the daily allowance is spent.
   *
   * Drops back to the picker with the reason attached, because there is no thread
   * to show it on and an in-chat banner would imply otherwise. Guests never reach
   * this: neither condition can apply to an anonymous identity.
   */
  endAtDoor: (message: string) => void;
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
  /**
   * Apply one curated reaction to a bubble.
   *
   * `side` is already resolved from the server's anonId by the socket layer.
   * Sending the reaction a side already holds removes it (the server's toggle),
   * and sending a different one replaces it — one reaction per person per
   * message, by design, so a bubble can't turn into a sticker sheet.
   */
  applyReaction: (messageId: string, side: 'me' | 'them', reaction: AnonReaction) => void;
  /**
   * Set or clear one side's reaction from an **authoritative** server event.
   *
   * Distinct from `applyReaction` on purpose: that one toggles, because a local tap
   * has no idea whether the reaction is already there. The server already decided,
   * and it says which — so this must write the answer rather than invert it. Using
   * the toggle for both makes the optimistic tap and its own broadcast cancel out.
   */
  setReaction: (
    messageId: string,
    side: 'me' | 'them',
    reaction: AnonReaction | undefined
  ) => void;
  /** Bulk-apply on resume, where the server sends a whole session's reactions. */
  setMessageReactions: (byMessageId: Record<string, AnonMessage['reactions']>) => void;
  setConnected: (chatId: string, connectionId: string) => void;
  reset: () => void;
};

/**
 * Write one side's reaction onto a bubble.
 *
 * A cleared reaction is `delete`d rather than assigned `undefined`, so it doesn't
 * linger as an explicit "nothing" that `Object.keys` and the UI would both treat as
 * present.
 */
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
  sessionAlias: null as string | null,
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

  setIdentityFields: (displayName, vibeTags, gender) =>
    set({ displayName, vibeTags, gender }),

  setMatch: (sessionId, partnerName, partnerTags, startedAt) =>
    set({
      ...sessionFields,
      sessionId,
      partnerName,
      partnerTags,
      // Freeze the alias this match started with. The partner already has it,
      // so renaming mid-thread must not change what the thread calls you —
      // otherwise the header, the "you" avatar and their view disagree.
      sessionAlias: get().displayName,
      status: 'matched',
      sessionNotice: null,
      error: null,
      // The server's real session start, not `Date.now()` — a resumed session
      // must keep the clock it already had.
      matchedAt: startedAt || Date.now(),
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

  endAtDoor: (message) =>
    set({
      ...sessionFields,
      status: 'idle',
      error: message,
      sessionNotice: null,
      socketConnected: false,
    }),

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
