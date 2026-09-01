import { useRef, useState, type TouchEvent, type ReactNode } from 'react';
import ReplyIcon from '@/components/ui/icons/Reply';

type Props = {
  onReply: () => void;
  /** 'end' for own messages (right-aligned), 'start' for others (left-aligned) */
  side: 'start' | 'end';
  disabled?: boolean;
  children: ReactNode;
};

const TRIGGER_THRESHOLD = 64; // px of horizontal travel to fire reply
const MAX_DRAG = 80;          // px — hard cap so the bubble doesn't fly off screen
const DIRECTION: Record<Props['side'], 1 | -1> = { start: 1, end: -1 };

/**
 * Wraps a message bubble with swipe-to-reply on mobile.
 * — Horizontal swipe reveals a reply icon behind the bubble.
 * — Past TRIGGER_THRESHOLD the callback fires and the bubble snaps back.
 * — Vertical or very short swipes are ignored so normal scroll is unaffected.
 * — On desktop this is a no-op (no touch events).
 */
const SwipeToReply = ({ onReply, side, disabled = false, children }: Props) => {
  const [tx, setTx] = useState(0);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);
  const directionSign = DIRECTION[side]; // +1 swipe right (incoming), -1 swipe left (outgoing)

  const onTouchStart = (e: TouchEvent) => {
    if (disabled) return;
    const t = e.touches[0];
    startRef.current = { x: t.clientX, y: t.clientY };
    firedRef.current = false;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (disabled || !startRef.current) return;
    const t = e.touches[0];
    const dx = (t.clientX - startRef.current.x) * directionSign;
    const dy = Math.abs(t.clientY - startRef.current.y);

    // If vertical motion dominates early, bail out — let the list scroll
    if (dy > 10 && dy > Math.abs(dx)) {
      startRef.current = null;
      setTx(0);
      return;
    }

    if (dx < 0) return; // wrong direction
    const clamped = Math.min(dx, MAX_DRAG);
    setTx(clamped * directionSign);

    if (dx >= TRIGGER_THRESHOLD && !firedRef.current) {
      firedRef.current = true;
      onReply();
    }
  };

  const onTouchEnd = () => {
    startRef.current = null;
    setTx(0);
  };

  const progress = Math.min(Math.abs(tx) / TRIGGER_THRESHOLD, 1);
  const iconOpacity = Math.max(0, progress * 1.5 - 0.2); // fade in after 20% travel
  const iconScale = 0.7 + progress * 0.3;

  return (
    <div
      className="relative w-fit min-w-0 max-w-full overflow-hidden select-none [-webkit-touch-callout:none] touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {/* Reply icon — inset within the row so it doesn't widen the scroll area */}
      <div
        className={`pointer-events-none absolute inset-y-0 ${
          side === 'start' ? 'left-0' : 'right-0'
        } flex w-8 items-center justify-center`}
        style={{
          opacity: iconOpacity,
          transform: `scale(${iconScale})`,
          transition: tx === 0 ? 'opacity 0.15s, transform 0.15s' : 'none',
        }}
        aria-hidden
      >
        <ReplyIcon className="h-5 w-5 text-body-300" />
      </div>

      {/* The bubble itself */}
      <div
        style={{
          transform: `translateX(${tx}px)`,
          transition: tx === 0 ? 'transform 0.2s cubic-bezier(0.25,1,0.5,1)' : 'none',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeToReply;
