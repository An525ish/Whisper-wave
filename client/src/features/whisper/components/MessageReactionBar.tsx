import { useEffect, useRef, useState } from 'react';
import {
  ANON_REACTIONS,
  ANON_REACTION_LABELS,
  type AnonReaction,
} from '@/shared/constants/anonEvents';
import './messageReactions.css';

type Props = {
  /** Reactions already on the bubble, split by side. */
  reactions?: { me?: AnonReaction; them?: AnonReaction };
  /** Hidden entirely until the message has actually landed. */
  enabled: boolean;
  onReact: (reaction: AnonReaction) => void;
};

const glyph = (r: AnonReaction) => ANON_REACTION_LABELS[r]?.glyph ?? '•';

/**
 * Reactions on a single message.
 *
 * One per person, and the same reaction twice removes it — that is the server's
 * rule and the store mirrors it, so a tap here and the broadcast coming back
 * agree instead of fighting.
 *
 * Opens on click, closes on Escape / outside click / selection, and the trigger
 * is a real button so it is reachable by keyboard. The picker is positioned rather
 * than centred because bubbles hug the pane edges and a centred popover would
 * detach from the thing it acts on.
 */
export default function MessageReactionBar({ reactions, enabled, onReact }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  // Don't leave a popover stranded when the bubble stops being reactable (the
  // thread ended, or the message failed). Adjusted during render rather than in an
  // effect — React's documented pattern, and an effect here would cascade.
  const [wasEnabled, setWasEnabled] = useState(enabled);
  if (wasEnabled !== enabled) {
    setWasEnabled(enabled);
    if (!enabled) setOpen(false);
  }

  if (!enabled) return null;

  const mine = reactions?.me;
  const theirs = reactions?.them;

  return (
    <span className="mrb" ref={wrapRef}>
      {theirs && (
        <span className="mrb__chip" title="They reacted">
          {glyph(theirs)}
        </span>
      )}
      {mine && (
        <button
          type="button"
          className="mrb__chip mrb__chip--mine"
          onClick={() => onReact(mine)}
          aria-label={`Remove your ${ANON_REACTION_LABELS[mine]?.label ?? 'reaction'}`}
        >
          {glyph(mine)}
        </button>
      )}

      <button
        type="button"
        className="mrb__add"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Add a reaction"
        title="React"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="9" opacity="0.5" />
          <path d="M8.5 14.5s1.2 1.5 3.5 1.5 3.5-1.5 3.5-1.5" />
          <path d="M9 9.5h.01M15 9.5h.01" />
        </svg>
      </button>

      {open && (
        <span className="mrb__menu" role="group" aria-label="Pick a reaction">
          {ANON_REACTIONS.map((r) => (
            <button
              key={r}
              type="button"
              className={`mrb__opt${mine === r ? ' mrb__opt--on' : ''}`}
              onClick={() => {
                onReact(r);
                setOpen(false);
              }}
              aria-pressed={mine === r}
              aria-label={ANON_REACTION_LABELS[r]?.label ?? r}
              title={ANON_REACTION_LABELS[r]?.label ?? r}
            >
              <span aria-hidden>{glyph(r)}</span>
            </button>
          ))}
        </span>
      )}
    </span>
  );
}