import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MediaFile } from '@/components/ui/image-viewer/ImageViewer';
import type { UserFilterOption } from '@/types/admin';
import { ADMIN_MIN_SEARCH_LEN } from '@/constants/admin/attachments';
import { SEARCH_DEBOUNCE_MS } from '@/constants/app';
import { useAdminAttachmentsQuery } from '@/hooks/admin';
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
  };
}
