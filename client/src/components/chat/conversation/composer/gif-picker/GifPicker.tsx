import { useEffect, useRef, useState, type RefObject } from 'react';
import { useGifSearch } from '@/hooks/chat/useGifHooks';
import type { GifItem, KlipyKind } from '@/api/gif';
import searchIcon from '@/assets/search.svg';
import EmptyState from '@/components/ui/EmptyState';

type GifPickerProps = {
  kind: KlipyKind;
  onSelect: (gif: GifItem) => void;
};

const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
};

const MediaGrid = ({
  items,
  onSelect,
}: {
  items: GifItem[];
  onSelect: (gif: GifItem) => void;
}) => {
  const col0 = items.filter((_, i) => i % 2 === 0);
  const col1 = items.filter((_, i) => i % 2 !== 0);

  const renderCol = (list: GifItem[]) =>
    list.map((item) => {
      const aspectRatio =
        item.height && item.width ? item.height / item.width : 0.75;
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item)}
          className="group w-full overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-green/60"
          style={{ aspectRatio: `1 / ${aspectRatio}` }}
          aria-label={item.title || item.kind}
          title={item.title}
        >
          <img
            src={item.previewUrl}
            alt={item.title || item.kind}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition group-hover:scale-105 group-hover:brightness-110"
          />
        </button>
      );
    });

  return (
    <div className="flex gap-1.5">
      <div className="flex flex-1 flex-col gap-1.5">{renderCol(col0)}</div>
      <div className="flex flex-1 flex-col gap-1.5">{renderCol(col1)}</div>
    </div>
  );
};

const PickerSearch = ({
  value,
  onChange,
  placeholder,
  isFetching,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  isFetching?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
}) => (
  <div className="relative shrink-0">
    <img
      src={searchIcon}
      alt=""
      className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-50"
    />
    <input
      ref={inputRef}
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-8 w-full rounded-full border border-white/10 bg-black/22 py-0 pl-8 pr-8 text-xs text-white outline-none transition placeholder:text-body-300/80 focus:border-green/50 focus:bg-black/30 [&::-ms-clear]:hidden [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
    />
    {isFetching ? (
      <span className="absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin rounded-full border border-green/40 border-t-green" />
    ) : null}
  </div>
);

const RetryButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-full border border-green/35 bg-green/10 px-3.5 py-1.5 text-xs font-medium text-green transition hover:border-green/55 hover:bg-green/15"
  >
    Try again
  </button>
);

const GifPicker = ({ kind, onSelect }: GifPickerProps) => {
  const [inputValue, setInputValue] = useState('');
  const query = useDebounce(inputValue, 400);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isFetching,
    isFetchingNextPage,
    isError,
    hasNextPage,
    fetchNextPage,
    refetch,
    isPending,
  } = useGifSearch(query, kind);

  const items = data?.pages.flatMap((page) => page.data) ?? [];

  useEffect(() => {
    setInputValue('');
  }, [kind]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [kind]);

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          void fetchNextPage();
        }
      },
      { root, rootMargin: '120px', threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, items.length]);

  const label = kind === 'meme' ? 'memes' : 'GIFs';
  const titleLabel = kind === 'meme' ? 'Memes' : 'GIFs';
  const illustrationSrc =
    kind === 'meme' ? '/images/no-meme.svg' : '/images/no-gif.svg';
  const showInitialSpinner = isPending && items.length === 0;
  const isSearching = isFetching && !isFetchingNextPage && items.length > 0;

  return (
    <div className="flex h-full flex-col gap-2">
      <PickerSearch
        value={inputValue}
        onChange={setInputValue}
        placeholder={`Search ${label}…`}
        isFetching={isSearching || showInitialSpinner}
        inputRef={inputRef}
      />

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
      >
        {isError && items.length === 0 ? (
          <EmptyState
            className="h-full min-h-40 py-4"
            imageSrc={illustrationSrc}
            imageAlt=""
            imageClassName="mx-auto w-[40%] max-w-32 opacity-85"
            titleClassName="mt-3 text-center text-sm font-semibold text-body"
            descriptionClassName="mt-1.5 text-center text-[11px] leading-relaxed text-body-300"
            contentClassName="max-w-[14rem]"
            title={`Couldn't load ${titleLabel.toLowerCase()}`}
            description="Check your connection and try again."
            action={<RetryButton onClick={() => void refetch()} />}
          />
        ) : !isPending && items.length === 0 && inputValue.trim() ? (
          <EmptyState
            className="h-full min-h-40 py-4"
            imageSrc={illustrationSrc}
            imageAlt=""
            imageClassName="mx-auto w-[50%] max-w-32 opacity-85"
            titleClassName="mt-3 text-center text-sm font-semibold text-body"
            descriptionClassName="mt-1.5 text-center text-[11px] leading-relaxed text-body-300"
            contentClassName="max-w-[14rem]"
            title={`No ${label} found`}
            description={`Nothing matched “${inputValue.trim()}”. Try a different keyword.`}
          />
        ) : !isPending && items.length === 0 ? (
          <EmptyState
            className="h-full min-h-40 py-4"
            imageSrc={illustrationSrc}
            imageAlt=""
            imageClassName="mx-auto w-[52%] max-w-32 opacity-85"
            titleClassName="mt-3 text-center text-sm font-semibold text-body"
            descriptionClassName="mt-1.5 text-center text-[11px] leading-relaxed text-body-300"
            contentClassName="max-w-[14rem]"
            title={`No trending ${label}`}
            description={`Browse later or search for ${label} you want to send.`}
            action={<RetryButton onClick={() => void refetch()} />}
          />
        ) : (
          <>
            <MediaGrid items={items} onSelect={onSelect} />
            <div ref={sentinelRef} className="h-8 w-full" aria-hidden />
            {isFetchingNextPage ? (
              <div className="flex justify-center py-2">
                <span className="h-4 w-4 animate-spin rounded-full border border-green/40 border-t-green" />
              </div>
            ) : null}
          </>
        )}
      </div>

      <p className="shrink-0 text-center text-[10px] text-body-300/50">
        Powered by Klipy
      </p>
    </div>
  );
};

export default GifPicker;
