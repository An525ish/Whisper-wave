import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ImageViewer from '@/shared/components/ui/image-viewer/ImageViewer';
import { RetryableMediaImage } from '@/shared/components/ui/media/RetryableMedia';
import RefreshButton from '../shared/RefreshButton';
import SelectionBar from './feed/SelectionBar';
import ConfirmationModal from '@/shared/components/ui/modal/confirmation-modal/ConfirmationModal';
import { deleteAdminAnonImages, getAdminAnonImages } from '../../api/admin';

const KEY = ['adminAnonImages'] as const;

/** Photos sent in anonymous chats. Kept until an admin deletes them (R2 file + row). */
const AnonPhotos = () => {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);

  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: KEY,
    queryFn: ({ pageParam }) => getAdminAnonImages(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => (p.hasMore ? (p.nextCursor ?? undefined) : undefined),
  });
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  const del = useMutation({
    mutationFn: deleteAdminAnonImages,
    onSuccess: () => {
      setSelected(new Set());
      setIsSelectMode(false);
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue">Console</p>
          <h1 className="mt-1 text-3xl font-semibold leading-none tracking-tight text-body">Anon photos</h1>
          <p className="mt-2 text-sm text-body-300">
            Photos sent in anonymous chats. They stay until you delete them here.
          </p>
        </div>
        <div className="flex items-center gap-2">
        <RefreshButton />
        <button
          type="button"
          onClick={() => {
            setIsSelectMode((on) => !on);
            setSelected(new Set());
          }}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
            isSelectMode
              ? 'border-blue/35 bg-blue/10 text-blue hover:bg-blue/15'
              : 'border-border/40 bg-primary/20 text-body-300 hover:border-border/60 hover:text-body'
          }`}
        >
          {isSelectMode ? 'Cancel' : 'Select'}
        </button>
        </div>
      </header>

      {isLoading && <p className="text-sm text-body-300">Loading…</p>}
      {isError && <p className="text-sm text-red">Could not load photos.</p>}
      {!isLoading && !isError && items.length === 0 && (
        <p className="text-sm text-body-300">No photos yet.</p>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {items.map((img, index) => (
          <li key={img._id} className="relative overflow-hidden rounded-xl border border-border/40">
            {/* Same as Media & Files: tap opens the viewer, or toggles while in Select mode. */}
            <button
              type="button"
              onClick={() => (isSelectMode ? toggle(img._id) : setViewerIndex(index))}
              aria-label={isSelectMode ? 'Select photo' : 'Open photo'}
              aria-pressed={isSelectMode ? selected.has(img._id) : undefined}
              className={`group relative block aspect-square w-full overflow-hidden bg-surface-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue/50 ${isSelectMode && selected.has(img._id) ? 'ring-2 ring-green/70' : ''}`}
            >
              <RetryableMediaImage
                url={img.url}
                alt="Anonymous chat photo"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
                wrapperClassName="h-full w-full"
                loading="lazy"
              />
              {isSelectMode && (
                <>
                  <span className={`pointer-events-none absolute inset-0 z-10 transition-colors duration-150 ${selected.has(img._id) ? 'bg-green/20' : 'bg-transparent group-hover:bg-white/5'}`} />
                  <span
                    className={`pointer-events-none absolute right-2 top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-150 ${
                      selected.has(img._id) ? 'border-green bg-green' : 'border-white/60 bg-black/30 group-hover:border-white'
                    }`}
                  >
                    {selected.has(img._id) && (
                      <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                </>
              )}
            </button>
            <p className="truncate px-2 py-1 text-[11px] text-body-700">
              {img.source === 'room' ? `room/${img.roomSlug}` : 'whisper'} · {img.sessionId.slice(0, 8)} · {new Date(img.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>

      {viewerIndex !== null && items.length > 0 && (
        <ImageViewer
          mediaFiles={items.map((img) => ({ _id: img._id, url: img.url, name: 'photo', fileType: 'image' }))}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}

      {hasNextPage && (
        <button type="button" onClick={() => void fetchNextPage()} disabled={isFetchingNextPage} className="self-center text-sm text-green hover:underline">
          {isFetchingNextPage ? 'Loading…' : 'Load more'}
        </button>
      )}

      <SelectionBar
        count={selected.size}
        total={items.length}
        isDeleting={del.isPending}
        onSelectAll={() => setSelected(new Set(items.map((i) => i._id)))}
        onClear={() => setSelected(new Set())}
        onDelete={() => setConfirm(true)}
      />

      {confirm && (
        <ConfirmationModal
          title={`Delete ${selected.size} photo${selected.size === 1 ? '' : 's'}?`}
          description="The files are removed from R2 for good. This cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          onClose={() => setConfirm(false)}
          handleConfirmationModal={({ accept }) => {
            setConfirm(false);
            if (accept) del.mutate([...selected]);
          }}
        />
      )}
    </div>
  );
};

export default AnonPhotos;
