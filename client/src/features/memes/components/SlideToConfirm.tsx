import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

type Props = {
  label: string;
  /** Shown instead of the label while `disabled`. */
  disabledLabel: string;
  disabled?: boolean;
  busy?: boolean;
  onConfirm: () => void;
};

const THUMB = 44; // px, matches h-11 w-11
const PAD = 4;
const DONE_AT = 0.88;

/**
 * A drag-to-confirm track: a stray tap can't trigger it. Pointer users slide the
 * thumb most of the way; keyboard users focus the thumb and press Enter or Space.
 */
const SlideToConfirm = ({ label, disabledLabel, disabled = false, busy = false, onConfirm }: Props) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [limit, setLimit] = useState(0);

  // Read the track width in handlers only (never during render).
  const max = () => (trackRef.current?.clientWidth ?? 0) - THUMB - PAD * 2;
  const locked = disabled || busy;

  const down = (e: PointerEvent<HTMLButtonElement>) => {
    if (locked) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startX.current = e.clientX - dx;
    setLimit(max());
    setDragging(true);
  };
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    if (startX.current === null) return;
    setDx(Math.min(Math.max(0, e.clientX - startX.current), max()));
  };
  const up = () => {
    if (startX.current === null) return;
    startX.current = null;
    setDragging(false);
    if (dx >= max() * DONE_AT) {
      setDx(max());
      onConfirm();
    } else {
      setDx(0);
    }
  };
  const key = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (locked || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    onConfirm();
  };

  const progress = limit > 0 ? dx / limit : 0;

  return (
    <div
      ref={trackRef}
      className={`relative h-[52px] select-none overflow-hidden rounded-full border transition-colors ${
        locked ? 'border-white/8 bg-white/[0.03]' : 'border-red/30 bg-red/[0.08]'
      }`}
    >
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 bg-red/30"
        style={{ width: dx + THUMB + PAD * 2, transition: dragging ? 'none' : 'width 0.25s ease' }}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 grid place-items-center pl-8 text-sm font-semibold ${
          locked ? 'text-body-300/60' : 'text-white'
        }`}
        style={{ opacity: 1 - progress * 1.4 }}
      >
        {busy ? 'Sending…' : locked ? disabledLabel : `${label}  ›››`}
      </span>
      <button
        type="button"
        aria-label={label}
        disabled={locked}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
        className={`absolute top-1 grid h-11 w-11 touch-none place-items-center rounded-full text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
          locked ? 'cursor-not-allowed bg-white/10 text-body-300/60' : 'cursor-grab bg-red active:cursor-grabbing'
        }`}
        style={{ left: PAD + dx, transition: dragging ? 'none' : 'left 0.25s ease' }}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 21V4" />
          <path d="M5 4h11l-2 4 2 4H5" />
        </svg>
      </button>
    </div>
  );
};

export default SlideToConfirm;
