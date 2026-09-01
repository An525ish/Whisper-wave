import { useEffect, useState, type ReactNode } from 'react';
import LinkIcon from '@/components/ui/icons/Link';
import CloseIcon from '@/components/ui/icons/Close';
import { LINK_PREVIEW_WIDTH_CLASS } from '@/constants/chat';
import { useLinkPreviewQuery } from '@/hooks/useLinkPreview';
import type { ParsedLink } from '@/utils/linkParser';

export type LinkPreviewSurface = 'composer' | 'incoming' | 'outgoing';

const thumbBox = 'h-14 w-14 shrink-0 overflow-hidden rounded-md bg-primary/60';

const surfaceClass: Record<LinkPreviewSurface, string> = {
  composer: 'border border-border/70 bg-background-alt shadow-lg',
  incoming: 'bg-[#0d1218]/75',
  outgoing: 'bg-[#0a1612]/70',
};

const skeletonLine = (surface: LinkPreviewSurface, width: string, height = 'h-2.5') =>
  `${height} ${width} animate-pulse rounded ${
    surface === 'composer' ? 'bg-border/40' : 'bg-white/12'
  }`;

const HorizontalSkeleton = ({ surface }: { surface: LinkPreviewSurface }) => (
  <>
    <div className={`${thumbBox} animate-pulse ${surface === 'composer' ? 'bg-border/30' : 'bg-white/10'}`} />
    <div className="min-w-0 flex-1 space-y-1.5 py-0.5">
      <div className={skeletonLine(surface, 'w-3/4', 'h-3')} />
      <div className={skeletonLine(surface, 'w-full')} />
      <div className={skeletonLine(surface, 'w-1/2', 'h-2')} />
    </div>
  </>
);

type LinkPreviewCardProps = {
  link: ParsedLink;
  surface?: LinkPreviewSurface;
  href?: string;
  onDismiss?: () => void;
  lead?: boolean;
  className?: string;
};

const LinkPreviewCard = ({
  link,
  surface = 'composer',
  href,
  onDismiss,
  lead = false,
  className = '',
}: LinkPreviewCardProps) => {
  const { data, isPending } = useLinkPreviewQuery(link.url);
  const [faviconFailed, setFaviconFailed] = useState(false);
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  const title = data?.title ?? link.host;
  const description = data?.description ?? null;
  const ogImage = data?.image ?? null;
  const imageFailed = Boolean(ogImage && failedImageUrl === ogImage);
  const image = ogImage && !imageFailed ? ogImage : null;
  const favicon = !faviconFailed ? (data?.favicon ?? null) : null;

  useEffect(() => {
    if (!ogImage) return;

    let cancelled = false;
    const probe = new Image();
    probe.onload = () => {
      if (!cancelled) setLoadedImageUrl(ogImage);
    };
    probe.onerror = () => {
      if (!cancelled) setFailedImageUrl(ogImage);
    };
    probe.src = ogImage;

    return () => {
      cancelled = true;
      probe.onload = null;
      probe.onerror = null;
    };
  }, [ogImage]);

  const metadataReady = !isPending && Boolean(data);
  const imageSettled =
    !ogImage || loadedImageUrl === ogImage || failedImageUrl === ogImage;
  const showSkeleton = !metadataReady || !imageSettled;

  const shellClass = `${LINK_PREVIEW_WIDTH_CLASS} flex items-center gap-2 overflow-hidden rounded-lg p-2 ${surfaceClass[surface]} ${
    lead ? '' : 'mt-2'
  } ${className}`;

  const inner = showSkeleton ? (
    <HorizontalSkeleton surface={surface} />
  ) : (
    <>
      <div className={`flex items-center justify-center ${thumbBox}`}>
        {image ? (
          <img
            src={image}
            alt=""
            className="h-full w-full object-contain object-center"
          />
        ) : !faviconFailed && favicon ? (
          <img
            src={favicon}
            alt=""
            className="h-7 w-7 rounded object-contain"
            onError={() => setFaviconFailed(true)}
          />
        ) : (
          <LinkIcon className="h-5 w-5 stroke-body-300/60" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium leading-tight text-body">
          {title}
        </p>
        {description ? (
          <p className="mt-0.5 line-clamp-1 text-[11px] leading-tight text-body-300/60">
            {description}
          </p>
        ) : null}
        <p className="mt-0.5 truncate text-[10px] leading-tight text-body-300/40">
          {link.displayUrl}
        </p>
      </div>
    </>
  );

  const dismissBtn = onDismiss ? (
    <button
      type="button"
      onClick={onDismiss}
      aria-label="Dismiss link preview"
      className="grid h-6 w-6 shrink-0 place-items-center self-start rounded-full text-body-300/60 transition hover:bg-primary/60 hover:text-body"
    >
      <CloseIcon className="h-3.5 w-3.5" />
    </button>
  ) : null;

  const content: ReactNode = (
    <>
      {inner}
      {dismissBtn}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`group/link ${shellClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </a>
    );
  }

  return <div className={shellClass}>{content}</div>;
};

export default LinkPreviewCard;
