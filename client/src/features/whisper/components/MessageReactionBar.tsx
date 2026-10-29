import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import ReactionAddIcon from '@/shared/components/ui/icons/ReactionAdd';
import { REACTION_SURFACE_CLASS, ReactionStrip, placeReactionStrip } from '@/features/chat';
import type { AnonReaction } from '../types';

type Props = {
  /** Reactions already on the bubble, split by side. */
  reactions?: { me?: AnonReaction; them?: AnonReaction };
  /** Hidden entirely until the message has actually landed. */
  enabled: boolean;
  onReact: (reaction: AnonReaction) => void;
  /** Which side the bubble sits on: chips and picker anchor to that edge. */
  align: 'start' | 'end';
};

/**
 * Reactions on a single message, laid out and picked exactly like the main chat:
 * chips hang off the bubble's bottom edge, a smiley appears on hover when there are
 * none, and it opens the SAME `ReactionStrip` (quick emojis plus "more emojis").
 *
 * One reaction per person, and sending the same one again removes it. That is the
 * server's rule and the store mirrors it, so a tap here and the broadcast coming back
 * agree instead of fighting.
 */
export default function MessageReactionBar({ reactions, enabled, onReact, align }: Props) {
  const [open, setOpen] = useState(false);
  const [stripStyle, setStripStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const stripWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || stripWrapRef.current?.contains(target)) return;
      // The full emoji grid is its own portal; a tap in it is not an outside click.
      if (target instanceof Element && target.closest('[data-reaction-picker]')) return;
      setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  // Don't leave a popover stranded when the bubble stops being reactable (the thread
  // ended, or the message failed). Adjusted during render, not in an effect.
  const [wasEnabled, setWasEnabled] = useState(enabled);
  if (wasEnabled !== enabled) {
    setWasEnabled(enabled);
    if (!enabled) setOpen(false);
  }

  if (!enabled) return null;

  const mine = reactions?.me;
  const theirs = reactions?.them;
  const hasReactions = Boolean(mine || theirs);

  // The strip speaks the main chat's shape: `{ emoji, users }`, with 'me' as my id.
  const stripReactions = [
    ...(mine ? [{ emoji: mine, users: ['me'] }] : []),
    ...(theirs && theirs !== mine ? [{ emoji: theirs, users: ['them'] }] : []),
  ];

  const chip = `flex h-[22px] items-center justify-center px-1.5 text-[15px] leading-none ${REACTION_SURFACE_CLASS}`;
  const addButton = (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          setStripStyle(placeReactionStrip(e.currentTarget.getBoundingClientRect(), align));
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Add a reaction"
        className={`flex h-[22px] w-[22px] items-center justify-center text-body-300 transition-all duration-150 hover:text-body ${REACTION_SURFACE_CLASS} ${open ? 'opacity-100' : hasReactions ? '' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}`}
      >
        <ReactionAddIcon className="h-5 w-5" />
      </button>
      {open &&
        createPortal(
          <div ref={stripWrapRef} style={stripStyle}>
            <ReactionStrip
              reactions={stripReactions}
              myUserId="me"
              onReact={onReact}
              onClose={() => setOpen(false)}
            />
          </div>,
          document.body,
        )}
    </>
  );

  if (!hasReactions) {
    return <div className={`absolute bottom-0 z-10 ${align === 'end' ? 'right-2' : 'left-2'}`}>{addButton}</div>;
  }

  return (
    <div className={`z-10 -mt-1 flex flex-wrap items-center gap-1 ${align === 'end' ? 'mr-2 self-end justify-end' : 'ml-2 self-start justify-start'}`}>
      {theirs && (
        <span className={`${chip} text-body-700`} title="They reacted">
          {theirs}
        </span>
      )}
      {mine && (
        <button
          type="button"
          className={`${chip} text-body ring-1 ring-green/35 transition-all duration-150 active:scale-95`}
          onClick={() => onReact(mine)}
          aria-label={`Remove your ${mine} reaction`}
        >
          {mine}
        </button>
      )}
      {!mine && addButton}
    </div>
  );
}
