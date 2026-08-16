import ImageViewer from '@/components/ui/image-viewer/ImageViewer';
import Searchbar from '@/components/ui/Searchbar';
import AttachmentsContent from './feed/AttachmentsContent';
import AttachmentsStats from './stats/AttachmentsStats';
import KindFilterTabs from './feed/KindFilterTabs';
import { useAttachmentsPage } from '@/hooks/admin';

const Attachments = () => {
  const {
    scrollRef,
    searchText,
    setSearchText,
    debouncedSearch,
    kindFilter,
    setKindFilter,
    senderFilter,
    setSenderFilter,
    viewerMediaFiles,
    viewerIndex,
    isSearchPending,
    showMinSearchHint,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    matchTotal,
    hasFilter,
    flatItems,
    mediaItems,
    docItems,
    linkItems,
    handleMediaClick,
    closeViewer,
    showMedia,
    showDocs,
    showLinks,
    isEmpty,
    sentinelEnabled,
  } = useAttachmentsPage();

  return (
    <>
      <div className="mx-auto flex h-[calc(100dvh-3rem)] max-h-[calc(100dvh-3rem)] min-h-0 w-full max-w-6xl flex-col gap-8 lg:h-[calc(100dvh-3.5rem)] lg:max-h-[calc(100dvh-3.5rem)]">
        <header className="flex shrink-0 flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue">Console</p>
            <h1 className="mt-1 font-display text-3xl leading-none tracking-tight text-body sm:text-4xl">
              Media &amp; Files
            </h1>
            <p className="mt-2 text-sm text-body-300">
              Browse images, videos, and documents shared across all chats
            </p>
          </div>
          <Searchbar
            className="w-full sm:w-72"
            searchText={searchText}
            setSearchText={setSearchText}
            placeholder={kindFilter === 'links' ? 'Search links…' : 'Search by filename…'}
            expandable={false}
          />
        </header>

        <AttachmentsStats
          hasFilter={hasFilter}
          kindFilter={kindFilter}
          isLoading={isLoading}
          matchTotal={matchTotal}
          mediaCount={mediaItems.length}
          linkCount={linkItems.length}
          docCount={docItems.length}
        />

        <section className="flex min-h-0 flex-1 flex-col">
          <KindFilterTabs
            kindFilter={kindFilter}
            onKindChange={setKindFilter}
            flatCount={flatItems.length}
            linkCount={linkItems.length}
            senderFilter={senderFilter}
            onSenderChange={setSenderFilter}
            debouncedSearch={debouncedSearch}
            searchText={searchText}
            showMinSearchHint={showMinSearchHint}
            onClearSearch={() => setSearchText('')}
          />

          <AttachmentsContent
            scrollRef={scrollRef}
            isLoading={isLoading}
            isSearchPending={isSearchPending}
            isError={isError}
            isEmpty={isEmpty}
            kindFilter={kindFilter}
            senderName={senderFilter?.name}
            debouncedSearch={debouncedSearch}
            showMedia={showMedia}
            showDocs={showDocs}
            showLinks={showLinks}
            mediaItems={mediaItems}
            docItems={docItems}
            linkItems={linkItems}
            hasNextPage={Boolean(hasNextPage)}
            isFetchingNextPage={isFetchingNextPage}
            sentinelEnabled={sentinelEnabled}
            onMediaClick={handleMediaClick}
            onLoadMore={() => void fetchNextPage()}
            onRetry={() => void refetch()}
          />
        </section>
      </div>

      {viewerIndex !== null && viewerMediaFiles.length > 0 && (
        <ImageViewer
          mediaFiles={viewerMediaFiles}
          initialIndex={viewerIndex}
          onClose={closeViewer}
        />
      )}
    </>
  );
};

export default Attachments;
