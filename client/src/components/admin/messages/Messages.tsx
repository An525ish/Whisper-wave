import ConfirmationModal from '@/components/ui/modal/confirmation-modal/ConfirmationModal';
import { useMessagesPage } from '@/hooks/admin';
import {
  messagesEmptyDescription,
  messagesMatchesLabel,
  messagesMatchesValue,
} from '@/utils/admin/messages';
import MessagesFeed from './feed/MessagesFeed';
import MessagesFeedHeader from './feed/MessagesFeedHeader';
import StatusFilterTabs from './feed/StatusFilterTabs';
import MessagesHeader from './header/MessagesHeader';
import MessagesStats from './stats/MessagesStats';

const Messages = () => {
  const {
    scrollRef,
    searchText,
    setSearchText,
    querySearch,
    statusFilter,
    setStatusFilter,
    senderFilter,
    setSenderFilter,
    deleteTarget,
    setDeleteTarget,
    messages,
    matchTotal,
    platformTotal,
    newThisWeek,
    failedLoaded,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
    isSearchPending,
    showMinSearchHint,
    sentinelEnabled,
    deleteMessage,
    retryMessage,
    deleting,
    retrying,
  } = useMessagesPage();

  return (
    <div className="mx-auto flex h-[calc(100dvh-3rem)] max-h-[calc(100dvh-3rem)] min-h-0 w-full max-w-6xl flex-col gap-8 lg:h-[calc(100dvh-3.5rem)] lg:max-h-[calc(100dvh-3.5rem)]">
      <MessagesHeader searchText={searchText} setSearchText={setSearchText} />

      <MessagesStats
        platformTotal={platformTotal}
        matchesLabel={messagesMatchesLabel(querySearch, statusFilter, senderFilter)}
        matchesValue={messagesMatchesValue(
          querySearch,
          statusFilter,
          senderFilter,
          matchTotal,
          messages.length,
        )}
        failedLoaded={failedLoaded}
        newThisWeek={newThisWeek}
      />

      <section className="flex min-h-0 flex-1 flex-col">
        <MessagesFeedHeader
          senderFilter={senderFilter}
          querySearch={querySearch}
          searchText={searchText}
          showMinSearchHint={showMinSearchHint}
          onClearSearch={() => setSearchText('')}
        />

        <StatusFilterTabs
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          senderFilter={senderFilter}
          onSenderChange={setSenderFilter}
          tabCount={matchTotal || messages.length}
        />

        <MessagesFeed
          scrollRef={scrollRef}
          messages={messages}
          isLoading={isLoading}
          isSearchPending={isSearchPending}
          isError={isError}
          emptyDescription={messagesEmptyDescription(senderFilter, querySearch, statusFilter)}
          hasNextPage={Boolean(hasNextPage)}
          isFetchingNextPage={isFetchingNextPage}
          sentinelEnabled={sentinelEnabled}
          deleting={deleting}
          retrying={retrying}
          onDelete={setDeleteTarget}
          onRetry={(messageId) => retryMessage(messageId)}
          onLoadMore={() => void fetchNextPage()}
          onRetryFetch={() => void refetch()}
        />
      </section>

      {deleteTarget && (
        <ConfirmationModal
          variant="danger"
          title="Delete this message?"
          description="This message will be permanently removed from the database."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onClose={() => setDeleteTarget(null)}
          handleConfirmationModal={({ accept }) => {
            const target = deleteTarget;
            setDeleteTarget(null);
            if (accept) deleteMessage(target._id);
          }}
        />
      )}
    </div>
  );
};

export default Messages;
