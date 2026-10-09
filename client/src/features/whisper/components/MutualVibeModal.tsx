import { getInitial } from '@/shared/utils/helpers';
import { CONNECT_COUNTDOWN_TICK_MS } from '../constants';
import { useCompleteConnection } from '../hooks/useCompleteConnection';
import { useConnectDeadline } from '../hooks/useConnectDeadline';
import { formatCountdown } from '../utils/formatCountdown';
import { vibeTagLabel } from '../utils/vibeTag';
import WhisperDialog from './WhisperDialog';
import type { VibeTag } from '../types';
import './whisperShared.css';
import './mutualVibeModal.css';
import './mutualVibeModalCopy.css';
import './mutualVibeModalDock.css';
import './mutualVibeModalMotion.css';

type Props = {
  myName: string;
  partnerName: string;
  partnerTags: VibeTag[];
  connectToken: string;
  /** When the mutual like landed — fallback clock if the token can't be decoded. */
  mutualAt: number | null;
  /** They left after the mutual like; the token is still good until it expires. */
  partnerLeft: boolean;
  onClose: () => void;
  /** The window closed: end the match and return to the picker. */
  onExpiredLeave: () => void;
};

/**
 * The mutual-vibe celebration.
 *
 * Mounted only while visible, so its countdown clock always starts fresh.
 * Presentational only: the connect mutation, the auth redirect and the waiting
 * state live in `useCompleteConnection`, the 10-minute window in
 * `useConnectDeadline`. Once the window closes the Connect CTA is gone and the
 * only way forward is a fresh match.
 */
export default function MutualVibeModal({
  myName,
  partnerName,
  partnerTags,
  connectToken,
  mutualAt,
  partnerLeft,
  onClose,
  onExpiredLeave,
}: Props) {
  const { connect, isPending, isWaitingForPartner } = useCompleteConnection();
  const { msLeft, expired } = useConnectDeadline(
    connectToken,
    mutualAt,
    CONNECT_COUNTDOWN_TICK_MS
  );

  const you = myName.trim() || 'You';
  const them = partnerName.trim() || 'Them';

  return (
    <WhisperDialog
      open
      onClose={onClose}
      labelledBy="mutual-vibe-modal-title"
      rootClassName="mvs-modal"
      backdropClassName="mvs-modal__backdrop"
      panelClassName="mvs-modal__panel"
    >
      <div className="auth-stage mvs-stage mvs-stage--modal" aria-hidden>
        <div className="auth-stage__glow" />
        <div className="auth-stage__orbit auth-stage__orbit--mid" />

        <svg className="auth-stage__rings" viewBox="0 0 360 360" fill="none">
          <circle className="auth-stage__ring" cx="180" cy="180" r="78" />
          <circle className="auth-stage__ring auth-stage__ring--b" cx="180" cy="180" r="118" />
          <circle className="auth-stage__ring auth-stage__ring--c" cx="180" cy="180" r="158" />
          <path className="auth-stage__arc" d="M52 180 A128 128 0 0 1 180 52" strokeLinecap="round" />
        </svg>

        <div className="mvs-resonance">
          <svg className="mvs-waves" viewBox="0 0 320 120" fill="none" aria-hidden>
            <path
              className="mvs-wave mvs-wave--you"
              d="M 8 58 C 38 38, 58 78, 88 58 S 148 38, 178 58 S 238 78, 268 58 S 298 38, 312 58"
            />
            <path
              className="mvs-wave mvs-wave--them"
              d="M 8 62 C 38 82, 58 42, 88 62 S 148 82, 178 62 S 238 42, 268 62 S 298 82, 312 62"
            />
          </svg>

          <div className="mvs-lock">
            <div className="mvs-lock__halo" />
            <div className="mvs-lock__names">
              <span className="mvs-lock__name mvs-lock__name--you">{you}</span>
              <span className="mvs-lock__name mvs-lock__name--them">{them}</span>
            </div>
            <div className="mvs-lock__orbs">
              <div className="mvs-lock__person mvs-lock__person--you">
                <div className="mvs-lock__orb mvs-lock__orb--you">{getInitial(you)}</div>
              </div>
              <div className="mvs-lock__person mvs-lock__person--them">
                <div className="mvs-lock__orb mvs-lock__orb--them">{getInitial(them)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-stage__wave">
          {Array.from({ length: 24 }, (_, i) => (
            <span key={i} className="auth-stage__bar" style={{ animationDelay: `${(i % 6) * 0.08}s` }} />
          ))}
        </div>
      </div>

      <header className="mvs-copy mvs-copy--modal">
        <p className="mvs-kicker">
          <span className="mvs-kicker__dot" aria-hidden />
          Mutual vibe
        </p>
        <h2 id="mutual-vibe-modal-title" className="mvs-headline">
          {expired ? 'The moment passed' : 'It\u2019s a vibe'}
        </h2>
        {expired ? (
          <p className="mvs-lede">Find someone new?</p>
        ) : (
          <>
            <p className="mvs-lede">
              You and <strong>{them}</strong> are on the same wavelength. Open a
              real DM before the timer runs out — sign in required.
            </p>
            {msLeft !== null && (
              <p className="mvs-timer" role="timer" aria-label="Time left to connect">
                <time>{formatCountdown(msLeft)}</time> left to connect
              </p>
            )}
            {partnerLeft && (
              <p className="mvs-note">
                {them} has left the chat, but you can still connect until the timer
                ends.
              </p>
            )}
          </>
        )}
      </header>

      <section className="mvs-dock mvs-dock--modal" aria-labelledby="mutual-vibe-modal-title">
        <div className="mvs-dock__inner">
          {partnerTags.length > 0 && (
            <div className="mvs-tag-rail" aria-label={`${them}'s vibes`}>
              {partnerTags.map((tag) => (
                <span key={tag} className="mvs-tag">{vibeTagLabel(tag)}</span>
              ))}
            </div>
          )}

          {expired ? (
            <button type="button" onClick={onExpiredLeave} className="mvs-btn-primary">
              Find someone new
            </button>
          ) : (
            <button
              type="button"
              onClick={() => connect(connectToken)}
              disabled={isPending || isWaitingForPartner}
              className="mvs-btn-primary"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="inline-block h-4 w-4 rounded-full border-2 border-black/20 border-t-black/70 motion-safe:animate-spin"
                    aria-hidden
                  />
                  Opening DM…
                </span>
              ) : isWaitingForPartner ? (
                'Waiting for them to connect too…'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Open DM
                </span>
              )}
            </button>
          )}

          <button type="button" onClick={onClose} className="mvs-btn-ghost">
            {expired ? 'Close' : 'Keep chatting anonymously'}
          </button>
        </div>
      </section>
    </WhisperDialog>
  );
}
