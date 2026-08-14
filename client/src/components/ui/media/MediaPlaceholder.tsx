import {
  MEDIA_FALLBACK_ICONS,
  type RetryableMediaKind,
} from '@/hooks/shared/useRetryableMediaSrc';
import type { CSSProperties } from 'react';

type MediaPlaceholderProps = {
  kind: RetryableMediaKind;
  shimmer?: boolean;
  className?: string;
  iconClassName?: string;
  style?: CSSProperties;
  'aria-label'?: string;
};

const MediaPlaceholder = ({
  kind,
  shimmer = true,
  className = '',
  iconClassName = 'h-12 w-12',
  style,
  'aria-label': ariaLabel,
}: MediaPlaceholderProps) => (
  <div
    className={`flex items-center justify-center bg-primary/55 motion-reduce:transition-none ${
      shimmer ? 'media-placeholder-shimmer' : ''
    } ${className}`}
    style={style}
    aria-label={ariaLabel}
    aria-busy={shimmer || undefined}
  >
    <img
      src={MEDIA_FALLBACK_ICONS[kind]}
      alt=""
      className={`relative z-1 opacity-45 motion-reduce:animate-none ${
        shimmer ? 'animate-media-icon-shimmer' : ''
      } ${iconClassName}`}
      aria-hidden
    />
  </div>
);

export default MediaPlaceholder;
