import dayjs from 'dayjs';
import AnonProfileHead from './AnonProfileHead';
import SparkDeck from './SparkDeck';
import { ANON_REACTION_LABELS, FRESH_THREAD_MESSAGES } from '../constants';
import { formatThreadDuration } from '../utils/threadSummary';
import { vibeTagLabel } from '../utils/vibeTag';
import type {
  ReactionTally,
  Spark,
  ThreadLink,
  ThreadStats,
  VibeOverlap,
  VibeTag,
} from '../types';
import './anonPartnerPanel.css';
import './anonPartnerCards.css';

type Props = {
  /** `column` is a standing side panel, `sheet` the bottom sheet below `lg`. */
  variant: 'column' | 'sheet';
  name: string;
  tags: VibeTag[];
  overlap: VibeOverlap;
  sparks: Spark[];
  /** Null when there is no live thread. */
  stats: ThreadStats | null;
  links: ThreadLink[];
  reactions: ReactionTally[];
  typing: boolean;
  left: boolean;
  onPickSpark: (text: string) => void;
};

const statusLine = (typing: boolean, left: boolean, stats: ThreadStats | null): string => {
  if (left) return 'Left the chat';
  if (typing) return 'typing…';
  if (stats && stats.minutes >= 1) return `${formatThreadDuration(stats.minutes * 60_000)} together`;
  return 'In the void with you';
};

/**
 * The other person.
 *
 * Everything here is what an anonymous stranger can honestly be: an alias, the
 * vibes they chose, and what the two of you have done together — nothing is
 * fetched (see `usePartnerProfile`). Ordered by what you would act on: who they
 * are, then a one-tap opener, then the thread's history.
 */
export default function AnonPartnerPanel({
  variant,
  name,
  tags,
  overlap,
  sparks,
  stats,
  links,
  reactions,
  typing,
  left,
  onPickSpark,
}: Props) {
  const total = stats ? stats.myMessages + stats.theirMessages : 0;
  const sharedCount = overlap.shared.length;

  return (
    <div className={variant === 'sheet' ? 'acp acp--sheet' : 'acp'}>
      <AnonProfileHead
        name={name}
        status={statusLine(typing, left, stats)}
        live={!left}
        variant={variant}
      />

      <div className="acp__scroll">
        <div className="acp__body">
          {/* ── Their vibes ─────────────────────────────────────────── */}
          <section className="acp__card">
            <p className="acp__label">{name}&rsquo;s vibes</p>
            <div className="apn-vibes">
              {sharedCount > 0 && (
                <div className="apn-group">
                  <p className="apn-group__label">{sharedCount} in common</p>
                  <div className="apn-chips">
                    {overlap.shared.map((tag) => (
                      <span key={tag} className="apn-chip apn-chip--shared">{vibeTagLabel(tag)}</span>
                    ))}
                  </div>
                </div>
              )}
              {overlap.onlyTheirs.length > 0 && (
                <div className="apn-group">
                  <p className="apn-group__label">{sharedCount > 0 ? `Only ${name}` : 'Theirs'}</p>
                  <div className="apn-chips">
                    {overlap.onlyTheirs.map((tag) => (
                      <span key={tag} className="apn-chip">{vibeTagLabel(tag)}</span>
                    ))}
                  </div>
                </div>
              )}
              {tags.length === 0 && (
                <p className="apn-empty">{name} kept their vibes secret.</p>
              )}
            </div>
          </section>

          {/* ── Sparks ──────────────────────────────────────────────── */}
          {!left && (
            <section className="acp__card">
              <SparkDeck
                sparks={sparks}
                fresh={total < FRESH_THREAD_MESSAGES}
                disabled={left}
                onPick={onPickSpark}
              />
            </section>
          )}

          {/* ── This thread ─────────────────────────────────────────── */}
          {stats && (
            <section className="acp__card">
              <p className="acp__label">This thread</p>
              {total === 0 ? (
                <p className="apn-empty">
                  {left ? 'No messages were sent.' : 'Nothing said yet — break the ice.'}
                </p>
              ) : (
                <>
                  <div
                    className="apn-balance"
                    role="img"
                    aria-label={`You sent ${stats.myMessages} messages, ${name} sent ${stats.theirMessages}`}
                  >
                    <span className="apn-balance__seg apn-balance__seg--me" style={{ flexGrow: stats.myMessages }} />
                    <span className="apn-balance__seg apn-balance__seg--them" style={{ flexGrow: stats.theirMessages }} />
                  </div>
                  <p className="apn-balance__legend">
                    <span><i className="apn-dot apn-dot--me" aria-hidden />You <b className="tabular-nums">{stats.myMessages}</b></span>
                    <span><i className="apn-dot apn-dot--them" aria-hidden />{name} <b className="tabular-nums">{stats.theirMessages}</b></span>
                  </p>
                </>
              )}

              {reactions.length > 0 && (
                <ul className="apn-reacts">
                  {reactions.map((row) => (
                    <li key={row.reaction} className="apn-react">
                      <span className="apn-react__glyph" aria-hidden>{ANON_REACTION_LABELS[row.reaction].glyph}</span>
                      <span className="apn-react__text">
                        {ANON_REACTION_LABELS[row.reaction].label}
                        <span className="apn-react__who">
                          {row.me > 0 && `you ${row.me}`}
                          {row.me > 0 && row.them > 0 && ' · '}
                          {row.them > 0 && `${name} ${row.them}`}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* ── Shared links ────────────────────────────────────────── */}
          <section className="acp__card">
            <p className="acp__label">Shared links</p>
            {links.length === 0 ? (
              <p className="apn-empty">
                Links either of you paste collect here. Anonymous chats are text-only — no photos or files.
              </p>
            ) : (
              <ul className="apn-links">
                {links.map((link) => (
                  <li key={link.url}>
                    <a
                      className="apn-link"
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      aria-label={`Open ${link.host}, shared by ${link.from === 'me' ? 'you' : name}`}
                    >
                      <span className={`apn-link__icon apn-link__icon--${link.from}`} aria-hidden>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.7 1.7" />
                          <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.7-1.7" />
                        </svg>
                      </span>
                      <span className="apn-link__text">
                        <span className="apn-link__host">{link.host}</span>
                        <span className="apn-link__meta">
                          {link.from === 'me' ? 'you' : name} · {dayjs(link.sentAt).format('h:mm A')}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
