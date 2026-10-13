import type { Socket } from 'socket.io-client';
import { track } from '@/shared/lib/analytics';
import {
  CONNECTION_READY,
  MATCH_DISCONNECTED,
  MATCH_ERROR,
  MATCH_FOUND,
  MATCH_MESSAGE,
  MATCH_MESSAGE_REJECTED,
  MATCH_PARTNER_VIBED,
  MATCH_REACTION,
  MATCH_TYPING_START,
  MATCH_TYPING_STOP,
  MUTUAL_LIKE,
  QUEUE_JOINED,
  RESUME_ENDED_NOTICE,
  SESSION_EXPIRED,
  SOMEONE_VIBING,
  WHISPER_EVENTS,
} from '../constants';
import { useAnonStore } from '../stores/anonStore';
import { trackSessionEnd } from '../stores/trackSessionEnd';
import type {
  AnonMessage,
  AnonReactionEvent,
  AnonSessionReactions,
  BufferedAnonMessage,
  MatchErrorPayload,
  MatchFoundPayload,
  MatchMessagePayload,
  QueueJoinedPayload,
} from '../types';

interface Params {
  onPartnerTyping: (isTyping: boolean) => void;
  onError: (msg: string) => void;
}

const toMessage = (m: BufferedAnonMessage, fallbackId: string): AnonMessage => ({
  id: m.id ?? fallbackId,
  from: m.from,
  content: m.content,
  sentAt: m.sentAt,
  delivery: m.from === 'me' ? 'sent' : undefined,
});

/** Server `{ me?: [r], them?: [r] }` per message → the store's one-per-side shape. */
const toSides = (byMessage: AnonSessionReactions): Record<string, AnonMessage['reactions']> => {
  const out: Record<string, AnonMessage['reactions']> = {};
  for (const [messageId, sides] of Object.entries(byMessage)) {
    out[messageId] = { me: sides.me?.[0], them: sides.them?.[0] };
  }
  return out;
};

/**
 * Subscribes every inbound `/anon` event to the store. The caller owns the socket
 * and its teardown (`removeAllListeners`), so there is nothing to unbind here.
 * The server speaks in 'me'/'them' relative to this client — no anonId is ever
 * compared or stored.
 */
export function bindAnonEvents(socket: Socket, { onPartnerTyping, onError }: Params): void {
  const store = useAnonStore.getState;

  socket.on(QUEUE_JOINED, (data: QueueJoinedPayload) => {
    store().setQueueSize(data?.queueSize ?? null);
    // A reconnect while a thread is on screen must not pull us out of it.
    const { status } = store();
    if (status === 'matched' || status === 'partner_left' || status === 'connected') return;
    // A resume never queues; a stray QUEUE_JOINED must not drop the notice.
    if (status === 'resuming') return;
    store().setStatus('waiting');
    store().setError(null);
  });

  socket.on(MATCH_FOUND, (data: MatchFoundPayload) => {
    // The same session replayed after a reconnect is a resume, not a new match.
    const isResume = store().sessionId === data.sessionId || store().status === 'resuming';
    store().setMatch(data.sessionId, data.partner.displayName, data.partner.vibeTags, data.createdAt);
    if (data.bufferedMessages?.length) {
      store().applyBuffered(
        data.bufferedMessages.map((m, i) => toMessage(m, `hist_${m.sentAt}_${i}`))
      );
    }
    if (data.reactions) store().setMessageReactions(toSides(data.reactions));
    if (!isResume) {
      track(WHISPER_EVENTS.MATCHED, { bufferSize: data.bufferedMessages?.length ?? 0 });
    }
  });

  socket.on(MATCH_MESSAGE, (data: MatchMessagePayload) => {
    const state = store();
    // A message for a session we already left (skipped, expired) has nowhere to go.
    if (!state.sessionId || (state.status !== 'matched' && state.status !== 'partner_left')) return;
    const id = data.id ?? `r_${data.sentAt}_${Math.random().toString(36).slice(2, 8)}`;
    if (state.messages.some((m) => m.id === id)) return;
    state.appendMessage(toMessage({ ...data, id }, id));
  });

  socket.on(MATCH_TYPING_START, () => onPartnerTyping(true));
  socket.on(MATCH_TYPING_STOP, () => onPartnerTyping(false));

  // Emitted to BOTH participants, so this is the single settle path for the
  // sender's optimistic tap and the partner's tap alike. `action` is honoured
  // rather than re-toggled: the server already decided.
  socket.on(MATCH_REACTION, (data: AnonReactionEvent) => {
    if (!data?.messageId || !data.reaction) return;
    store().setReaction(
      data.messageId,
      data.by,
      data.action === 'added' ? data.reaction : undefined
    );
  });

  // The partner liked. Recorded even before we're eligible to like back, so a
  // like landing during the warm-up window isn't lost.
  socket.on(SOMEONE_VIBING, () => onPartnerTyping(false));
  socket.on(MATCH_PARTNER_VIBED, () => store().setPartnerVibed(true));

  socket.on(MUTUAL_LIKE, (data: { connectToken: string }) => {
    if (!data?.connectToken) return;
    if (!store().mutualLike) track(WHISPER_EVENTS.MUTUAL, {});
    store().setMutualLike(data.connectToken);
  });

  socket.on(MATCH_DISCONNECTED, (data?: { reason?: string }) => {
    const state = store();
    // Not in a live thread (already skipped, or the DM opened): nothing ended.
    if (!state.sessionId || state.status === 'connected') return;
    const reason = data?.reason ?? 'unknown';
    track(WHISPER_EVENTS.PARTNER_LEFT, { reason });
    trackSessionEnd('partner_left');
    // Stay in the thread: it is still readable and the user decides when to move
    // on. `partner_left` keeps the socket warm so finding someone new is instant.
    state.markPartnerLeft();
    onPartnerTyping(false);
  });

  socket.on(CONNECTION_READY, (data: { chatId: string; connectionId: string }) => {
    if (!data?.chatId) return;
    store().setConnected(data.chatId, data.connectionId);
  });

  // A message the server refused (moderation / rate limit). The optimistic bubble
  // is already on screen — settle it so it isn't a silent lie.
  socket.on(MATCH_MESSAGE_REJECTED, (data: { id?: string; message: string }) => {
    if (data?.id) store().settleMessage(data.id, 'failed', data.message);
    else onError(data?.message ?? 'That message was not sent.');
  });

  socket.on(MATCH_ERROR, (data: MatchErrorPayload) => {
    const message = data?.message ?? 'Something went wrong.';

    // The server says our view of the match is stale: stop pretending it's live.
    if (data?.code === 'session_ended') {
      trackSessionEnd('session_ended');
      store().markPartnerLeft();
      onPartnerTyping(false);
      return;
    }

    // Refused at the door: another device holds this account's match, or the daily
    // allowance is spent. The only honest place for those is the picker.
    if (data?.code === 'already_matched' || data?.code === 'quota_exceeded') {
      store().endAtDoor(message);
      return;
    }

    // A refused like is settled by its ack (`useAnonSocket.sendLikeEvent`).
    onError(message);
  });

  // The server has no identity for us (24 h card lapsed). Back to the picker.
  socket.on(SESSION_EXPIRED, () => {
    const state = store();
    if (state.status === 'resuming') {
      state.abortResume(RESUME_ENDED_NOTICE);
      return;
    }
    trackSessionEnd('expired');
    state.clearSession();
    state.setStatus('idle');
    state.setError('Your whisper session expired. Pick an alias to jump back in.');
  });
}
