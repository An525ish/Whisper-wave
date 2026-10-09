import './anonVibeHeart.css';

type Props = {
  /** How close the vibe gate is to opening, 0–1. */
  progress: number;
  unlocked: boolean;
  sent: boolean;
  mutual: boolean;
  /** They already sent one — invite a reply. */
  partnerVibed: boolean;
  disabled: boolean;
  title: string;
  onClick: () => void;
};

/**
 * The persistent vibe button — the conversion funnel, so it lives in the header at
 * all times.
 *
 * While the gate is closed a ring around the heart fills as the two of you chat,
 * so "why can't I press this?" answers itself; at 100% it opens and starts to
 * breathe. It is NOT disabled before the gate: a control that explains itself on
 * tap beats one that silently refuses, and it must stay reachable after the
 * one-shot prompt is dismissed.
 */
export default function VibeHeart({
  progress,
  unlocked,
  sent,
  mutual,
  partnerVibed,
  disabled,
  title,
  onClick,
}: Props) {
  const filled = sent || mutual;
  const state = mutual
    ? 'avh--mutual'
    : sent
      ? 'avh--sent'
      : unlocked
        ? 'avh--ready'
        : 'avh--locked';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={filled}
      className={`avh ${state}${partnerVibed && !sent ? ' avh--ping' : ''}`}
    >
      <svg className="avh__ring" viewBox="0 0 44 44" fill="none" aria-hidden>
        <circle className="avh__track" cx="22" cy="22" r="19" />
        <circle
          className="avh__arc"
          cx="22"
          cy="22"
          r="19"
          pathLength={100}
          style={{ strokeDasharray: `${Math.round(progress * 100)} 100` }}
        />
      </svg>
      <svg
        className="avh__heart"
        width="19"
        height="19"
        viewBox="0 0 24 24"
        aria-hidden
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1 7.8 7.7 7.8-7.7 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    </button>
  );
}
