import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useNowWhile } from '@/shared/hooks/useNowWhile';
import { track } from '@/shared/lib/analytics';
import { newClientId } from '@/shared/utils/id';
import { ROOM_COUNTDOWN_TICK_MS, ROOM_EVENTS, ROOM_IMAGE } from '../constants';
import { useRoomStore } from '../stores/roomStore';
import { parseChallengeAnswer } from '../utils/challenge';
import { failCopy } from '../utils/roomErrors';
import type { RoomAckCode, RoomMessageAck, RoomMessageInput, RoomReplyPreview } from '../types';
import type { RoomChallengeAnswer, RoomChallengeCode, RoomPendingChallenge } from '../types/challenge';

const CHALLENGE_CODES = new Set<string>(['challenge_required', 'challenge_failed', 'challenge_unavailable']);

interface Params {
  replyTo: RoomReplyPreview | null;
  onClearReply: () => void;
  onSend: (input: RoomMessageInput) => Promise<RoomMessageAck>;
  onUploadImage: (file: File) => Promise<{ key: string } | { code: RoomAckCode }>;
}

/**
 * Composer behaviour: the draft survives until the server acks it, slow-mode
 * and mute verdicts become live countdowns, and a guest's first-post challenge
 * (Turnstile modal) re-sends the SAME message (same id) with the answer attached.
 * Cancelling the modal leaves the draft in the composer; nothing is lost.
 */
export function useRoomComposer({ replyTo, onClearReply, onSend, onUploadImage }: Params) {
  const [draft, setDraft] = useState('');
  // One staged photo at a time: slow mode would reject a second one anyway.
  const [files, setFilesState] = useState<File[]>([]);
  const setFiles = useCallback((next: File[] | ((prev: File[]) => File[])) => {
    setFilesState((prev) => (typeof next === 'function' ? next(prev) : next).slice(-1));
  }, []);
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
  const canSend = ready && !locked && !sending && cooldownMs === 0 && (draft.trim().length > 0 || files.length > 0);

  const deliver = useCallback(
    async (input: RoomMessageInput, retry = false) => {
      setSending(true);
      const res = await onSend(input);
      setSending(false);
      if (res.ok) {
        // A GIF sent while typing must not eat the draft.
        if (input.text) setDraft('');
        if (input.media?.kind === 'image') setFilesState([]);
        // Keep the modal for its success beat (unless the guest already cancelled it).
        setPending((prev) => (prev ? { ...prev, passed: true } : null));
        setAnswerError(null);
        if (retry) track(ROOM_EVENTS.CHALLENGE_PASSED, {});
        if (replyTo) onClearReply();
        return;
      }
      if (res.challenge && CHALLENGE_CODES.has(res.code)) {
        const { challenge } = res;
        const code = res.code as RoomChallengeCode;
        if (retry) track(ROOM_EVENTS.CHALLENGE_FAILED, { provider: challenge.provider, code });
        else track(ROOM_EVENTS.CHALLENGE_SHOWN, { provider: challenge.provider });
        // A retry answers a modal that may have been cancelled meanwhile: don't resurrect it.
        setPending((prev) =>
          retry && !prev
            ? null
            : { input, challenge, code, nonce: (prev?.nonce ?? 0) + 1, passed: false }
        );
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

  const submit = useCallback(async () => {
    if (!canSend) return;
    const base = { id: newClientId(), text: draft.trim(), ...(replyTo ? { replyTo: replyTo.id } : {}) };
    const file = files[0];
    if (!file) {
      await deliver(base);
      return;
    }
    if (!(ROOM_IMAGE.TYPES as readonly string[]).includes(file.type) || file.size > ROOM_IMAGE.MAX_BYTES) {
      toast('Photos only: JPG, PNG or WebP, up to 5 MB.');
      return;
    }
    setSending(true);
    const uploaded = await onUploadImage(file);
    setSending(false);
    if ('code' in uploaded) {
      toast(failCopy(uploaded.code));
      return;
    }
    await deliver({ ...base, media: { kind: 'image', key: uploaded.key } });
  }, [canSend, deliver, draft, files, onUploadImage, replyTo]);

  /** A GIF or meme from the picker sends straight away, like the main chat. */
  const sendLink = useCallback(
    (kind: 'gif' | 'meme', url: string) => {
      if (!ready || locked || sending || cooldownMs > 0) return;
      void deliver({ id: newClientId(), text: '', media: { kind, url }, ...(replyTo ? { replyTo: replyTo.id } : {}) });
    },
    [cooldownMs, deliver, locked, ready, replyTo, sending]
  );

  const sendAnswer = useCallback(
    (challenge: RoomChallengeAnswer) => {
      if (!pending || sending) return;
      void deliver({ ...pending.input, challenge }, true);
    },
    [deliver, pending, sending]
  );

  /** Arithmetic fallback: the typed sum. */
  const answer = useCallback(
    (raw: string) => {
      if (pending?.challenge.provider !== 'arithmetic') return;
      const parsed = parseChallengeAnswer(raw);
      if (parsed === null) {
        setAnswerError('Answer with a number.');
        return;
      }
      setAnswerError(null);
      sendAnswer({ token: pending.challenge.token, answer: parsed });
    },
    [pending, sendAnswer]
  );

  /** Turnstile: the widget's token. */
  const answerToken = useCallback(
    (token: string) => sendAnswer({ provider: 'turnstile', token }),
    [sendAnswer]
  );

  const cancelChallenge = useCallback(() => {
    setPending(null);
    setAnswerError(null);
  }, []);

  return {
    draft,
    setDraft,
    files,
    setFiles,
    sendLink,
    submit,
    answer,
    answerToken,
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
