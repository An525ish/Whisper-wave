import { Link } from 'react-router-dom';
import { track } from '@/shared/lib/analytics';
import { ROUTES } from '@/shared/constants/routes';
import { ANON_NEXT, LIVE_PILL_PREVIEW_MAX, WHISPER_EVENTS } from '../constants';
import { useLeaveQueueMutation } from '../hooks/useMatchQueueMutations';
import { useWhisperSession } from '../hooks/useWhisperSession';
import { useAnonStore } from '../stores/anonStore';
import { trackSessionEnd } from '../stores/trackSessionEnd';

/**
 * A live-whisper pill: the way back into an ongoing anonymous session from
 * anywhere else in the hub.
 *
 * Renders nothing on the whisper route itself or when no session is live.
 * Copy is honest about state (searching / live / partner left) — no faked
 * counts, no fake activity. The × on the left ends the session without opening
 * the whisper screen.
 */
const LiveWhisperPill = () => {
  const status = useAnonStore((s) => s.status);
  const partnerName = useAnonStore((s) => s.partnerName);
  const lastMessage = useAnonStore((s) =>
    s.messages.length > 0 ? s.messages[s.messages.length - 1] : undefined
  );
  const { socketRef } = useWhisperSession();
  const leaveMutation = useLeaveQueueMutation();

  if (status !== 'waiting' && status !== 'resuming' && status !== 'matched' && status !== 'partner_left') {
    return null;
  }

  const searching = status === 'waiting' || status === 'resuming';
  const ended = status === 'partner_left';
  const preview = !searching && !ended && lastMessage
    ? lastMessage.content.slice(0, LIVE_PILL_PREVIEW_MAX) +
      (lastMessage.content.length > LIVE_PILL_PREVIEW_MAX ? '…' : '')
    : null;

  const label = searching
    ? 'Searching for a stranger…'
    : ended
      ? `${partnerName ?? 'Stranger'} left. Find someone new`
      : `${partnerName ?? 'Stranger'}${preview ? ` · “${preview}”` : ''}`;

  const dismiss = () => {
    const { sessionId, status: liveStatus } = useAnonStore.getState();
    // Live match: tell the partner now, then drop the queue/identity card.
    if (sessionId && (liveStatus === 'matched' || liveStatus === 'partner_left')) {
      trackSessionEnd('pill_dismiss');
      socketRef.current?.emit(ANON_NEXT, {});
    }
    track(WHISPER_EVENTS.PILL_DISMISS, { state: liveStatus });
    leaveMutation.mutate();
  };

  return (
    <div className="relative z-20 shrink-0 px-3 pb-2 pt-1 min-[375px]:px-4">
      <div className="mx-auto flex w-full max-w-md items-center gap-1 rounded-full border border-green/30 bg-background/95 py-1 pl-1 pr-3 shadow-lg backdrop-blur-md min-[375px]:gap-1.5 min-[375px]:pr-4">
        <button
          type="button"
          onClick={dismiss}
          disabled={leaveMutation.isPending}
          aria-label="End anonymous chat"
          title="End anonymous chat"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-body-300 transition-colors hover:bg-white/[0.08] hover:text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green disabled:opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <Link
          to={ROUTES.whisper}
          onClick={() => track(WHISPER_EVENTS.PILL_CLICK, { state: status })}
          aria-label={`Return to whisper: ${label}`}
          className="flex min-w-0 flex-1 items-center gap-2 py-1.5 transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green motion-reduce:animate-none"
        >
          <span
            aria-hidden
            className={`h-2 w-2 shrink-0 rounded-full ${
              ended ? 'bg-body-300' : 'animate-pulse bg-green motion-reduce:animate-none'
            }`}
          />
          <span className="min-w-0 flex-1 truncate text-left text-[13px] font-medium text-body min-[375px]:text-sm">
            {label}
          </span>
          <span aria-hidden className="shrink-0 text-xs font-semibold text-green min-[375px]:text-sm">
            Open
          </span>
        </Link>
      </div>
    </div>
  );
};

export default LiveWhisperPill;
