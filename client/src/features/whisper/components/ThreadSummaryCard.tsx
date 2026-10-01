import { useId } from 'react';
import { vibeTagLabel } from '../utils/vibeTag';
import type { ThreadSummary } from '../utils/threadSummary';
import './threadSummaryCard.css';

type Props = {
  /** Derived by `deriveThreadSummary` — this component makes no decisions. */
  summary: ThreadSummary;
  partnerAlias: string;
  /** Primary: straight back into the queue. */
  onFindSomeoneNew: () => void;
  /** Secondary: sit with the finished thread for a moment. */
  onSecondary: () => void;
  secondaryLabel: string;
};

/**
 * The sign-off shown when a thread ends.
 *
 * Built as a goodbye, not a report card: two quiet stat tiles, one warm line
 * from `threadSummary`, and the tags they happened to share. There is no score,
 * no "you should have said more", and no way to read the other person's side —
 * the summary is derived from YOUR copy of the thread and deliberately stops
 * short of implying either person got it wrong.
 */
export default function ThreadSummaryCard({
  summary,
  partnerAlias,
  onFindSomeoneNew,
  onSecondary,
  secondaryLabel,
}: Props) {
  const headingId = useId();
  const firstAlias = partnerAlias.trim().split(/\s+/)[0] || 'them';

  return (
    <section className="tsc" aria-labelledby={headingId}>
      <p className="tsc__kicker">that thread’s over</p>
      <h2 className="tsc__title" id={headingId}>
        you + {firstAlias}
      </h2>

      <div className="tsc__stats">
        <p className="tsc__stat">
          <span className="tsc__stat-value">{summary.durationLabel}</span>
          <span className="tsc__stat-label">together</span>
        </p>
        <p className="tsc__stat">
          <span className="tsc__stat-value">{summary.totalMessages}</span>
          <span className="tsc__stat-label">
            {summary.totalMessages === 1 ? 'message' : 'messages'}
          </span>
        </p>
      </div>

      <p className="tsc__split">
        {summary.myMessages} from you · {summary.theirMessages} from them
      </p>

      <p className="tsc__verdict">{summary.verdict}</p>

      {summary.sharedTags.length > 0 && (
        <ul className="tsc__tags" aria-label="Vibe tags you both had">
          {summary.sharedTags.map((tag) => (
            <li key={tag} className="tsc__tag">
              {vibeTagLabel(tag)}
            </li>
          ))}
        </ul>
      )}

      <div className="tsc__actions">
        <button type="button" className="tsc__primary" onClick={onFindSomeoneNew}>
          Find someone new
        </button>
        <button type="button" className="tsc__secondary" onClick={onSecondary}>
          {secondaryLabel}
        </button>
      </div>
    </section>
  );
}
