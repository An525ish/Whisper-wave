import { useId } from 'react';
import { aliasFirstName } from '../utils/alias';
import { avatarGradient, vibeTagLabel } from '../utils/vibeTag';
import type { ThreadSummary } from '../types';
import './anonPartnerCards.css';
import './threadSummaryCard.css';

type Props = {
  /** Derived by `deriveThreadSummary` — this component makes no decisions. */
  summary: ThreadSummary;
  myAlias: string;
  partnerAlias: string;
  /** Primary: straight back into the queue. */
  onFindSomeoneNew: () => void;
  /** The X: sit with the finished thread instead. */
  onClose: () => void;
  /** What the X does, for assistive tech. */
  closeLabel: string;
};

const initial = (name: string): string => name.trim().charAt(0).toUpperCase() || '?';

/**
 * The sign-off shown when a thread ends.
 *
 * Built as a goodbye, not a report card: the two of you, one warm line from
 * `threadSummary`, how long and how much (with who did the talking, as in the
 * profile's "This thread"), and the tags you happened to share. There is no
 * score, no "you should have said more", and no way to read the other person's
 * side — the summary is derived from YOUR copy of the thread and deliberately
 * stops short of implying either person got it wrong.
 */
export default function ThreadSummaryCard({
  summary,
  myAlias,
  partnerAlias,
  onFindSomeoneNew,
  onClose,
  closeLabel,
}: Props) {
  const headingId = useId();
  const firstAlias = aliasFirstName(partnerAlias, 'them');
  const count = `${summary.totalMessages} ${summary.totalMessages === 1 ? 'message' : 'messages'}`;

  return (
    <section className="tsc" aria-labelledby={headingId}>
      <button type="button" className="tsc__close" onClick={onClose} aria-label={closeLabel} title={closeLabel}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="tsc__head">
        <div className="tsc__pair" aria-hidden>
          <span className="tsc__avatar" style={{ background: avatarGradient(myAlias) }}>
            {initial(myAlias)}
          </span>
          <span className="tsc__avatar" style={{ background: avatarGradient(partnerAlias) }}>
            {initial(partnerAlias)}
          </span>
        </div>
        <div className="tsc__headcopy">
          <h2 className="tsc__title" id={headingId}>
            That thread’s over
          </h2>
          <p className="tsc__sub">
            You and {firstAlias} · {summary.durationLabel} · {count}
          </p>
        </div>
      </div>

      <p className="tsc__verdict">{summary.verdict}</p>

      {summary.totalMessages > 0 && (
        <div className="tsc__balance">
          <div
            className="apn-balance"
            role="img"
            aria-label={`You sent ${summary.myMessages} messages, ${firstAlias} sent ${summary.theirMessages}`}
          >
            <span className="apn-balance__seg apn-balance__seg--me" style={{ flexGrow: summary.myMessages }} />
            <span className="apn-balance__seg apn-balance__seg--them" style={{ flexGrow: summary.theirMessages }} />
          </div>
          <p className="apn-balance__legend">
            <span><i className="apn-dot apn-dot--me" aria-hidden />You <b className="tabular-nums">{summary.myMessages}</b></span>
            <span><i className="apn-dot apn-dot--them" aria-hidden />{firstAlias} <b className="tabular-nums">{summary.theirMessages}</b></span>
          </p>
        </div>
      )}

      {summary.sharedTags.length > 0 && (
        <div className="tsc__shared">
          <p className="tsc__shared-label">Vibes you shared</p>
          <ul className="tsc__tags" aria-label="Vibe tags you both had">
            {summary.sharedTags.map((tag) => (
              <li key={tag} className="apn-chip apn-chip--shared">
                {vibeTagLabel(tag)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="tsc__actions">
        <button type="button" className="tsc__primary" onClick={onFindSomeoneNew}>
          Find someone new
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}
