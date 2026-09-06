import { useState, useRef, useMemo } from 'react';
import type { EmojiClickData } from 'emoji-picker-react';
import StyledEmojiPicker, {
  emojiPickerShellClass,
} from '@/components/chat/conversation/composer/StyledEmojiPicker';
import type { MessageReaction } from '@/types/chat';
import ReactionAddIcon from '@/components/chat/message/ReactionAddIcon';

const DEFAULT_EMOJIS = ['❤️', '👍', '😂', '😮', '😢'];
const RECENT_EMOJIS_KEY = 'ww_recent_emojis';
const MAX_RECENT = 6;

const PICKER_WIDTH = 312;
const PICKER_HEIGHT = 380;

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
  <span className="pointer-events-none block translate-y-px text-[1.45rem] leading-none select-none">
    {emoji}
  </span>
);

type ReactionStripProps = {
  reactions?: MessageReaction[];
  myUserId: string;
  onReact: (emoji: string) => void;
  onClose: () => void;
  /** Fired when the expanded emoji picker opens/closes (e.g. hide context options). */
  onPickerOpenChange?: (open: boolean) => void;
};

const ReactionStrip = ({ reactions, myUserId, onReact, onClose, onPickerOpenChange }: ReactionStripProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const moreBtnRef = useRef<HTMLButtonElement>(null);

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
          <ReactionAddIcon className="h-6 w-6" />
        </button>
      </div>

      {pickerOpen ? (
        <div
          className={`mt-1.5 origin-top-right motion-safe:animate-[reaction-picker-in_0.22s_cubic-bezier(0.22,1,0.36,1)_both] ${emojiPickerShellClass}`}
          style={{ width: PICKER_WIDTH, height: PICKER_HEIGHT }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="min-h-0 flex-1 overflow-hidden">
            <StyledEmojiPicker
              width={PICKER_WIDTH}
              height={PICKER_HEIGHT}
              onEmojiClick={handlePickerSelect}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ReactionStrip;
