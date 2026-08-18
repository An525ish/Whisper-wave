import {
  MEDIA_FAILED_ILLUSTRATIONS,
  MEDIA_FALLBACK_ICONS,
  type MediaPlaceholderVariant,
  type RetryableMediaKind,
} from '@/hooks/shared/useRetryableMediaSrc';
import type { CSSProperties } from 'react';

type MediaPlaceholderProps = {
  kind: RetryableMediaKind;
  variant?: MediaPlaceholderVariant;
  className?: string;
  iconClassName?: string;
  failedIllustrationClassName?: string;
  style?: CSSProperties;
  'aria-label'?: string;
};

const MediaPlaceholder = ({
  kind,
  variant = 'loading',
  className = '',
  iconClassName = 'h-12 w-12',
  failedIllustrationClassName = 'h-14 w-14 opacity-45',
  style,
  'aria-label': ariaLabel,
}: MediaPlaceholderProps) => {
  const shimmer = variant === 'loading' || variant === 'retrying';
  const failed = variant === 'failed';

  return (
    <div
      className={`flex items-center justify-center bg-primary/55 motion-reduce:transition-none ${
        shimmer ? 'media-placeholder-shimmer' : ''
      } ${className}`}
      style={style}
      aria-label={ariaLabel}
      aria-busy={shimmer || undefined}
    >
      {failed ? (
        <img
          src={MEDIA_FAILED_ILLUSTRATIONS[kind]}
          alt=""
          className={`relative z-1 ${failedIllustrationClassName}`}
          aria-hidden
        />
      ) : (
        <img
          src={MEDIA_FALLBACK_ICONS[kind]}
          alt=""
          className={`relative z-1 opacity-45 motion-reduce:animate-none ${
            shimmer ? 'animate-media-icon-shimmer' : ''
          } ${iconClassName}`}
          aria-hidden
        />
      )}
    </div>
  );
};

export default MediaPlaceholder;
