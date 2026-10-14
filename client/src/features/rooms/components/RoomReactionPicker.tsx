import { useEffect, useRef, type CSSProperties, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import useEscapeKey from '@/shared/hooks/useEscapeKey';
import { ROOM_REACTION_KEYS, reactionGlyph } from '../utils/reactions';
import type { RoomReactionKey } from '../types';

type Props = {
  triggerRef: RefObject<HTMLElement | null>;
  style: CSSProperties;
  /** Keys I already hold on this message. */
  selected: RoomReactionKey[];
  onPick: (key: RoomReactionKey) => void;
  onClose: () => void;
};

/**
 * The room's own reaction picker: only the six curated keys the server accepts,
 * in a portal under the trigger so no scroll container clips it. Escape and an
 * outside click close it; focus enters on open and returns to the trigger.
 */
const RoomReactionPicker = ({ triggerRef, style, selected, onPick, onClose }: Props) => {
  const rootRef = useRef<HTMLDivElement>(null);
  useEscapeKey(onClose);

  useEffect(() => {
    const trigger = triggerRef.current;
    rootRef.current?.querySelector<HTMLElement>('button')?.focus();
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || trigger?.contains(target)) return;
      onClose();
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      trigger?.focus({ preventScroll: true });
    };
  }, [onClose, triggerRef]);

  return createPortal(
    <div ref={rootRef} role="group" aria-label="Pick a reaction" style={style} className="rm-reactpicker">
      {ROOM_REACTION_KEYS.map((key) => {
        const on = selected.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onPick(key)}
            aria-label={key}
            aria-pressed={on}
            title={key}
            className={`rm-reactpicker__btn${on ? ' rm-reactpicker__btn--on' : ''}`}
          >
            {reactionGlyph(key)}
          </button>
        );
      })}
    </div>,
    document.body
  );
};

export default RoomReactionPicker;
