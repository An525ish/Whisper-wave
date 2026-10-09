import VibeHeart from './VibeHeart';
import { useProfileViewStore } from '../stores/profileViewStore';
import { vibeTagLabel, avatarGradient } from '../utils/vibeTag';
import type { VibeTag } from '../types';

type Props = {
  partnerName: string;
  partnerTags: VibeTag[];
  partnerTyping: boolean;
  socketDegraded: boolean;
  reconnecting: boolean;
  likeDisabled: boolean;
  likeSent: boolean;
  mutualLike: boolean;
  partnerVibed: boolean;
  vibeUnlocked: boolean;
  /** How close the vibe gate is to opening, 0–1 — fills the heart's ring. */
  vibeProgress: number;
  likeTitle: string;
  onLike: () => void;
  /** Asks for confirmation before skipping a live match. */
  onSkip: () => void;
  onReport: () => void;
};

/**
 * The conversation header: back, who you're talking to, the vibe heart, report.
 *
 * Same shell as the logged-in chat's header (`ConversationHeader`) so the two read
 * as one product. Tapping the partner opens their profile (the sheet below `lg`,
 * their tab at `lg`).
 *
 * The heart lives here permanently because it is the conversion funnel — a one-shot
 * prompt that can be permanently dismissed is not enough.
 */
export default function AnonChatHeader({
  partnerName,
  partnerTags,
  partnerTyping,
  socketDegraded,
  reconnecting,
  likeDisabled,
  likeSent,
  mutualLike,
  partnerVibed,
  vibeUnlocked,
  vibeProgress,
  likeTitle,
  onLike,
  onSkip,
  onReport,
}: Props) {
  const openProfile = useProfileViewStore((s) => s.openSheet);

  return (
    <header className="acr-header">
      <div className="acr-header__card">
        <div className="acr-header__row">
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

          <div className="acr-identity">
            <div className="acr-avatar" style={{ background: avatarGradient(partnerName) }} aria-hidden>
              {partnerName.charAt(0).toUpperCase()}
              <span className={`acr-avatar__dot${socketDegraded ? ' acr-avatar__dot--warn' : ''}`} />
            </div>

            <div className="acr-identity__text">
              <div className="acr-name-row">
                <p className="acr-name">{partnerName}</p>
                <span className="acr-pill">anon</span>
              </div>

              {socketDegraded ? (
                <p className="acr-status acr-status--warn" role="status">
                  {reconnecting ? 'Reconnecting…' : 'Connection lost — retrying…'}
                </p>
              ) : partnerTyping ? (
                <p className="acr-status" role="status">
                  typing…
                </p>
              ) : partnerTags.length > 0 ? (
                <div className="acr-tags">
                  {partnerTags.map((t) => (
                    <span key={t} className="acr-tag">{vibeTagLabel(t)}</span>
                  ))}
                </div>
              ) : (
                <p className="acr-status">in the void with you</p>
              )}
            </div>

            {/* Stretched over the avatar + name so the whole identity block is the
                target, without nesting block content inside a <button>. */}
            <button
              type="button"
              className="acr-identity__hit"
              onClick={() => openProfile('them')}
              aria-label={`View ${partnerName}'s profile`}
            />
          </div>

          <VibeHeart
            progress={vibeProgress}
            unlocked={vibeUnlocked}
            sent={likeSent}
            mutual={mutualLike}
            partnerVibed={partnerVibed}
            disabled={likeDisabled}
            title={likeTitle}
            onClick={onLike}
          />

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
