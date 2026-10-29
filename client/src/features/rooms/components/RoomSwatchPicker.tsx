import { useRef, type KeyboardEvent } from 'react';
import { ROOM_ALIAS_SWATCHES } from '../constants';

type Props = {
  value: string | undefined;
  onChange: (hex: string) => void;
  labelledBy: string;
};

/**
 * Persona color radiogroup with a roving tabindex: Tab enters on the chosen
 * swatch, arrows move AND select (wrapping), Home/End jump. Swatches are named
 * ("Mint", "Rose") for screen readers rather than hex codes.
 */
const RoomSwatchPicker = ({ value, onChange, labelledBy }: Props) => {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const count = ROOM_ALIAS_SWATCHES.length;
  const selectedIndex = Math.max(0, ROOM_ALIAS_SWATCHES.findIndex((s) => s.hex === value));

  const move = (to: number) => {
    const next = (to + count) % count;
    onChange(ROOM_ALIAS_SWATCHES[next].hex);
    refs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const step: Record<string, () => void> = {
      ArrowRight: () => move(index + 1),
      ArrowDown: () => move(index + 1),
      ArrowLeft: () => move(index - 1),
      ArrowUp: () => move(index - 1),
      Home: () => move(0),
      End: () => move(count - 1),
    };
    const action = step[e.key];
    if (!action) return;
    e.preventDefault();
    action();
  };

  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="rm-swatches">
      {ROOM_ALIAS_SWATCHES.map(({ hex, name }, index) => {
        const selected = value === hex;
        return (
          <button
            key={hex}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={name}
            tabIndex={index === selectedIndex ? 0 : -1}
            onClick={() => onChange(hex)}
            onKeyDown={(e) => onKeyDown(e, index)}
            style={{ backgroundColor: hex, color: hex }}
            className={`rm-swatch${selected ? ' rm-swatch--on' : ''}`}
          >
            {selected && (
              <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default RoomSwatchPicker;
