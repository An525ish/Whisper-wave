import { useState } from 'react';
import LinkIcon from '@/components/ui/icons/Link';
import { useLinkPreviewQuery } from '@/hooks/useLinkPreview';
import { getLinkFaviconUrl } from '@/utils/linkParser';

type LinkPreviewThumbProps = {
  url: string;
  className?: string;
  iconClassName?: string;
};

const shellClass = (className: string) =>
  `grid shrink-0 overflow-hidden place-items-center bg-primary/50 ring-1 ring-border/40 ${className}`;

const LinkPreviewThumb = ({
  url,
  className = 'h-8 w-8 rounded-lg',
  iconClassName = 'h-4 w-4 stroke-green',
}: LinkPreviewThumbProps) => {
  const { data, isPending } = useLinkPreviewQuery(url);
  const [imageFailed, setImageFailed] = useState(false);
  const [faviconFailed, setFaviconFailed] = useState(false);

  const ogImage = data?.image && !imageFailed ? data.image : null;
  const favicon =
    !faviconFailed ? (data?.favicon ?? getLinkFaviconUrl(url) ?? null) : null;

  if (isPending) {
    return <span aria-hidden className={`${shellClass(className)} animate-pulse bg-primary/60`} />;
  }

  if (ogImage) {
    return (
      <span className={shellClass(className)}>
        <img
          src={ogImage}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      </span>
    );
  }

  if (favicon) {
    return (
      <span className={`${shellClass(className)} bg-green-dark/60 ring-green/25`}>
        <img
          src={favicon}
          alt=""
          className="h-5 w-5 object-contain"
          onError={() => setFaviconFailed(true)}
        />
      </span>
    );
  }

  return (
    <span className={`${shellClass(className)} bg-green-dark/60 ring-green/25`}>
      <LinkIcon className={iconClassName} />
    </span>
  );
};

export default LinkPreviewThumb;
