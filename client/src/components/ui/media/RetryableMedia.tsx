import {
  useRetryableMediaSrc,
  type RetryableMediaKind,
} from '@/hooks/shared/useRetryableMediaSrc';
import MediaPlaceholder from '@/components/ui/media/MediaPlaceholder';
import {
  useEffect,
  useRef,
  type CSSProperties,
  type ImgHTMLAttributes,
  type VideoHTMLAttributes,
} from 'react';

type RetryableMediaImageProps = {
  url: string;
  alt?: string;
  kind?: RetryableMediaKind;
  transformWidth?: number;
  className?: string;
  fallbackIconClassName?: string;
  failedIllustrationClassName?: string;
  wrapperClassName?: string;
  style?: CSSProperties;
} & Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'alt' | 'className' | 'style' | 'onLoad' | 'onError'
>;

export const RetryableMediaImage = ({
  url,
  alt = '',
  kind = 'image',
  transformWidth,
  className = '',
  fallbackIconClassName = 'h-12 w-12',
  failedIllustrationClassName,
  wrapperClassName = '',
  style,
  ...props
}: RetryableMediaImageProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const {
    src,
    showFallback,
    isLoading,
    isRetrying,
    handleLoad,
    handleError,
  } = useRetryableMediaSrc({ url, kind, transformWidth });

  // If the browser already has the image cached, onLoad won't fire — check immediately.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) handleLoad();
  }, [src, handleLoad]);

  if (showFallback) {
    return (
      <MediaPlaceholder
        kind={kind}
        variant={isRetrying ? 'retrying' : 'failed'}
        className={[wrapperClassName, className].filter(Boolean).join(' ')}
        iconClassName={fallbackIconClassName}
        failedIllustrationClassName={failedIllustrationClassName}
        style={style}
        aria-label={alt || 'Media unavailable'}
      />
    );
  }

  // Shimmer sits absolutely inside this shell. Call sites that pass only
  // object-fit sizing on `className` must put box size (aspect/h/w) on
  // `wrapperClassName`, or absolute inset-0 can climb to a distant relative
  // ancestor (ProfilePanel) and paint the whole column.
  const shellClass = ['relative block overflow-hidden', wrapperClassName]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={shellClass} style={style}>
      {isLoading ? (
        <MediaPlaceholder
          kind={kind}
          variant="loading"
          className="pointer-events-none absolute inset-0 z-0"
          iconClassName={fallbackIconClassName}
          failedIllustrationClassName={failedIllustrationClassName}
          aria-label={alt ? `Loading ${alt}` : 'Loading media'}
        />
      ) : null}
      <img
        {...props}
        ref={imgRef}
        src={src}
        alt={alt}
        className={`relative z-1 ${className} transition-opacity duration-300 motion-reduce:transition-none ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
      />
    </span>
  );
};

type RetryableMediaVideoProps = {
  url: string;
  className?: string;
  fallbackIconClassName?: string;
  failedIllustrationClassName?: string;
  wrapperClassName?: string;
  autoPlay?: boolean;
} & Omit<
  VideoHTMLAttributes<HTMLVideoElement>,
  'src' | 'className' | 'onLoadedData' | 'onError'
>;

export const RetryableMediaVideo = ({
  url,
  className = '',
  fallbackIconClassName = 'h-12 w-12',
  failedIllustrationClassName,
  wrapperClassName = '',
  autoPlay = false,
  muted = true,
  playsInline = true,
  preload = 'metadata',
  controls,
  ...props
}: RetryableMediaVideoProps) => {
  const loaderRef = useRef<HTMLVideoElement>(null);
  const {
    src,
    showFallback,
    isLoading,
    isRetrying,
    handleLoad,
    handleError,
  } = useRetryableMediaSrc({ url, kind: 'video' });

  useEffect(() => {
    const loader = loaderRef.current;
    if (loader && loader.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      handleLoad();
    }
  }, [src, handleLoad]);

  const mergedClass = [wrapperClassName, className].filter(Boolean).join(' ');

  if (showFallback) {
    return (
      <MediaPlaceholder
        kind="video"
        variant={isRetrying ? 'retrying' : 'failed'}
        className={mergedClass}
        iconClassName={fallbackIconClassName}
        failedIllustrationClassName={failedIllustrationClassName}
        aria-label="Video unavailable"
      />
    );
  }

  if (isLoading) {
    return (
      <>
        <MediaPlaceholder
          kind="video"
          variant="loading"
          className={wrapperClassName || className}
          iconClassName={fallbackIconClassName}
        failedIllustrationClassName={failedIllustrationClassName}
          aria-label="Loading video"
        />
        <video
          ref={loaderRef}
          src={src}
          aria-hidden
          className="hidden"
          muted={muted}
          playsInline={playsInline}
          preload={preload}
          onLoadedData={handleLoad}
          onError={handleError}
        />
      </>
    );
  }

  return (
    <video
      {...props}
      src={src}
      className={className}
      muted={muted}
      playsInline={playsInline}
      preload={preload}
      controls={controls}
      autoPlay={autoPlay}
      onLoadedData={handleLoad}
      onError={handleError}
    />
  );
};
