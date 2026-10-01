import CloseIcon from '@/shared/components/ui/icons/Close';
import type { Icebreaker } from '../utils/icebreakers';
import './icebreakers.css';

type Props = {
  /** The starters to show — feed it `pickIcebreaker(...)` or a fixed slice. */
  prompts: readonly Icebreaker[];
  /** Swap in different starters. The caller owns the seen-ids list and seed. */
  onShuffle: () => void;
  /** Hide the card for this thread. Never permanent; the header can bring it back. */
  onDismiss: () => void;
};

/**
 * Conversation starters for a live anon thread.
 *
 * Small on purpose: it sits above the composer in a narrow column, and the
 * moment it competes with the conversation for attention it stops working. Two
 * or three prompts, one line each, and a way out of both.
 *
 * Read-only by design — a tappable prompt would imply "send this for me", and
 * sending a stranger something you didn't write is the opposite of the product.
 * The prompts are there to be read, then typed in your own words.
 */
export default function Icebreakers({ prompts, onShuffle, onDismiss }: Props) {
  // Nothing to say once the caller has exhausted the pool — render nothing
  // rather than an empty shell with two buttons in it.
  if (prompts.length === 0) return null;

  // Remounting the list on a new prompt set is what replays the entry
  // animation, so a shuffle reads as new content rather than a repaint.
  const promptKey = prompts.map((prompt) => prompt.id).join('|');

  return (
    <aside className="ice" aria-label="Conversation starters">
      <div className="ice__bar">
        <p className="ice__kicker">need a spark?</p>

        <div className="ice__tools">
          <button
            type="button"
            className="ice__tool"
            onClick={onShuffle}
            aria-label="Show different conversation starters"
            title="Different starters"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M16 3h5v5" />
              <path d="M4 20L21 3" />
              <path d="M21 16v5h-5" />
              <path d="M15 15l6 6" />
              <path d="M4 4l5 5" />
            </svg>
          </button>

          <button
            type="button"
            className="ice__tool"
            onClick={onDismiss}
            aria-label="Hide conversation starters"
            title="Hide"
          >
            <CloseIcon className="ice__icon" width="14" height="14" aria-hidden />
          </button>
        </div>
      </div>

      <ul key={promptKey} className="ice__list">
        {prompts.map((prompt) => (
          <li key={prompt.id} className="ice__item">
            {prompt.text}
          </li>
        ))}
      </ul>
    </aside>
  );
}
