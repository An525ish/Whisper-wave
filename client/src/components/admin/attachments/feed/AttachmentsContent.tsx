import InfiniteScrollSentinel from '@/components/admin/shared/InfiniteScrollSentinel';
import AttachmentsEmptyState from './AttachmentsEmptyState';
import AttachmentsGridSkeleton from './AttachmentsGridSkeleton';
import DocCard from '../cards/DocCard';
import LinkCard from '../cards/LinkCard';
import MediaCard from '../cards/MediaCard';
import type { FlatItem, LinkItem } from '@/types/admin';
import type { AttachmentKindFilter } from '@/types/admin';
import type { RefObject } from 'react';

type AttachmentsContentProps = {
  scrollRef: RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  isSearchPending: boolean;
  isError: boolean;
  isEmpty: boolean;
  kindFilter: AttachmentKindFilter;
  senderName?: string;
  debouncedSearch: string;
  showMedia: boolean;
  showDocs: boolean;
  showLinks: boolean;
  mediaItems: FlatItem[];
  docItems: FlatItem[];
  linkItems: LinkItem[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  sentinelEnabled: boolean;
  onMediaClick: (item: FlatItem) => void;
  onLoadMore: () => void;
  onRetry: () => void;
};

const AttachmentsContent = ({
  scrollRef,
  isLoading,
  isSearchPending,
  isError,
  isEmpty,
  kindFilter,
  senderName,
  debouncedSearch,
  showMedia,
  showDocs,
  showLinks,
  mediaItems,
  docItems,
  linkItems,
  hasNextPage,
  isFetchingNextPage,
  sentinelEnabled,
  onMediaClick,
  onLoadMore,
  onRetry,
}: AttachmentsContentProps) => (
  <div
    ref={scrollRef}
    className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1 scrollbar-hide"
  >
    {isLoading || isSearchPending ? (
      <AttachmentsGridSkeleton />
    ) : isError ? (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <p className="text-sm font-medium text-body">Couldn&apos;t load files</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-border/50 bg-primary/35 px-4 py-2 text-xs font-semibold text-body-300 hover:text-body"
        >
          Try again
        </button>
      </div>
    ) : isEmpty ? (
      <AttachmentsEmptyState
        kindFilter={kindFilter}
        senderName={senderName}
        hasSearch={Boolean(debouncedSearch)}
      />
    ) : (
      <div className="space-y-6 pb-4">
        {showMedia && mediaItems.length > 0 && (
          <div>
            {kindFilter === 'all' && (
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-body-300/50">
                Media · {mediaItems.length} loaded
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {mediaItems.map((item) => (
                <MediaCard key={item.key} item={item} onClick={() => onMediaClick(item)} />
              ))}
            </div>
          </div>
        )}

        {showDocs && docItems.length > 0 && (
          <div>
            {kindFilter === 'all' && (
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-body-300/50">
                Documents · {docItems.length} loaded
              </p>
            )}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {docItems.map((item) => (
                <DocCard key={item.key} item={item} />
              ))}
            </div>
          </div>
        )}

        {showLinks && linkItems.length > 0 && (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {linkItems.map((item) => (
              <LinkCard key={item.key} item={item} />
            ))}
          </div>
        )}

        <InfiniteScrollSentinel
          scrollRef={scrollRef}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={onLoadMore}
          enabled={sentinelEnabled}
        />
      </div>
    )}
  </div>
);

export default AttachmentsContent;
