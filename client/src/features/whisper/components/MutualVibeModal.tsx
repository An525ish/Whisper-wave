import { useEffect, useRef } from 'react';
import { getInitial } from '@/shared/utils/helpers';
import { vibeTagLabel } from '../utils/vibeTag';
import { useCompleteConnection } from '../hooks/useCompleteConnection';
import type { VibeTag } from '../types';
import './mutualVibeModal.css';
import './mutualVibeModalCopy.css';
import './mutualVibeModalDock.css';
import './mutualVibeModalMotion.css';

type Props = {
  open: boolean;
  myName: string;
  partnerName: string;
  partnerTags: VibeTag[];
  connectToken: string;
  onClose: () => void;
};

/**
 * The mutual-vibe celebration.
 *
 * Presentational only: the connect mutation, the auth redirect and the
 * waiting/error states all live in `useCompleteConnection`.
 */
export default function MutualVibeModal({
  open,
  myName,
  partnerName,
  partnerTags,
  connectToken,
  onClose,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { connect, isPending, isWaitingForPartner, error } =
    useCompleteConnection();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const you = myName.trim() || 'You';
  const them = partnerName.trim() || 'Them';

  return (
    <div className="mvs-modal" role="presentation">
      <button type="button" className="mvs-modal__backdrop" aria-label="Close" onClick={onClose} />

      <div
        ref={panelRef}
        className="mvs-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mutual-vibe-modal-title"
        tabIndex={-1}
      >
        <div className="auth-stage mvs-stage mvs-stage--modal" aria-hidden>
          <div className="auth-stage__glow" />
          <div className="mvs-orbit" />

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
            It&apos;s a vibe
          </h2>
          <p className="mvs-lede">
            You and <strong>{them}</strong> are on the same wavelength. Open a
            real DM anytime — sign in required.
          </p>
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

            <button
              type="button"
              onClick={() => connect(connectToken)}
              disabled={isPending || isWaitingForPartner}
              className="mvs-btn-primary"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/70"
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

            <button type="button" onClick={onClose} className="mvs-btn-ghost">
              Keep chatting anonymously
            </button>

            {error && (
              <div
                className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                role="alert"
              >
                {error}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
