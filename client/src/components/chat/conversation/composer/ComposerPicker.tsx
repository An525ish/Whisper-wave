import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import EmojiPicker, {
  Theme,
  EmojiStyle,
  type EmojiClickData,
} from 'emoji-picker-react';
import GifPicker from './gif-picker/GifPicker';
import type { GifItem } from '@/api/gif';
import EmojiIcon from '@/components/ui/icons/Emoji';

type Tab = 'emoji' | 'gif' | 'meme';

type ComposerPickerProps = {
  /** Ref to the button that opens this picker — excluded from click-outside */
  triggerRef: RefObject<HTMLElement | null>;
  setMessage: Dispatch<SetStateAction<string>>;
  onClose: () => void;
  onGifSelect: (gif: GifItem) => void;
};

const emojiPickerStyles: CSSProperties = {
  '--epr-bg-color': 'transparent',
  '--epr-category-label-bg-color': 'rgba(33, 26, 42, 1)',
  '--epr-text-color': '#FFFFFF',
  '--epr-hover-bg-color': 'rgba(255, 255, 255, 0.08)',
  '--epr-focus-bg-color': 'rgba(255, 255, 255, 0.12)',
  '--epr-highlight-color': 'rgba(1, 195, 109, 0.45)',
  '--epr-search-bg-color': 'rgba(0, 0, 0, 0.22)',
  '--epr-search-border-color': 'rgba(255, 255, 255, 0.1)',
  '--epr-header-padding': '6px 10px 0',
  '--epr-font-family': "'DM Sans', sans-serif",
  '--epr-scrollbar-width': '4px',
  '--epr-scrollbar-thumb-color': '#EBECEC4D',
  '--epr-search-input-bg-color': 'rgba(0, 0, 0, 0.22)',
} as CSSProperties;

const TABS: { id: Tab; label: string }[] = [
  { id: 'emoji', label: 'Emoji' },
  { id: 'gif', label: 'GIF' },
  { id: 'meme', label: 'Memes' },
];

const ComposerPicker = ({
  triggerRef,
  setMessage,
  onClose,
  onGifSelect,
}: ComposerPickerProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('emoji');
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndex = TABS.findIndex((t) => t.id === activeTab);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, triggerRef]);

  const handleMediaSelected = (item: GifItem) => {
    onGifSelect(item);
    onClose();
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[rgba(33,26,42,1)] shadow-2xl"
      style={{ width: 312, height: 380 }}
    >
      <div className="shrink-0 px-2.5 pt-2.5">
        <div
          className="relative grid rounded-xl border border-border/80 bg-background-alt/80 p-0.5"
          style={{
            gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))`,
          }}
          role="tablist"
          aria-label="Composer picker"
        >
          <span
            className="pointer-events-none absolute top-0.5 bottom-0.5 rounded-lg border border-border bg-primary shadow-[inset_0_1px_0_rgba(235,236,236,0.06)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              left: `calc(${activeIndex} * (100% / ${TABS.length}) + 0.125rem)`,
              width: `calc(100% / ${TABS.length} - 0.25rem)`,
            }}
            aria-hidden
          />
          {TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-10 flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors duration-200 ${
                  selected ? 'text-white' : 'text-body-300 hover:text-body-700'
                }`}
              >
                {tab.id === 'emoji' ? (
                  <EmojiIcon
                    className={`h-3.5 w-3.5 ${selected ? 'opacity-100' : 'opacity-55'}`}
                    style={
                      selected
                        ? {
                            fill: 'var(--color-green)',
                            stroke: 'var(--color-green)',
                          }
                        : undefined
                    }
                  />
                ) : (
                  <span
                    className={`rounded px-1 py-px text-[8px] font-bold tracking-wide ring-1 ring-inset ${
                      selected
                        ? 'bg-green/15 text-green ring-green/35'
                        : 'bg-white/6 text-body-300 ring-white/12'
                    }`}
                  >
                    {tab.id === 'gif' ? 'GIF' : 'MEME'}
                  </span>
                )}
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === 'emoji' ? (
          <>
            <EmojiPicker
              autoFocusSearch={false}
              theme={Theme.DARK}
              width={312}
              height={328}
              onEmojiClick={(e: EmojiClickData) =>
                setMessage((prev) => prev + e.emoji)
              }
              previewConfig={{ showPreview: false }}
              emojiStyle={EmojiStyle.FACEBOOK}
              lazyLoadEmojis
              searchPlaceHolder="Search emoji…"
              style={emojiPickerStyles}
            />
            <style>{`
              .EmojiPickerReact {
                border-radius: 0;
                border: none !important;
                background: transparent !important;
              }
              .EmojiPickerReact .epr-header {
                padding: var(--epr-header-padding);
              }
              .EmojiPickerReact .epr-search-container {
                margin: 0;
                padding: 0;
              }
              .EmojiPickerReact .epr-search-container input {
                height: 2rem;
                border-radius: 9999px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                background-color: rgba(0, 0, 0, 0.22) !important;
                padding: 0 2.25rem 0 2.1rem;
                font-size: 0.75rem;
                color: #fff;
                box-shadow: none;
              }
              .EmojiPickerReact .epr-search-container input::placeholder {
                color: rgba(235, 236, 236, 0.45);
              }
              .EmojiPickerReact .epr-search-container input:focus {
                border-color: rgba(1, 195, 109, 0.5);
                background-color: rgba(0, 0, 0, 0.3) !important;
                outline: none;
              }
              .EmojiPickerReact .epr-icn-search {
                opacity: 0.5;
              }
              .EmojiPickerReact .epr-category-nav {
                padding: 0.15rem 0.75rem 0.2rem;
                margin-top: 0.15rem;
              }
              .EmojiPickerReact .epr-emoji-category-label {
                font-size: 0.8rem;
                padding: 4px 0.75rem;
                height: fit-content;
              }
              .EmojiPickerReact .epr-body::-webkit-scrollbar { width: 4px; }
              .EmojiPickerReact .epr-body::-webkit-scrollbar-track { display: none; }
              .EmojiPickerReact .epr-body::-webkit-scrollbar-thumb {
                background-color: #EBECEC4D;
                border-radius: 20px;
              }
            `}</style>
          </>
        ) : (
          <div className="h-full px-2.5 pb-2 pt-2">
            <GifPicker kind={activeTab} onSelect={handleMediaSelected} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ComposerPicker;
