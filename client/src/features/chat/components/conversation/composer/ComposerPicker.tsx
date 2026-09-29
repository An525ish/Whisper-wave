import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import { createPortal } from 'react-dom';
import type { GifItem } from '@/features/chat/api/gif';
import { useMediaQuery } from '@/shared/hooks';
import EmojiIcon from '@/shared/components/ui/icons/Emoji';

const GifPicker = lazy(() => import('./gif-picker/GifPicker'));
const StyledEmojiPicker = lazy(() => import('./StyledEmojiPicker'));

const emojiPickerShellClass =
  'flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[rgba(33,26,42,1)] shadow-2xl';

const TAB_BAR_PX = 52;
const PICKER_MAX_W = 312;
const PICKER_MAX_H = 380;
type Tab = 'emoji' | 'gif' | 'meme';

type ComposerPickerProps = {
  triggerRef: RefObject<HTMLElement | null>;
  setMessage: Dispatch<SetStateAction<string>>;
  onClose: () => void;
  onGifSelect: (gif: GifItem) => void;
};

const TABS: { id: Tab; label: string }[] = [
  { id: 'emoji', label: 'Emoji' },
  { id: 'gif', label: 'GIF' },
  { id: 'meme', label: 'Memes' },
];

function measurePickerSize() {
  const narrow = window.innerWidth < 640;
  const w = Math.min(PICKER_MAX_W, Math.max(280, window.innerWidth - 16));
  const h = narrow
    ? Math.min(420, Math.max(360, Math.round(window.innerHeight * 0.52)))
    : Math.min(PICKER_MAX_H, Math.max(300, Math.round(window.innerHeight * 0.42)));
  return { width: w, height: h, contentHeight: h - TAB_BAR_PX };
}

const ComposerPicker = ({
  triggerRef,
  setMessage,
  onClose,
  onGifSelect,
}: ComposerPickerProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('emoji');
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndex = TABS.findIndex((t) => t.id === activeTab);
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const [size, setSize] = useState(measurePickerSize);

  useLayoutEffect(() => {
    const update = () => setSize(measurePickerSize());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

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

  const tabBar = (
    <div className="shrink-0 px-2.5 pt-2.5">
      <div
        className="relative grid rounded-xl border border-border/80 bg-background-alt/80 p-0.5"
        style={{ gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }}
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
                  style={selected ? { fill: 'var(--color-green)', stroke: 'var(--color-green)' } : undefined}
                />
              ) : (
                <span
                  className={`rounded px-1 py-px text-[8px] font-bold tracking-wide ring-1 ring-inset ${
                    selected ? 'bg-green/15 text-green ring-green/35' : 'bg-white/6 text-body-300 ring-white/12'
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
  );

  const picker = (
    <div
      ref={containerRef}
      className={emojiPickerShellClass}
      style={{ width: size.width, height: size.height }}
    >
      {tabBar}
      <div className="min-h-0 flex-1 overflow-hidden" style={{ height: size.contentHeight }}>
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-white/5" />}>
          {activeTab === 'emoji' ? (
            <StyledEmojiPicker
              width={size.width}
              height={size.contentHeight}
              onEmojiClick={(e) => setMessage((prev) => prev + e.emoji)}
            />
          ) : (
            <div className="h-full px-2.5 pb-2 pt-2">
              <GifPicker kind={activeTab} onSelect={handleMediaSelected} />
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <div className="absolute bottom-14 left-0 z-30 max-w-[calc(100vw-1rem)]">
        {picker}
      </div>
    );
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-40 bg-black/25" aria-hidden onClick={onClose} />
      <div
        className="fixed inset-x-2 bottom-[max(4.25rem,calc(env(safe-area-inset-bottom)+3rem))] z-40 flex justify-start"
      >
        {picker}
      </div>
    </>,
    document.body,
  );
};

export default ComposerPicker;
