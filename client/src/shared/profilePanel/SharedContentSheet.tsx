import EmptyState from '@/components/ui/EmptyState';
import {
  RetryableMediaImage,
  RetryableMediaVideo,
} from '@/components/media/RetryableMedia';
import ChevronLeft from '@/components/icons/ChevronLeft';
import ImagesIcon from '@/components/icons/Images';
import VideosIcon from '@/components/icons/Video';
import FilesIcon from '@/components/icons/FilesIcon';
import LinkIcon from '@/components/icons/Link';
import AudiosIcon from '@/components/icons/Audio';
import GridAllIcon from '@/components/icons/GridAll';
import { fileData, fileFormat, getMediaDisplayName, getMediaKindFromFile } from '@/lib/features';
import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type MouseEvent,
} from 'react';
import toast from 'react-hot-toast';
import type { IconProps } from '@/types';

type MediaFile = {
  _id?: string;
  publicId?: string;
  name?: string;
  url?: string;
  fileType?: string;
};

type SharedLink = {
  url: string;
  host: string;
  messageId: string;
};

export type SharedContentTab = 'photos' | 'attachments' | 'links';

type SharedContentSheetProps = {
  mediaFiles: MediaFile[];
  docFiles: MediaFile[];
  links: SharedLink[];
  initialTab: SharedContentTab;
  onClose: () => void;
  onOpenPhoto: (file: MediaFile) => void;
  onOpenDocument: (
    e: MouseEvent,
    url: string | undefined,
    name: string | undefined,
  ) => void;
};

type PhotoFilter = 'all' | 'image' | 'video' | 'audio';

type TabIcon = ComponentType<IconProps>;

const tabIconClass = (selected: boolean, strokeOnly = false) =>
  strokeOnly
    ? `h-4 w-4 shrink-0 transition ${
        selected ? 'text-green' : 'text-body-300'
      }`
    : `h-4 w-4 shrink-0 transition ${
        selected ? 'fill-green stroke-green' : 'fill-body-300 stroke-body-300'
      }`;

const filterIconClass = (selected: boolean, strokeOnly = false) =>
  strokeOnly
    ? `h-3.5 w-3.5 shrink-0 ${
        selected ? 'text-green' : 'text-body-300'
      }`
    : `h-3.5 w-3.5 shrink-0 ${
        selected ? 'fill-green stroke-green' : 'fill-body-300 stroke-body-300'
      }`;

const countBadgeClass = (selected: boolean) =>
  `grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1 text-[10px] font-semibold tabular-nums leading-none ${
    selected
      ? 'bg-green/20 text-green ring-1 ring-inset ring-green/35'
      : 'bg-border/50 text-body-300 ring-1 ring-inset ring-white/[0.04]'
  }`;

const filterCountBadgeClass = (selected: boolean) =>
  `inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-sm px-1 py-0 text-[10px] font-semibold tabular-nums leading-none ${
    selected
      ? 'bg-white/12 text-white/85'
      : 'bg-background-alt/90 text-body-300'
  }`;

const TABS: {
  id: SharedContentTab;
  label: string;
  hint: string;
  Icon: TabIcon;
  strokeOnly?: boolean;
}[] = [
  {
    id: 'photos',
    label: 'Images',
    hint: 'Photos, videos & audio',
    Icon: ImagesIcon,
  },
  {
    id: 'attachments',
    label: 'Files',
    hint: 'Documents & downloads',
    Icon: FilesIcon,
  },
  {
    id: 'links',
    label: 'Links',
    hint: 'URLs shared in chat',
    Icon: LinkIcon,
    strokeOnly: true,
  },
];

const PHOTO_FILTERS: {
  key: PhotoFilter;
  label: string;
  Icon: TabIcon;
  strokeOnly?: boolean;
}[] = [
  { key: 'all', label: 'All', Icon: GridAllIcon, strokeOnly: true },
  { key: 'image', label: 'Photos', Icon: ImagesIcon },
  { key: 'video', label: 'Videos', Icon: VideosIcon },
  { key: 'audio', label: 'Audio', Icon: AudiosIcon },
];

const SearchIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden
  >
    <path
      d="M9 3.5a5.5 5.5 0 103.47 9.79l3.23 3.23a.75.75 0 101.06-1.06l-3.23-3.23A5.5 5.5 0 009 3.5z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden
  >
    <path
      d="M11 3h6v6M17 3l-8 8M7 5H4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CopyIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden
  >
    <rect
      x="7"
      y="7"
      width="10"
      height="10"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M5 13V5a1 1 0 011-1h8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const ExpandIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden
  >
    <path
      d="M8 3H3v5M12 3h5v5M12 17h5v-5M8 17H3v-5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const renderMediaThumbnail = (file: MediaFile) => {
  const kind = getMediaKindFromFile(file);

  switch (kind) {
    case 'image':
      return (
        <RetryableMediaImage
          url={file.url ?? ''}
          alt={getMediaDisplayName({ name: file.name, url: file.url, publicId: file.publicId, fileType: file.fileType })}
          transformWidth={400}
          className="aspect-square w-full bg-primary object-cover"
          fallbackIconClassName="h-9 w-9"
        />
      );
    case 'video':
      return (
        <RetryableMediaVideo
          url={file.url ?? ''}
          className="aspect-square w-full bg-primary object-cover"
          fallbackIconClassName="h-9 w-9"
          muted
          playsInline
          preload="metadata"
        />
      );
    case 'audio':
      return (
        <div className="flex aspect-square w-full items-center justify-center bg-gradient-to-br from-green-dark/80 to-primary">
          <img
            src="/icons/music-icon.svg"
            alt=""
            className="h-10 w-10 opacity-90"
          />
        </div>
      );
  }
};

const mediaTypeLabel = (file: MediaFile) => {
  const kind = getMediaKindFromFile(file);
  if (kind === 'video') return 'Video';
  if (kind === 'audio') return 'Audio';
  return 'Photo';
};

