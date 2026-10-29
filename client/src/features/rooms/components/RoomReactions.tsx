import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import ReactionAddIcon from '@/shared/components/ui/icons/ReactionAdd';
import { REACTION_SURFACE_CLASS, ReactionStrip, placeReactionStrip } from '@/features/chat';
import { usedReactions } from '../utils/reactions';
import type { RoomMessage, RoomReactionKey } from '../types';

type Props = {
  message: RoomMessage;
  /** The viewer's own bubble: chips and strip anchor to the right edge. */
  mine: boolean;
  /** An avatar sits before the bubble: line up with the bubble, not the avatar. */
  hasAvatar?: boolean;
  /** Emoji the viewer holds on this message. */
  myKeys: RoomReactionKey[];
  onReact: (messageId: string, reaction: RoomReactionKey) => void;
};

/**
 * Reactions on one room message, laid out like anonymous chat and the main chat:
 * chips hang off the bubble's bottom edge, a smiley shows on hover when there are
 * none, and it opens the SAME `ReactionStrip` (quick emojis plus "more emojis").
 * Once a message has reactions the smiley goes away, like the main chat: tap a chip to
 * toggle it, or open the message menu (right-click / long-press) for the full strip.
 * Rooms differ in one way: reactions are shared counts, and a person can hold several.
 * The bubble row carries the `group` class that drives the hover.
 */
const RoomReactions = ({ message, mine, hasAvatar = false, myKeys, onReact }: Props) => {
  const [open, setOpen] = useState(false);
  const [stripStyle, setStripStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const stripWrapRef = useRef<HTMLDivElement>(null);
  const used = usedReactions(message);
  const align = mine ? 'end' : 'start';

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

  const chip = `flex h-[22px] items-center justify-center gap-1 px-1.5 text-[15px] leading-none ${REACTION_SURFACE_CLASS}`;
  const hasReactions = used.length > 0;
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
        className={`flex h-[22px] w-[22px] items-center justify-center text-body-300 transition-all duration-150 hover:text-body ${REACTION_SURFACE_CLASS} ${open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}`}
      >
        <ReactionAddIcon className="h-5 w-5" />
      </button>
      {open &&
        createPortal(
          <div ref={stripWrapRef} style={stripStyle}>
            <ReactionStrip
              reactions={myKeys.map((emoji) => ({ emoji, users: ['me'] }))}
              myUserId="me"
              onReact={(emoji) => onReact(message.id, emoji)}
              onClose={() => setOpen(false)}
            />
          </div>,
          document.body,
        )}
    </>
  );

  if (!hasReactions) {
    return <div className={`absolute -bottom-4.5 z-10 ${mine ? 'right-2' : hasAvatar ? 'left-[2.75rem]' : 'left-2'}`}>{addButton}</div>;
  }

  return (
    <div
      className={`z-10 -mt-1 flex flex-wrap items-center gap-1 ${mine ? 'mr-2 self-end justify-end' : hasAvatar ? 'ml-[2.75rem] self-start justify-start' : 'ml-2 self-start justify-start'}`}
      role="group"
      aria-label="Reactions"
    >
      {used.map(({ key, count }) => {
        const on = myKeys.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onReact(message.id, key)}
            aria-pressed={on}
            aria-label={`${key}, ${count}`}
            className={`${chip} transition-all duration-150 active:scale-95 ${on ? 'text-body ring-1 ring-green/35' : 'text-body-700'}`}
          >
            {key}
            {count > 1 && <span className="text-[10px] font-medium tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default RoomReactions;
