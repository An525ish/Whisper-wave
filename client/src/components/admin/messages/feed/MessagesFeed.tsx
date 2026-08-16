import type { RefObject } from 'react';
import InfiniteScrollSentinel from '@/components/admin/shared/InfiniteScrollSentinel';
import type { AdminMessageRow } from '@/types/admin';
import MessageRow from './MessageRow';
import MessagesEmptyState from './MessagesEmptyState';
import MessagesErrorState from './MessagesErrorState';
import MessagesFeedSkeleton from './MessagesFeedSkeleton';

type MessagesFeedProps = {
  scrollRef: RefObject<HTMLDivElement | null>;
  messages: AdminMessageRow[];
  isLoading: boolean;
  isSearchPending: boolean;
  isError: boolean;
  emptyDescription: string;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  sentinelEnabled: boolean;
  deleting: boolean;
  retrying: boolean;
  onDelete: (msg: AdminMessageRow) => void;
  onRetry: (messageId: string) => void;
  onLoadMore: () => void;
  onRetryFetch: () => void;
};

const MessagesFeed = ({
  scrollRef,
  messages,
  isLoading,
  isSearchPending,
  isError,
  emptyDescription,
  hasNextPage,
  isFetchingNextPage,
  sentinelEnabled,
  deleting,
  retrying,
  onDelete,
  onRetry,
  onLoadMore,
  onRetryFetch,
}: MessagesFeedProps) => (
  <div
    ref={scrollRef}
    className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1 scrollbar-hide"
  >
    {isLoading || isSearchPending ? (
      <MessagesFeedSkeleton />
    ) : isError ? (
      <MessagesErrorState onRetry={onRetryFetch} />
    ) : messages.length === 0 ? (
      <MessagesEmptyState description={emptyDescription} />
    ) : (
      <div className="space-y-0.5 pb-2">
        {messages.map((msg) => (
          <MessageRow
            key={msg._id}
            msg={msg}
            deleting={deleting}
            retrying={retrying}
            onDelete={() => onDelete(msg)}
            onRetry={() => onRetry(msg._id)}
          />
        ))}

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

export default MessagesFeed;