const SharedContentSheet = ({
  mediaFiles,
  docFiles,
  links,
  initialTab,
  onClose,
  onOpenPhoto,
  onOpenDocument,
}: SharedContentSheetProps) => {
  const [activeTab, setActiveTab] = useState<SharedContentTab>(initialTab);
  const [query, setQuery] = useState('');
  const [photoFilter, setPhotoFilter] = useState<PhotoFilter>('all');
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
    setQuery('');
    setPhotoFilter('all');
  }, [initialTab]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const activeIndex = TABS.findIndex((t) => t.id === activeTab);
  const activeMeta = TABS[activeIndex] ?? TABS[0];

  const filteredPhotos = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mediaFiles.filter((file) => {
      const kind = getMediaKindFromFile(file);
      if (photoFilter !== 'all' && kind !== photoFilter) return false;
      if (!q) return true;
      return getMediaDisplayName(file).toLowerCase().includes(q);
    });
  }, [mediaFiles, query, photoFilter]);

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docFiles;
    return docFiles.filter((file) =>
      (file.name ?? '').toLowerCase().includes(q),
    );
  }, [docFiles, query]);

  const filteredLinks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return links;
    return links.filter(
      (link) =>
        link.host.toLowerCase().includes(q) ||
        link.url.toLowerCase().includes(q),
    );
  }, [links, query]);

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const photoCounts = useMemo(
    () => ({
      all: mediaFiles.length,
      image: mediaFiles.filter((f) => getMediaKindFromFile(f) === 'image').length,
      video: mediaFiles.filter((f) => getMediaKindFromFile(f) === 'video').length,
      audio: mediaFiles.filter((f) => getMediaKindFromFile(f) === 'audio').length,
    }),
    [mediaFiles],
  );

  const totalShared = mediaFiles.length + docFiles.length + links.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:p-4 md:items-center md:justify-end md:pr-6 lg:pr-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shared-content-title"
    >
      <button
        type="button"
        aria-label="Close shared content"
        className={`absolute inset-0 bg-black/55 backdrop-blur-[6px] transition-opacity duration-300 motion-reduce:transition-none ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`relative flex h-[min(760px,calc(100dvh-1.5rem))] w-full max-w-[440px] flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/95 shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          entered
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-6 scale-[0.98] opacity-0 md:translate-y-0 md:translate-x-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-24 bg-[radial-gradient(ellipse_at_top,rgba(1,195,109,0.14),transparent_70%)]" />

        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-border/80 md:hidden" />

        <header className="relative shrink-0 px-4 pb-3 pt-3 sm:px-5 sm:pt-4">
          <div className="mb-3 flex items-start gap-2">
            <button
              type="button"
              onClick={onClose}
              className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border/80 bg-background-alt/60 text-body transition hover:border-green/40 hover:bg-primary/80 hover:text-white"
              aria-label="Close"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1 pt-0.5">
              <h2
                id="shared-content-title"
                className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl"
              >
                Shared content
              </h2>
              <p className="mt-0.5 min-h-5 truncate text-xs text-body-300 sm:text-sm">
                Browse everything shared in this chat
                {totalShared > 0 ? (
                  <span className="text-body-700">
                    {' '}
                    · {totalShared} item{totalShared === 1 ? '' : 's'}
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="relative" role="tablist" aria-label="Shared content categories">
            <div className="absolute inset-x-0 bottom-0 h-px bg-border/45" aria-hidden />
            <span
              className="pointer-events-none absolute bottom-0 z-10 h-0.5 rounded-full bg-gradient-to-r from-green-gradFrom via-green to-green-gradTo transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                left: `${activeIndex * 33.333}%`,
                width: '33.333%',
              }}
              aria-hidden
            />
            <div className="grid grid-cols-3">
            {TABS.map((tab) => {
              const selected = activeTab === tab.id;
              const count =
                tab.id === 'photos'
                  ? mediaFiles.length
                  : tab.id === 'attachments'
                    ? docFiles.length
                    : links.length;
              const TabIcon = tab.Icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setQuery('');
                  }}
                  className={`relative inline-flex h-11 w-full items-center justify-center gap-2 pb-2.5 transition-colors duration-200 ${
                    selected ? 'text-white' : 'text-body-300 hover:text-body-700'
                  }`}
                >
                  <TabIcon
                    className={tabIconClass(selected, tab.strokeOnly)}
                  />
                  <span className="truncate text-xs font-medium leading-none">
                    {tab.label}
                  </span>
                  <span className={countBadgeClass(selected)}>
                    {count}
                  </span>
                </button>
              );
            })}
            </div>
          </div>

          <div className="mt-3 rounded-2xl bg-primary/25 p-2.5 ring-1 ring-inset ring-white/[0.04]">
            <div className="group/search relative flex h-9 items-center gap-2.5 rounded-full border border-[rgba(235,236,236,0.28)] bg-background/80 px-3 shadow-[inset_0_1px_0_rgba(235,236,236,0.08)] transition focus-within:border-[rgba(235,236,236,0.45)] focus-within:bg-background focus-within:shadow-[0_0_18px_rgba(235,236,236,0.07)]">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/80 text-body-300 transition group-focus-within/search:text-green">
                <SearchIcon className="h-3.5 w-3.5" />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Find ${activeMeta.label.toLowerCase()}…`}
                className="min-w-0 flex-1 border-0 bg-transparent py-0 text-sm text-body placeholder:text-body-300/80 outline-none [&::-ms-clear]:hidden [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              />
            </div>

            <div className="mt-2 h-9">
              {activeTab === 'photos' && photoCounts.all > 0 ? (
                <div className="relative flex h-full items-stretch overflow-x-auto rounded-xl bg-black-light/35 p-0.5 scrollbar-hide">
                  {PHOTO_FILTERS.map(({ key, label, Icon, strokeOnly }, index, arr) => {
                    const count = photoCounts[key];
                    if (key !== 'all' && count === 0) return null;
                    const selected = photoFilter === key;
                    const visibleBefore = arr
                      .slice(0, index)
                      .filter(
                        (item) =>
                          item.key === 'all' ||
                          photoCounts[item.key as PhotoFilter] > 0,
                      ).length;
                    const showDivider = visibleBefore > 0;

                    return (
                      <div key={key} className="flex min-w-0 flex-1 items-stretch">
                        {showDivider ? (
                          <span
                            className="my-1.5 w-px shrink-0 bg-border/35"
                            aria-hidden
                          />
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setPhotoFilter(key)}
                          className={`flex min-w-[4.5rem] flex-1 items-center justify-center gap-1.5 rounded-[0.6rem] px-2 py-1 text-[11px] font-medium transition duration-200 ${
                            selected
                              ? 'bg-primary text-white shadow-[0_1px_8px_rgba(0,0,0,0.25)]'
                              : 'text-body-300 hover:text-body-700'
                          }`}
                        >
                          <Icon
                            className={filterIconClass(selected, strokeOnly)}
                          />
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <span className="truncate">{label}</span>
                            <span className={filterCountBadgeClass(selected)}>
                              {count}
                            </span>
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full items-center gap-2 rounded-xl bg-black-light/25 px-3">
                  <span className="h-px flex-1 bg-gradient-line-fade-dark opacity-60" />
                  <span className="shrink-0 text-[11px] text-body-300">
                    {activeMeta.hint}
                  </span>
                  <span className="h-px flex-1 bg-gradient-line-fade-dark opacity-60" />
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="mx-4 h-px shrink-0 bg-border/60 sm:mx-5" />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 scrollbar-hide sm:px-5 sm:py-4">
          {activeTab === 'photos' ? (
            filteredPhotos.length === 0 ? (
              <EmptyState
                className="py-10"
                imageSrc="/images/no-media.svg"
                imageAlt="no media"
                imageClassName="w-20 opacity-45"
                titleClassName="mt-2 text-center text-xs text-body-300"
                title={
                  query || photoFilter !== 'all'
                    ? 'No media matches your filters'
                    : 'No photos or media yet'
                }
              />
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {filteredPhotos.map((file) => {
                  const kind = getMediaKindFromFile(file);
                  return (
                    <button
                      type="button"
                      key={file._id ?? file.publicId ?? file.url}
                      onClick={() => onOpenPhoto(file)}
                      className="group relative overflow-hidden rounded-xl ring-1 ring-border/45 transition hover:ring-green/45 hover:shadow-[0_8px_24px_rgba(1,195,109,0.12)]"
                    >
                      {renderMediaThumbnail(file)}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition group-hover:opacity-100" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 p-1.5 opacity-0 transition group-hover:opacity-100">
                        <span className="truncate text-[10px] font-medium text-white/90">
                          {getMediaDisplayName(file)}
                        </span>
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-black/45 text-white backdrop-blur-sm">
                          <ExpandIcon className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      {kind !== 'image' ? (
                        <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                          {mediaTypeLabel(file)}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )
          ) : null}

          {activeTab === 'attachments' ? (
            filteredDocs.length === 0 ? (
              <EmptyState
                className="py-10"
                imageSrc="/images/no-documents.svg"
                imageAlt="no documents"
                imageClassName="w-20 opacity-45"
                titleClassName="mt-2 text-center text-xs text-body-300"
                title={
                  query ? 'No files match your search' : 'No documents yet'
                }
              />
            ) : (
              <div className="flex flex-col gap-2">
                {filteredDocs.map(({ _id, publicId, name, url }, index) => {
                  const fileExtension = fileFormat(name);
                  const file = fileData.find(
                    (item) => item.docType === fileExtension,
                  );
                  const isPdf = fileExtension === 'pdf';
                  return (
                    <button
                      type="button"
                      key={_id ?? publicId ?? url ?? index}
                      onClick={(e) => onOpenDocument(e, url, name)}
                      className="group flex w-full items-center gap-3 rounded-2xl bg-background-alt/55 px-3 py-3 text-left ring-1 ring-border/45 transition hover:bg-background-alt hover:ring-green/35"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/80 ring-1 ring-border/50">
                        <img src={file?.icon} alt="" className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium capitalize text-body">
                          {name}
                        </span>
                        <span className="mt-0.5 block text-[11px] uppercase tracking-wide text-body-300">
                          {fileExtension || 'file'}
                          {' · '}
                          {isPdf ? 'Open in browser' : 'Download'}
                        </span>
                      </span>
                      <ExternalLinkIcon className="h-4 w-4 shrink-0 text-body-300 transition group-hover:text-green" />
                    </button>
                  );
                })}
              </div>
            )
          ) : null}

          {activeTab === 'links' ? (
            filteredLinks.length === 0 ? (
              <EmptyState
                className="py-10"
                imageSrc="/images/no-link.svg"
                imageAlt="no links"
                imageClassName="w-20 opacity-45"
                titleClassName="mt-2 text-center text-xs text-body-300"
                title={
                  query ? 'No links match your search' : 'No links yet'
                }
              />
            ) : (
              <div className="flex flex-col gap-2">
                {filteredLinks.map((link) => (
                  <div
                    key={`${link.messageId}-${link.url}`}
                    className="flex items-start gap-2 rounded-2xl bg-background-alt/55 p-2.5 ring-1 ring-border/45"
                  >
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-green-dark/70 to-primary ring-1 ring-green/25">
                      <LinkIcon className="h-4 w-4 stroke-green" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-body">
                        {link.host}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-body-300">
                        {link.url}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green/10 px-2.5 py-1.5 text-[11px] font-medium text-green ring-1 ring-green/25 transition hover:bg-green/15"
                        >
                          <ExternalLinkIcon className="h-3.5 w-3.5" />
                          Open
                        </a>
                        <button
                          type="button"
                          onClick={() => copyLink(link.url)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-background-alt px-2.5 py-1.5 text-[11px] font-medium text-body-700 ring-1 ring-border/60 transition hover:text-white"
                        >
                          <CopyIcon className="h-3.5 w-3.5" />
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SharedContentSheet;
