import { useState, useRef, useMemo, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { EmojiClickData } from 'emoji-picker-react';
import StyledEmojiPicker, {
  emojiPickerShellClass,
} from '@/shared/components/ui/emoji/StyledEmojiPicker';
import type { MessageReaction } from '../../types/chat';
import ReactionAddIcon from '@/shared/components/ui/icons/ReactionAdd';

const DEFAULT_EMOJIS = ['❤️', '👍', '😂', '😮', '😢'];
const RECENT_EMOJIS_KEY = 'ww_recent_emojis';
const MAX_RECENT = 6;

const PICKER_WIDTH = 312;
const PICKER_HEIGHT = 380;
const EDGE = 8;
const GAP = 6;

/**
 * Where the full emoji grid goes, as `position: fixed` coordinates: under the strip if
 * it fits, else above it, else centred in the viewport. Always clamped on screen, so
 * a message at the bottom of the list can never push the picker out of view.
 */
const placePicker = (anchor: DOMRect): { style: CSSProperties; width: number; height: number } => {
  const width = Math.min(PICKER_WIDTH, window.innerWidth - EDGE * 2);
  const height = Math.min(PICKER_HEIGHT, window.innerHeight - EDGE * 2);
  const left = Math.min(Math.max(EDGE, anchor.left + anchor.width / 2 - width / 2), window.innerWidth - width - EDGE);
  const spaceBelow = window.innerHeight - anchor.bottom - EDGE;
  const spaceAbove = anchor.top - EDGE;
  const top =
    spaceBelow >= height + GAP
      ? anchor.bottom + GAP
      : spaceAbove >= height + GAP
        ? anchor.top - height - GAP
        : Math.max(EDGE, (window.innerHeight - height) / 2);
  return { style: { position: 'fixed', top, left, width, height, zIndex: 10000 }, width, height };
};

/** Height of the quick-reaction strip. */
const STRIP_HEIGHT = 48;

/**
 * Fixed spot for the quick strip beside a trigger: above it if it fits, else below.
 * Never off screen. Shared by every surface that opens the strip from a smiley.
 */
export const placeReactionStrip = (anchor: DOMRect, align: 'start' | 'end'): CSSProperties => {
  const fitsAbove = anchor.top - GAP - STRIP_HEIGHT >= EDGE;
  const vertical = fitsAbove
    ? { bottom: window.innerHeight - anchor.top + GAP }
    : { top: Math.min(anchor.bottom + GAP, window.innerHeight - STRIP_HEIGHT - EDGE) };
  const horizontal =
    align === 'end'
      ? { right: Math.max(EDGE, window.innerWidth - anchor.right) }
      : { left: Math.max(EDGE, anchor.left) };
  return { position: 'fixed', zIndex: 9999, maxWidth: `calc(100vw - ${EDGE * 2}px)`, ...vertical, ...horizontal };
};

export const getRecentEmojis = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_EMOJIS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
};

export const saveRecentEmoji = (emoji: string): void => {
  try {
    const current = getRecentEmojis().filter((e) => e !== emoji);
    localStorage.setItem(
      RECENT_EMOJIS_KEY,
      JSON.stringify([emoji, ...current].slice(0, MAX_RECENT)),
    );
  } catch {
    // localStorage may be unavailable — silently ignore
  }
};

/** Chip / pill surface — matches reaction picker shell (`bg-primary`). */
export const REACTION_SURFACE_CLASS =
  'rounded-full border border-border bg-primary shadow-[0_2px_8px_rgba(0,0,0,0.28)]';

const emojiBtnClass = (reacted: boolean) =>
  `grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors duration-150 hover:bg-white/10 active:scale-95 ${
    reacted ? 'bg-white/15' : ''
  }`;

const EmojiGlyph = ({ emoji }: { emoji: string }) => (
  <span className="pointer-events-none block translate-y-px text-[1.2rem] leading-none select-none">
    {emoji}
  </span>
);

type Props = {
  reactions?: MessageReaction[];
  myUserId: string;
  onReact: (emoji: string) => void;
  onClose: () => void;
  /** Fired when the expanded emoji picker opens/closes (e.g. hide context options). */
  onPickerOpenChange?: (open: boolean) => void;
};

const ReactionStrip = ({ reactions, myUserId, onReact, onClose, onPickerOpenChange }: Props) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<ReturnType<typeof placePicker> | null>(null);

  const myReactions = useMemo(
    () => new Set((reactions ?? []).filter((r) => r.users.includes(myUserId)).map((r) => r.emoji)),
    [reactions, myUserId],
  );

  const handleReact = (emoji: string) => {
    saveRecentEmoji(emoji);
    onReact(emoji);
    onClose();
  };

  const handlePickerSelect = (e: EmojiClickData) => {
    setPickerOpen(false);
    onPickerOpenChange?.(false);
    handleReact(e.emoji);
  };

  const togglePicker = () => {
    if (stripRef.current) setPlacement(placePicker(stripRef.current.getBoundingClientRect()));
    setPickerOpen((open) => {
      const next = !open;
      onPickerOpenChange?.(next);
      return next;
    });
  };

  return (
    <div
      className="flex flex-col items-center"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        ref={stripRef}
        className={`flex items-center gap-0.5 px-1 py-0.5 ${REACTION_SURFACE_CLASS}`}
      >
        {DEFAULT_EMOJIS.map((emoji) => {
          const reacted = myReactions.has(emoji);
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => handleReact(emoji)}
              className={emojiBtnClass(reacted)}
              aria-label={`React with ${emoji}`}
            >
              <EmojiGlyph emoji={emoji} />
            </button>
          );
        })}

        <span className="mx-px h-4 w-px shrink-0 bg-white/15" aria-hidden />

        <button
          ref={moreBtnRef}
          type="button"
          onClick={togglePicker}
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-body-300 transition-colors hover:bg-white/10 hover:text-body ${
            pickerOpen ? 'bg-white/10 text-body' : ''
          }`}
          aria-label="More emojis"
          aria-expanded={pickerOpen}
        >
          <ReactionAddIcon className="h-5 w-5" />
        </button>
      </div>

      {pickerOpen && placement
        ? createPortal(
            // Portalled and fixed so no ancestor can clip it. `data-context-menu` keeps the
            // message context menu from treating a tap in here as an outside click.
            <div
              data-context-menu
              data-reaction-picker
              className={`motion-safe:animate-[reaction-picker-in_0.22s_cubic-bezier(0.22,1,0.36,1)_both] ${emojiPickerShellClass}`}
              style={placement.style}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="min-h-0 flex-1 overflow-hidden">
                <StyledEmojiPicker
                  width={placement.width}
                  height={placement.height}
                  onEmojiClick={handlePickerSelect}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};

export default ReactionStrip;
