import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';
import AnonProfileHead from './AnonProfileHead';
import GenderPicker from './GenderPicker';
import TagPicker from './TagPicker';
import { MAX_DISPLAY_NAME_LENGTH, THREAD_EXPIRY_TICK_MS, THREAD_LIFETIME_MS } from '../constants';
import { useNowWhile } from '../hooks/useNowWhile';
import { expiryLabel } from '../utils/expiryLabel';
import { vibeTagLabel } from '../utils/vibeTag';
import type { Gender, VibeTag } from '../types';
import './anonPartnerPanel.css';
import './anonPartnerCards.css';
import './anonSelfPanel.css';

type Props = {
  /** `column` is a standing side panel, `sheet` the bottom sheet below `lg`. */
  variant: 'column' | 'sheet';

  // What this stranger sees — frozen when the match began, because it cannot change.
  alias: string;
  aliasTags: VibeTag[];
  partnerName: string;
  startedAt: number | null;
  live: boolean;

  // The editor — edits reach the NEXT match, never this thread.
  displayName: string;
  vibeTags: VibeTag[];
  gender: Gender | null;
  remember: boolean;
  justSaved: boolean;
  onAliasChange: (value: string) => void;
  onTagsChange: (tags: VibeTag[]) => void;
  onGenderChange: (value: Gender | null) => void;
  onRememberChange: (value: boolean) => void;
};

/**
 * You.
 *
 * Two jobs, split into separate cards so the layout carries the caveat: the first
 * card is how this stranger sees you right now (fixed for the thread, with the
 * thread's real vanish clock); everything below is who you'll be for the next
 * whisper. That removes any need for a "saved for your next match" footnote.
 *
 * Reuses `TagPicker` and `GenderPicker` unchanged.
 */
export default function AnonSelfPanel({
  variant,
  alias,
  aliasTags,
  partnerName,
  startedAt,
  live,
  displayName,
  vibeTags,
  gender,
  remember,
  justSaved,
  onAliasChange,
  onTagsChange,
  onGenderChange,
  onRememberChange,
}: Props) {
  const signedIn = useAuthStore((s) => s.user !== null);
  // The clock has to tick, so it lives in state rather than `Date.now()` in render.
  const now = useNowWhile(live && Boolean(startedAt), THREAD_EXPIRY_TICK_MS);
  const msLeft = startedAt ? startedAt + THREAD_LIFETIME_MS - now : 0;

  return (
    <div className={variant === 'sheet' ? 'acp acp--sheet' : 'acp'}>
      <AnonProfileHead
        name={alias}
        status={live ? `How ${partnerName} sees you` : 'Your alias in this chat'}
        variant={variant}
      />

      <div className="acp__scroll">
        <div className="acp__body">
          {/* ── How they see you ───────────────────────────────────── */}
          <section className="acp__card">
            <p className="acp__label">Your vibes this chat</p>
            <div className="apn-vibes">
              {aliasTags.length > 0 ? (
                <div className="apn-chips">
                  {aliasTags.map((tag) => (
                    <span key={tag} className="apn-chip">{vibeTagLabel(tag)}</span>
                  ))}
                </div>
              ) : (
                <p className="apn-empty">You didn&rsquo;t pick any vibes for this chat.</p>
              )}
            </div>
            {live && startedAt && (
              <p className="asc__vanish">
                Vanishes in <b className="tabular-nums">{expiryLabel(msLeft)}</b>
              </p>
            )}
          </section>

          {/* ── Next whisper ───────────────────────────────────────── */}
          <p className="asc__heading">
            Next whisper <span>edits apply to your next match</span>
          </p>

          <section className="acp__card">
            <div className="asc__row">
              <label htmlFor="asc-alias" className="acp__label">
                Alias
              </label>
              <span className="asc__counter tabular-nums">
                {displayName.length}/{MAX_DISPLAY_NAME_LENGTH}
              </span>
            </div>
            <input
              id="asc-alias"
              type="text"
              value={displayName}
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              placeholder="NightOwl"
              onChange={(e) => onAliasChange(e.target.value)}
              aria-describedby="asc-alias-note"
              className="asc__input"
            />
            <p id="asc-alias-note" className="asc__note">
              The only thing anyone ever sees about you.
            </p>
          </section>

          <section className="acp__card">
            <TagPicker tags={vibeTags} onChange={onTagsChange} />
          </section>

          <section className="acp__card">
            <GenderPicker value={gender} onChange={onGenderChange} />
          </section>

          {/* ── Conversion CTA ───────────────────────────────────────────
              A guest with a good match otherwise has no reason to make an account
              until the mutual-like, which is where most of them drop off. Suppressed
              once signed in: "Create an account" is not true for someone who has one. */}
          {!signedIn && (
            <div className="asc__cta">
              <p className="asc__cta-title">Want to keep them?</p>
              <p className="asc__cta-body">
                Chats here vanish when you leave. An account keeps the connection and lets you
                message them for real.
              </p>
              <Link to="/auth" className="asc__cta-btn">
                Create an account
              </Link>
            </div>
          )}

          <button
            type="button"
            role="switch"
            aria-checked={remember}
            className="asc__switch"
            onClick={() => onRememberChange(!remember)}
          >
            <span className="asc__switch-text">
              <strong>Remember this alias</strong>
              <small>{justSaved ? 'Saved on this device' : 'Skips the form next visit'}</small>
            </span>
            <span className={`asc__track${remember ? ' asc__track--on' : ''}`} aria-hidden>
              <span className="asc__thumb" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
