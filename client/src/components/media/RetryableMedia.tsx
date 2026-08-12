import {
  useRetryableMediaSrc,
  type RetryableMediaKind,
} from '@/hooks/useRetryableMediaSrc';
import MediaPlaceholder from '@/components/media/MediaPlaceholder';
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
  wrapperClassName = '',
  style,
  ...props
}: RetryableMediaImageProps) => {
  const loaderRef = useRef<HTMLImageElement>(null);
  const {
    src,
    showFallback,
    isLoading,
    isRetrying,
    handleLoad,
    handleError,
  } = useRetryableMediaSrc({ url, kind, transformWidth });

  useEffect(() => {
    const loader = loaderRef.current;
    if (loader?.complete && loader.naturalWidth > 0) {
      handleLoad();
    }
  }, [src, handleLoad]);

  if (showFallback) {
    return (
      <MediaPlaceholder
        kind={kind}
        shimmer={isRetrying}
        className={[wrapperClassName, className].filter(Boolean).join(' ')}
        iconClassName={fallbackIconClassName}
        style={style}
        aria-label={alt || 'Media unavailable'}
      />
    );
  }

  if (isLoading) {
    return (
      <>
        <MediaPlaceholder
          kind={kind}
          shimmer
          className={wrapperClassName || className}
          iconClassName={fallbackIconClassName}
          style={style}
          aria-label={alt ? `Loading ${alt}` : 'Loading media'}
        />
        <img
          ref={loaderRef}
          src={src}
          alt=""
          aria-hidden
          className="hidden"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
        />
      </>
    );
  }

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      className={className}
      style={style}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};

type RetryableMediaVideoProps = {
  url: string;
  className?: string;
  fallbackIconClassName?: string;
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
        shimmer={isRetrying}
        className={mergedClass}
        iconClassName={fallbackIconClassName}
        aria-label="Video unavailable"
      />
    );
  }

  if (isLoading) {
    return (
      <>
        <MediaPlaceholder
          kind="video"
          shimmer
          className={wrapperClassName || className}
          iconClassName={fallbackIconClassName}
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
