import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';
import GenderPicker from './GenderPicker';
import TagPicker from './TagPicker';
import { MAX_DISPLAY_NAME_LENGTH } from '../constants';
import { formatThreadDuration } from '../utils/threadSummary';
import { avatarGradient, vibeTagLabel } from '../utils/vibeTag';
import type { Gender, ThreadStats, VibeTag } from '../types';
import './anonProfilePanel.css';

type Props = {
  /** `column` is the `lg` rail, `sheet` the bottom sheet below it. */
  variant: 'column' | 'sheet';
  displayName: string;
  vibeTags: VibeTag[];
  gender: Gender | null;
  remember: boolean;
  justSaved: boolean;
  /** Null when there is no live thread — the stats block is hidden then. */
  stats: ThreadStats | null;
  /** True while matched, so the panel can explain that edits apply later. */
  inThread: boolean;
  onAliasChange: (value: string) => void;
  onTagsChange: (tags: VibeTag[]) => void;
  onGenderChange: (value: Gender | null) => void;
  onRememberChange: (value: boolean) => void;
};

/**
 * The guest's own identity, on the right of the chat.
 *
 * Mirrors the logged-in `ProfilePanel` — a column at `lg`, a sheet below it —
 * so the app has one spatial grammar: conversation in the middle, context on
 * the right. Reuses `TagPicker` and `GenderPicker` verbatim rather than
 * reimplementing them; the only anon-specific thing is that there is no real
 * avatar, so identity is a gradient derived from the alias.
 */
export default function AnonProfilePanel({
  variant,
  displayName,
  vibeTags,
  gender,
  remember,
  justSaved,
  stats,
  inThread,
  onAliasChange,
  onTagsChange,
  onGenderChange,
  onRememberChange,
}: Props) {
  const initial = displayName.trim().charAt(0).toUpperCase() || '?';
  const signedIn = useAuthStore((s) => s.user !== null);

  return (
    <div className={variant === 'sheet' ? 'acp acp--sheet' : 'acp'}>
      <div className="acp__top">
        <div
          className="acp__orb"
          style={{ background: avatarGradient(displayName || 'anon') }}
          aria-hidden
        >
          {initial}
        </div>
        <p className="acp__eyebrow">Your anonymous self</p>
      </div>

      <div className="acp__body">
        {/* ── Alias ─────────────────────────────────────────────────── */}
        <section className="acp__card">
          <div className="acp__label-row">
            <label htmlFor="acp-alias" className="acp__label">
              Alias
            </label>
            <span className="acp__counter tabular-nums">
              {displayName.length}/{MAX_DISPLAY_NAME_LENGTH}
            </span>
          </div>
          <input
            id="acp-alias"
            type="text"
            value={displayName}
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            placeholder="NightOwl"
            onChange={(e) => onAliasChange(e.target.value)}
            aria-describedby="acp-alias-note"
            className="acp__input"
          />
          <p id="acp-alias-note" className="acp__note" role={inThread ? 'note' : undefined}>
            {inThread
              ? 'Saved for your next match — this thread keeps the name you two met under.'
              : 'This is the only thing the other person ever sees about you.'}
          </p>
        </section>

        <section className="acp__card">
          <GenderPicker value={gender} onChange={onGenderChange} />
        </section>

        <section className="acp__card">
          <TagPicker tags={vibeTags} onChange={onTagsChange} />
        </section>

        {/* ── Conversion CTA ───────────────────────────────────────────
            Deliberately above the thread summary. It is the panel's whole job —
            a guest with a good match currently has no reason to make an account
            until the mutual-like, which is the moment most of them drop off —
            and below the fold in a narrow rail it is never seen.

            Suppressed once signed in. There is no version of "Create an account"
            that is true for someone who already has one, and a signed-in user is
            now carrying this thread through their account anyway. */}
        {!signedIn && (
          <div className="acp__cta">
            <p className="acp__cta-title">Want to keep them?</p>
            <p className="acp__cta-body">
              Chats here vanish when you leave. An account keeps the connection and
              lets you message them for real.
            </p>
            <Link to="/auth" className="acp__cta-btn">
              Create an account
            </Link>
          </div>
        )}

        {/* ── This thread ───────────────────────────────────────────── */}
        {stats && (
          <section className="acp__card">
            <p className="acp__label">This thread</p>
            <p className="acp__stat-lead">{stats.minutes < 1 ? 'Just met' : `${formatThreadDuration(stats.minutes * 60_000)} together`}</p>
            <dl className="acp__stats">
              <div className="acp__stat">
                <dt>Messages</dt>
                <dd className="tabular-nums">{stats.totalMessages}</dd>
              </div>
              <div className="acp__stat">
                <dt>You sent</dt>
                <dd className="tabular-nums">{stats.myMessages}</dd>
              </div>
            </dl>
            {stats.sharedTags.length > 0 && (
              <p className="acp__shared">
                <span className="acp__shared-label">In common</span>
                {stats.sharedTags.map((tag) => (
                  <span key={tag} className="acp__shared-tag">
                    {vibeTagLabel(tag)}
                  </span>
                ))}
              </p>
            )}
          </section>
        )}

        {/* ── Keep this self ────────────────────────────────────────── */}
        <label className="acp__remember">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => onRememberChange(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className={['acp__check', remember ? 'acp__check--on' : ''].join(' ')}
          >
            {remember && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0b1a12" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </span>
          <span className="acp__remember-text">
            Remember this alias
            <span className="acp__remember-hint">
              {justSaved ? 'Saved on this device' : 'Skips the form next visit'}
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}