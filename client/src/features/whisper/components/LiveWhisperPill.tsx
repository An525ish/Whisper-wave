import { Link } from 'react-router-dom';
import { track } from '@/shared/lib/analytics';
import { ROUTES } from '@/shared/constants/routes';
import { LIVE_PILL_PREVIEW_MAX, WHISPER_EVENTS } from '../constants';
import { useAnonStore } from '../stores/anonStore';

/**
 * A live-whisper pill: the way back into an ongoing anonymous session from
 * anywhere else in the hub.
 *
 * Renders nothing on the whisper route itself or when no session is live.
 * Copy is honest about state (searching / live / partner left) — no faked
 * counts, no fake activity.
 */
const LiveWhisperPill = () => {
  const status = useAnonStore((s) => s.status);
  const partnerName = useAnonStore((s) => s.partnerName);
  const lastMessage = useAnonStore((s) =>
    s.messages.length > 0 ? s.messages[s.messages.length - 1] : undefined
  );

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
      ? `${partnerName ?? 'Stranger'} left — find someone new`
      : `${partnerName ?? 'Stranger'}${preview ? ` · “${preview}”` : ''}`;

  return (
    <div className="shrink-0 px-4 pb-2 pt-1">
      <Link
        to={ROUTES.whisper}
        onClick={() => track(WHISPER_EVENTS.PILL_CLICK, { state: status })}
        aria-label={`Return to whisper: ${label}`}
        className="mx-auto flex w-full max-w-md items-center gap-2.5 rounded-full border border-green/30 bg-background/95 py-2.5 pl-4 pr-5 shadow-lg backdrop-blur-md transition-colors hover:border-green/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green motion-reduce:animate-none"
      >
        <span
          aria-hidden
          className={`h-2 w-2 shrink-0 rounded-full ${
            ended ? 'bg-body-300' : 'animate-pulse bg-green motion-reduce:animate-none'
          }`}
        />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-body">
          {label}
        </span>
        <span aria-hidden className="shrink-0 text-sm font-semibold text-green">
          Open →
        </span>
      </Link>
    </div>
  );
};

export default LiveWhisperPill;
