import { useState } from 'react';
import type { Spark } from '../types';
import './anonSparks.css';

type Props = {
  sparks: Spark[];
  /** True while the thread is young — the heading says "break the ice". */
  fresh: boolean;
  disabled: boolean;
  onPick: (text: string) => void;
};

const PAGE_SIZE = 3;

/**
 * Openers you can drop into the composer in one tap.
 *
 * Shows three at a time and pages through the rest, so the panel is a prompt
 * rather than a list to read. Picking one fills the composer and focuses it —
 * it never sends, so the words still go out as the user's own.
 */
export default function SparkDeck({ sparks, fresh, disabled, onPick }: Props) {
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(sparks.length / PAGE_SIZE));
  const start = (page % pageCount) * PAGE_SIZE;
  const visible = sparks.slice(start, start + PAGE_SIZE);

  return (
    <>
      <div className="apn-sparks__head">
        <div>
          <p className="acp__label">Sparks</p>
          <p className="apn-sparks__sub">{fresh ? 'Break the ice' : 'Keep it going'}</p>
        </div>
        {pageCount > 1 && (
          <button
            type="button"
            className="apn-sparks__more"
            onClick={() => setPage((p) => (p + 1) % pageCount)}
            aria-label="Show different openers"
            title="Show different openers"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 12a9 9 0 0 1-15.5 6.2" />
              <path d="M3 12A9 9 0 0 1 18.5 5.8" />
              <path d="M18 2v4h-4" />
              <path d="M6 22v-4h4" />
            </svg>
          </button>
        )}
      </div>

      <ul className="apn-sparks">
        {visible.map((spark) => (
          <li key={spark.key}>
            <button
              type="button"
              className="apn-spark"
              disabled={disabled}
              onClick={() => onPick(spark.text)}
              aria-label={`Use this opener: ${spark.text}`}
            >
              <span className="apn-spark__emoji" aria-hidden>{spark.emoji}</span>
              <span className="apn-spark__text">{spark.text}</span>
              <svg className="apn-spark__go" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
