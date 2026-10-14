import { useCallback, useRef, useState, type CSSProperties } from 'react';
import ReactionAddIcon from '@/shared/components/ui/icons/ReactionAdd';
import { reactionGlyph, usedReactions } from '../utils/reactions';
import type { RoomMessage, RoomReactionKey } from '../types';
import RoomReactionPicker from './RoomReactionPicker';
import './roomReactions.css';

type Props = {
  message: RoomMessage;
  /** The viewer's own bubble — pills align to the right. */
  mine: boolean;
  /** Reaction keys the viewer holds on this message. */
  myKeys: RoomReactionKey[];
  onReact: (messageId: string, reaction: RoomReactionKey) => void;
};

const PICKER_GAP_PX = 6;
const VIEWPORT_PAD_PX = 8;

/**
 * Reaction pills (pressed = mine) plus an always-present add button that opens
 * the curated picker. With no reactions yet the button hangs off the bubble
 * corner; with some, it trails the pills.
 */
const RoomReactions = ({ message, mine, myKeys, onReact }: Props) => {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const used = usedReactions(message);
  const close = useCallback(() => setOpen(false), []);

  const toggle = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setStyle({
        position: 'fixed',
        zIndex: 9999,
        top: rect.bottom + PICKER_GAP_PX,
        right: Math.max(VIEWPORT_PAD_PX, window.innerWidth - rect.right),
      });
    }
    setOpen((v) => !v);
  };

  const addButton = (
    <button
      ref={triggerRef}
      type="button"
      onClick={toggle}
      aria-label="Add reaction"
      aria-haspopup="true"
      aria-expanded={open}
      className="rm-reactadd"
    >
      <ReactionAddIcon className="h-5 w-5" />
    </button>
  );

  return (
    <>
      {used.length > 0 ? (
        <div className={`rm-reacts ${mine ? 'self-end mr-2 justify-end' : 'self-start ml-2 justify-start'}`} role="group" aria-label="Reactions">
          {used.map(({ key, count }) => {
            const on = myKeys.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onReact(message.id, key)}
                aria-label={`${key}, ${count}`}
                aria-pressed={on}
                title={`${key} · ${count}`}
                className={`rm-react${on ? ' rm-react--on' : ''}`}
              >
                <span aria-hidden className="rm-react__glyph">{reactionGlyph(key)}</span>
                <span className="rm-react__count">{count}</span>
              </button>
            );
          })}
          {addButton}
        </div>
      ) : (
        <div className="rm-reactaddwrap">{addButton}</div>
      )}
      {open && (
        <RoomReactionPicker
          triggerRef={triggerRef}
          style={style}
          selected={myKeys}
          onPick={(key) => {
            onReact(message.id, key);
            close();
          }}
          onClose={close}
        />
      )}
    </>
  );
};

export default RoomReactions;
