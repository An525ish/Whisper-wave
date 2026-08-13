import {
  fileData,
  fileFormat,
  type FileFormatKind,
} from '@/shared/utils/fileFormat';
import CircularLoader from '@/shared/components/ui/loaders/CircularLoader';
import {
  RetryableMediaImage,
  RetryableMediaVideo,
} from '@/shared/components/media/RetryableMedia';
import ImageViewerIcon from '@/shared/components/image-viewer/ImageViewerIcons';
import type { MouseEvent, ReactNode } from 'react';

type RenderAttachmentsProps = {
  fileType: FileFormatKind | string;
  url: string;
  name?: string;
  type?: string;
  size?: number;
  isUploading?: boolean;
  overlay?: ReactNode;
  /** Stretch tile to parent width (multi-attachment grid). */
  fill?: boolean;
  onDownload?: (e: MouseEvent) => void;
};

type RenderFileProps = {
  fileExtension: string;
  fileName?: string;
  size?: number;
  overlay?: ReactNode;
  fill?: boolean;
  onDownload?: (e: MouseEvent) => void;
};

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const tileClass = (fill?: boolean) =>
  `relative aspect-[4/3] overflow-hidden rounded-[1rem] bg-[#0c1014] ${
    fill ? 'w-full' : 'w-[14.5rem] max-w-full'
  }`;

const mediaFillClass = 'absolute inset-0 h-full w-full object-cover';

const PlayBadge = () => (
  <span
    className="pointer-events-none absolute inset-0 z-[1] grid place-items-center"
    aria-hidden
  >
    <span className="grid h-11 w-11 place-items-center rounded-full bg-black/55 ring-1 ring-white/25 backdrop-blur-sm">
      <svg viewBox="0 0 20 20" className="ml-0.5 h-5 w-5 fill-white" aria-hidden>
        <path d="M6.5 4.5v11l9-5.5-9-5.5Z" />
      </svg>
    </span>
  </span>
);

const BottomFade = ({ children }: { children?: ReactNode }) => (
  <>
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-14 bg-gradient-to-t from-black/65 via-black/25 to-transparent"
      aria-hidden
    />
    {children}
  </>
);

const DownloadButton = ({
  onDownload,
  className = '',
}: {
  onDownload?: (e: MouseEvent) => void;
  className?: string;
}) => {
  if (!onDownload) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDownload(e);
      }}
      className={`grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-black/55 text-white shadow-sm backdrop-blur-sm transition hover:bg-black/70 hover:text-green ${className}`}
      aria-label="Download"
    >
      <ImageViewerIcon name="download" className="h-4 w-4 fill-current" />
    </button>
  );
};

const RenderAttachments = ({
  fileType,
  url,
  name,
  type,
  size,
  isUploading,
  overlay,
  fill = false,
  onDownload,
}: RenderAttachmentsProps) => {
  const isImage = type?.startsWith('image/') || fileType === 'image';
  const isVideo = type?.startsWith('video/') || fileType === 'video';
  const isAudio = type?.startsWith('audio/') || fileType === 'audio';
  const fileExtension = fileFormat(name);

  const withTile = (media: ReactNode, opts?: { play?: boolean }) => (
    <div className={tileClass(fill)}>
      {media}
      {opts?.play ? <PlayBadge /> : null}
      {isUploading ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
          <CircularLoader />
        </div>
      ) : null}
      <BottomFade>{overlay}</BottomFade>
    </div>
  );

  if (isImage) {
    return withTile(
      <RetryableMediaImage
        url={url}
        alt={name || 'attachment'}
        transformWidth={320}
        className={`${mediaFillClass} transition-opacity duration-300`}
        wrapperClassName={mediaFillClass}
        fallbackIconClassName="h-14 w-14"
      />,
    );
  }

  if (isVideo) {
    return withTile(
      <RetryableMediaVideo
        url={url}
        muted
        playsInline
        preload="metadata"
        className={mediaFillClass}
        wrapperClassName={mediaFillClass}
        fallbackIconClassName="h-14 w-14"
      />,
      { play: true },
    );
  }

  if (isAudio) {
    return (
      <div
        className={`relative max-w-full overflow-hidden rounded-[1rem] border border-white/10 bg-black/25 px-2.5 py-2.5 ${
          fill ? 'w-full' : 'w-[14.5rem]'
        }`}
      >
        <div className="mb-1.5 flex items-center gap-2 px-0.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-green/20 text-green">
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden>
              <path d="M10 2.5a1 1 0 0 1 1 1V10a1 1 0 1 1-2 0V3.5a1 1 0 0 1 1-1Zm0 12.25a3.75 3.75 0 0 0 3.75-3.75h1.5A5.25 5.25 0 0 1 4.75 11h1.5A3.75 3.75 0 0 0 10 14.75Z" />
            </svg>
          </span>
          <p className="min-w-0 flex-1 truncate text-xs font-medium text-body">
            {name || 'Audio'}
          </p>
        </div>
        <audio
          src={url}
          preload="none"
          controls
          className="w-full max-w-full"
        />
        {isUploading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
            <CircularLoader />
          </div>
        ) : null}
        {overlay ? (
          <div className="pointer-events-none absolute bottom-1.5 right-1.5 z-10">
            {overlay}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <RenderFile
      fileExtension={fileExtension}
      fileName={name}
      size={size}
      overlay={overlay}
      fill={fill}
      onDownload={isUploading ? undefined : onDownload}
    />
  );
};

const RenderFile = ({
  fileExtension,
  fileName,
  size,
  overlay,
  fill = false,
  onDownload,
}: RenderFileProps) => {
  const fileDetails = fileData.find((file) => file.docType === fileExtension);
  const sizeLabel = formatBytes(size);
  const ext =
    fileExtension && fileExtension !== 'unknown'
      ? fileExtension.toUpperCase()
      : 'FILE';

  return (
    <div
      className={`relative flex max-w-full items-center gap-2 overflow-hidden rounded-[1rem] border border-white/10 bg-black/20 px-2.5 py-2.5 ${
        fill ? 'w-full' : 'w-[14.5rem]'
      }`}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-background-alt/70 ring-1 ring-white/10">
        <img
          src={fileDetails?.icon}
          alt=""
          className="h-7 w-7 object-contain"
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-body">
          {fileName || 'Document'}
        </p>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-body-300">
          <span className="rounded bg-white/8 px-1 py-px font-semibold tracking-wide text-body-700">
            {ext}
          </span>
          {sizeLabel ? <span className="truncate">{sizeLabel}</span> : null}
          {overlay ? <span className="ml-auto shrink-0">{overlay}</span> : null}
        </div>
      </div>
      <DownloadButton
        onDownload={onDownload}
        className="relative shrink-0 border-white/10 bg-background-alt/70"
      />
    </div>
  );
};

export default RenderAttachments;
