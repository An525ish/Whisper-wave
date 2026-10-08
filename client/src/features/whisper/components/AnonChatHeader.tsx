import { vibeTagLabel, avatarGradient } from '../utils/vibeTag';
import type { VibeTag } from '../types';

type Props = {
  partnerName: string;
  partnerTags: VibeTag[];
  socketDegraded: boolean;
  reconnecting: boolean;
  likeDisabled: boolean;
  likeSent: boolean;
  mutualLike: boolean;
  partnerVibed: boolean;
  vibeUnlocked: boolean;
  likeTitle: string;
  onLike: () => void;
  /** Asks for confirmation before skipping a live match. */
  onSkip: () => void;
  onReport: () => void;
};

/**
 * Anonymous chat header: back/report, partner identity, and the persistent
 * like affordance.
 *
 * The like lives here permanently because it is the conversion funnel — a
 * one-shot prompt that can be permanently dismissed is not enough.
 */
export default function AnonChatHeader({
  partnerName,
  partnerTags,
  socketDegraded,
  reconnecting,
  likeDisabled,
  likeSent,
  mutualLike,
  partnerVibed,
  vibeUnlocked,
  likeTitle,
  onLike,
  onSkip,
  onReport,
}: Props) {
  return (
    <header className="acr-header">
      <div className="acr-header__card">
        <div className="flex min-w-0 items-center gap-0">
          <button
            type="button"
            onClick={onSkip}
            className="acr-back"
            aria-label="Skip to someone new"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="acr-avatar" style={{ background: avatarGradient(partnerName) }}>
              <span className="acr-avatar__ring" aria-hidden />
              {partnerName.charAt(0).toUpperCase()}
              <span
                className={`acr-avatar__dot${socketDegraded ? ' acr-avatar__dot--warn' : ''}`}
                aria-hidden
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="acr-name-row">
                <p className="acr-name">{partnerName}</p>
                <span className="acr-pill">anon</span>
              </div>
              {partnerTags.length > 0 ? (
                <div className="acr-tags">
                  {partnerTags.map((t) => (
                    <span key={t} className="acr-tag">{vibeTagLabel(t)}</span>
                  ))}
                </div>
              ) : socketDegraded ? (
                <p className="acr-status acr-status--warn" role="status">
                  {reconnecting ? 'Reconnecting…' : 'Connection lost — retrying…'}
                </p>
              ) : (
                <p className="acr-status">
                  <span className="acr-wave" aria-hidden>
                    <span /><span /><span /><span />
                  </span>
                  in the void with you
                </p>
              )}
            </div>
          </div>

          {/* The persistent like. It is NOT disabled before the unlock gate —
              a dead control that explains itself on tap is friendlier than one
              that silently refuses, and the header heart must stay reachable
              after the one-shot prompt is dismissed. */}
          <button
            type="button"
            onClick={onLike}
            disabled={likeDisabled}
            title={likeTitle}
            aria-label={likeTitle}
            aria-pressed={likeSent || mutualLike}
            className={[
              'acr-like',
              mutualLike ? 'acr-like--mutual' : '',
              likeSent && !mutualLike ? 'acr-like--sent' : '',
              partnerVibed && !likeSent ? 'acr-like--ping' : '',
              !vibeUnlocked && !likeSent && !mutualLike ? 'acr-like--locked' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden
              fill={likeSent || mutualLike ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1 7.8 7.7 7.8-7.7 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onReport}
            className="acr-back"
            aria-label="Report this person"
            title="Report"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
