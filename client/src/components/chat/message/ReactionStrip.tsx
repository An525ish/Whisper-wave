import { useState, useRef, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import EmojiPicker, { Theme, EmojiStyle, type EmojiClickData } from 'emoji-picker-react';
import type { MessageReaction } from '@/types/chat';
import ReactionAddIcon from '@/components/chat/message/ReactionAddIcon';

const DEFAULT_EMOJIS = ['❤️', '👍', '😂', '😮'];
const RECENT_EMOJIS_KEY = 'ww_recent_emojis';
const MAX_RECENT = 6;

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

type ReactionStripProps = {
  reactions?: MessageReaction[];
  myUserId: string;
  onReact: (emoji: string) => void;
  onClose: () => void;
};

const ReactionStrip = ({ reactions, myUserId, onReact, onClose }: ReactionStripProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerStyle, setPickerStyle] = useState<CSSProperties>({});
  const moreBtnRef = useRef<HTMLButtonElement>(null);

  // 5 defaults + up to 5 recently used that aren't already in defaults
  const recent = getRecentEmojis();
  const recentExtra = recent.filter((e) => !DEFAULT_EMOJIS.includes(e)).slice(0, 5);
  const quickEmojis = [...DEFAULT_EMOJIS, ...recentExtra];

  const myReactions = new Set(
    (reactions ?? [])
      .filter((r) => r.users.includes(myUserId))
      .map((r) => r.emoji),
  );

  const handleReact = (emoji: string) => {
    saveRecentEmoji(emoji);
    onReact(emoji);
    onClose();
  };

  const handlePickerSelect = (e: EmojiClickData) => {
    handleReact(e.emoji);
    setPickerOpen(false);
  };

  const openFullPicker = () => {
    if (moreBtnRef.current) {
      const rect = moreBtnRef.current.getBoundingClientRect();
      const pickerHeight = 340;
      const gap = 8;
      const style: CSSProperties = {
        position: 'fixed',
        zIndex: 10000,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 308)),
      };

      if (rect.top >= pickerHeight + gap) {
        style.bottom = window.innerHeight - rect.top + gap;
      } else {
        style.top = rect.bottom + gap;
      }

      setPickerStyle(style);
    }
    setPickerOpen((p) => !p);
  };

  return (
    // Thin horizontally-scrollable strip; no visible scrollbar
    <div className="flex items-center gap-0.5 px-1.5 py-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {quickEmojis.map((emoji) => {
        const reacted = myReactions.has(emoji);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => handleReact(emoji)}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-base leading-none transition-all duration-150 active:scale-90 hover:bg-white/8 ${reacted ? 'bg-white/8' : ''}`}
            aria-label={`React with ${emoji}`}
          >
            {emoji}
          </button>
        );
      })}

      <span className="mx-0.5 h-3.5 w-px shrink-0 bg-white/15" aria-hidden />

      {/* More emojis — opens EmojiPicker via portal to avoid clipping */}
      <button
        ref={moreBtnRef}
        type="button"
        onClick={openFullPicker}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-body-300 transition hover:bg-white/8 hover:text-body"
        aria-label="More emojis"
      >
        <ReactionAddIcon className="h-6 w-6" />
      </button>

      {pickerOpen &&
        createPortal(
          <div style={pickerStyle} onMouseDown={(e) => e.stopPropagation()}>
            <div className="rounded-[10px] shadow-2xl overflow-hidden">
              <EmojiPicker
                autoFocusSearch={false}
                theme={Theme.DARK}
                width={300}
                height={340}
                onEmojiClick={handlePickerSelect}
                previewConfig={{ showPreview: false }}
                emojiStyle={EmojiStyle.FACEBOOK}
                lazyLoadEmojis
                style={{
                  '--epr-bg-color': 'rgba(33, 26, 42, 1)',
                  '--epr-category-label-bg-color': 'rgba(33, 26, 42, 1)',
                  '--epr-text-color': '#FFFFFF',
                  '--epr-hover-bg-color': 'rgba(255, 255, 255, 0.1)',
                  '--epr-focus-bg-color': 'rgba(255, 255, 255, 0.2)',
                  '--epr-highlight-color': 'rgba(255, 255, 255, 0.2)',
                  '--epr-search-bg-color': 'rgba(35, 29, 44, 1)',
                  '--epr-font-family': "'DM Sans', sans-serif",
                  '--epr-scrollbar-width': '4px',
                  '--epr-scrollbar-thumb-color': '#EBECEC4D',
                } as CSSProperties}
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ReactionStrip;
