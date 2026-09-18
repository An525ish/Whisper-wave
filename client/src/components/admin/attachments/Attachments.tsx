import ConfirmationModal from '@/components/ui/modal/confirmation-modal/ConfirmationModal';
import ImageViewer from '@/components/ui/image-viewer/ImageViewer';
import Searchbar from '@/components/ui/Searchbar';
import AttachmentsContent from './feed/AttachmentsContent';
import AttachmentsStats from './stats/AttachmentsStats';
import KindFilterTabs from './feed/KindFilterTabs';
import SelectionBar from './feed/SelectionBar';
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
    isSelectMode,
    setIsSelectMode,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    allSelectableIds,
    showConfirmDelete,
    isConfirmOpen,
    handleConfirm,
    isDeleting,
  } = useAttachmentsPage();

  return (
    <>
      <div className="mx-auto flex h-[calc(100dvh-3rem)] max-h-[calc(100dvh-3rem)] min-h-0 w-full max-w-6xl flex-col gap-8 lg:h-[calc(100dvh-3.5rem)] lg:max-h-[calc(100dvh-3.5rem)]">
        <header className="flex shrink-0 flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue">Console</p>
            <h1 className="mt-1 font-semibold text-3xl leading-none tracking-tight text-body sm:text-4xl">
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
            placeholder={
              kindFilter === 'links'
                ? 'Search links…'
                : kindFilter === 'deleted'
                  ? 'Search deleted files or links…'
                  : 'Search by filename…'
            }
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
            isSelectMode={isSelectMode}
            onSelectToggle={() => {
              if (isSelectMode) clearSelection();
              else setIsSelectMode(true);
            }}
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
            isSelectMode={isSelectMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
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

      <SelectionBar
        count={selectedIds.size}
        total={allSelectableIds.length}
        isDeleting={isDeleting}
        onSelectAll={selectAll}
        onClear={clearSelection}
        onDelete={showConfirmDelete}
      />

      {isConfirmOpen && (
        <ConfirmationModal
          title={`Delete ${selectedIds.size} item${selectedIds.size === 1 ? '' : 's'}?`}
          description="The messages and their R2 files will be permanently deleted. This cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          onClose={() => handleConfirm(false)}
          handleConfirmationModal={({ accept }) => handleConfirm(accept)}
        />
      )}
    </>
  );
};

export default Attachments;
