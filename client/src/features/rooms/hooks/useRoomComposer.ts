import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useNowWhile } from '@/shared/hooks/useNowWhile';
import { newClientId } from '@/shared/utils/id';
import { ROOM_COUNTDOWN_TICK_MS } from '../constants';
import { useRoomStore } from '../stores/roomStore';
import { parseChallengeAnswer } from '../utils/challenge';
import { failCopy } from '../utils/roomErrors';
import type {
  RoomMessageAck,
  RoomMessageInput,
  RoomPendingChallenge,
  RoomReplyPreview,
} from '../types';

interface Params {
  replyTo: RoomReplyPreview | null;
  onClearReply: () => void;
  onSend: (input: RoomMessageInput) => Promise<RoomMessageAck>;
}

/**
 * Composer behaviour: the draft survives until the server acks it, slow-mode
 * and mute verdicts become live countdowns, and a guest's first-post challenge
 * re-sends the SAME message (same id) with the answer attached.
 */
export function useRoomComposer({ replyTo, onClearReply, onSend }: Params) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<RoomPendingChallenge | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const mutedUntil = useRoomStore((s) => s.mutedUntil);
  const joined = useRoomStore((s) => s.joinStatus === 'joined');
  const online = useRoomStore((s) => s.socketStatus === 'online');
  const paused = useRoomStore((s) => s.paused);

  const now = useNowWhile(cooldownUntil !== null || mutedUntil !== null, ROOM_COUNTDOWN_TICK_MS);
  const cooldownMs = cooldownUntil !== null ? Math.max(0, cooldownUntil - now) : 0;
  const mutedMs = mutedUntil !== null ? Math.max(0, mutedUntil - now) : 0;

  const ready = joined && online;
  const locked = !ready || paused || mutedMs > 0 || pending !== null;
  const canSend = ready && !locked && !sending && cooldownMs === 0 && draft.trim().length > 0;

  const deliver = useCallback(
    async (input: RoomMessageInput) => {
      setSending(true);
      const res = await onSend(input);
      setSending(false);
      if (res.ok) {
        setDraft('');
        setPending(null);
        setAnswerError(null);
        if (replyTo) onClearReply();
        return;
      }
      if (res.challenge) {
        setPending({ input, challenge: res.challenge, failed: res.code === 'challenge_failed' });
        return;
      }
      setPending(null);
      if (res.retryAfterMs && (res.code === 'slow_mode' || res.code === 'rate_limited')) {
        setCooldownUntil(Date.now() + res.retryAfterMs);
        return;
      }
      // The server says nobody is moderating (our pause event may have been missed).
      if (res.code === 'mod_absent') useRoomStore.getState().setPaused(true);
      if (res.code === 'muted' && res.retryAfterMs) {
        useRoomStore.getState().setMutedUntil(Date.now() + res.retryAfterMs);
      }
      toast(failCopy(res.code));
    },
    [onClearReply, onSend, replyTo]
  );

  const submit = useCallback(() => {
    if (!canSend) return;
    void deliver({
      id: newClientId(),
      text: draft.trim(),
      ...(replyTo ? { replyTo: replyTo.id } : {}),
    });
  }, [canSend, deliver, draft, replyTo]);

  const answer = useCallback(
    (raw: string) => {
      if (!pending || sending) return;
      const parsed = parseChallengeAnswer(raw);
      if (parsed === null) {
        setAnswerError('Answer with a number.');
        return;
      }
      setAnswerError(null);
      void deliver({ ...pending.input, challenge: { token: pending.challenge.token, answer: parsed } });
    },
    [deliver, pending, sending]
  );

  const cancelChallenge = useCallback(() => {
    setPending(null);
    setAnswerError(null);
  }, []);

  return {
    draft,
    setDraft,
    submit,
    answer,
    cancelChallenge,
    challenge: pending,
    answerError,
    sending,
    canSend,
    ready,
    locked,
    cooldownMs,
    mutedMs,
    paused,
  };
}
