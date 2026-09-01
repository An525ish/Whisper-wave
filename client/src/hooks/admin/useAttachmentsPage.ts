import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MediaFile } from '@/components/ui/image-viewer/ImageViewer';
import type { UserFilterOption } from '@/types/admin';
import { ADMIN_MIN_SEARCH_LEN } from '@/constants/admin/attachments';
import { SEARCH_DEBOUNCE_MS } from '@/constants/app';
import { useAdminAttachmentsQuery, useDeleteAdminAttachmentsMutation } from '@/hooks/admin';
import type { FlatItem, AttachmentKindFilter } from '@/types/admin';
import {
  buildLinkItems,
  filterDocItems,
  filterMediaItems,
  flattenAttachmentItems,
  showsDocsSection,
  showsLinksSection,
  showsMediaSection,
} from '@/utils/admin/attachments';

export function useAttachmentsPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<AttachmentKindFilter>('all');
  const [senderFilter, setSenderFilter] = useState<UserFilterOption | null>(null);
  const [viewerMediaFiles, setViewerMediaFiles] = useState<MediaFile[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Selection state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { mutate: bulkDelete, isPending: isDeleting } = useDeleteAdminAttachmentsMutation();

  const toggleSelect = useCallback((msgId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setIsSelectMode(false);
  }, []);

  useEffect(() => {
    const id = setTimeout(
      () => setDebouncedSearch(searchText.length >= ADMIN_MIN_SEARCH_LEN ? searchText : ''),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(id);
  }, [searchText]);

  const isSearchPending = searchText !== debouncedSearch;
  const showMinSearchHint = searchText.length > 0 && searchText.length < ADMIN_MIN_SEARCH_LEN;

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useAdminAttachmentsQuery(debouncedSearch, senderFilter?._id ?? '', kindFilter);

  const pages = data?.pages ?? [];
  const matchTotal = pages[0]?.total ?? 0;
  const hasFilter = Boolean(debouncedSearch || senderFilter || kindFilter !== 'all');

  const flatItems = useMemo(
    () => flattenAttachmentItems(pages, kindFilter),
    [pages, kindFilter],
  );

  const mediaItems = useMemo(
    () => filterMediaItems(flatItems, kindFilter),
    [flatItems, kindFilter],
  );

  const docItems = useMemo(() => filterDocItems(flatItems), [flatItems]);

  const linkItems = useMemo(
    () => buildLinkItems(pages, kindFilter),
    [pages, kindFilter],
  );

  // Derive all selectable message IDs from the currently loaded items
  const allSelectableIds = useMemo(() => {
    const fromFlat = flatItems.map((i) => i.msg._id);
    const fromLinks = linkItems.map((i) => i.msg._id);
    return [...new Set([...fromFlat, ...fromLinks])];
  }, [flatItems, linkItems]);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(allSelectableIds));
  }, [allSelectableIds]);

  const showConfirmDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    setIsConfirmOpen(true);
  }, [selectedIds.size]);

  const handleConfirm = useCallback(
    (accept: boolean) => {
      setIsConfirmOpen(false);
      if (!accept) return;
      bulkDelete([...selectedIds], {
        onSuccess: () => clearSelection(),
      });
    },
    [bulkDelete, clearSelection, selectedIds],
  );

  const handleMediaClick = useCallback(
    (item: FlatItem) => {
      const allMedia = mediaItems.map((i) => ({
        _id: i.key,
        url: i.att.url,
        name: i.att.name,
        publicId: i.att.publicId,
        fileType: i.att.fileType,
      }));
      const idx = mediaItems.findIndex((i) => i.key === item.key);
      setViewerMediaFiles(allMedia);
      setViewerIndex(idx >= 0 ? idx : 0);
    },
    [mediaItems],
  );

  const closeViewer = useCallback(() => setViewerIndex(null), []);

  const showMedia = showsMediaSection(kindFilter);
  const showDocs = showsDocsSection(kindFilter);
  const showLinks = showsLinksSection(kindFilter);

  const isEmpty =
    flatItems.length === 0 && linkItems.length === 0 && !isLoading && !isSearchPending;

  const sentinelEnabled =
    !isLoading && !isSearchPending && !isError && (flatItems.length > 0 || linkItems.length > 0);

  return {
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
    // selection
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
  };
}
