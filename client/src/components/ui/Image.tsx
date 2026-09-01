import { AVATAR_FALLBACK, AVATAR_LOADING } from '@/constants/app';
import { transformImage } from '@/utils/fileFormat';
import {
  getAvatarImageState,
  markAvatarImageFailed,
  markAvatarImageLoaded,
} from '@/utils/avatarImageState';
import {
  useLayoutEffect,
  useState,
  type ImgHTMLAttributes,
  type SyntheticEvent,
} from 'react';

type ImageProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  /**
   * CSS display width in px at 1× (e.g. 96 for a 48px avatar slot).
   * When provided and the src is a Cloudinary URL, the image is resized and
   * transcoded to WebP/AVIF automatically via Cloudinary transformations.
   * Leave undefined to pass the URL through unchanged (e.g. external URLs).
   */
  displayWidth?: number;
  /** Override the broken-image fallback (default: avatar placeholder). Use
   *  '/icons/picture-icon.svg' for image attachments. */
  fallback?: string;
  /** Avatar shimmer while loading. Off for virtualized lists (e.g. chat list). */
  showLoading?: boolean;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'className'>;

const resolveImgSrc = (
  src: string | null | undefined,
  failed: boolean,
  errorFallback: string,
  displayWidth?: number,
): string => {
  const rawSrc = !src || failed ? errorFallback : src;
  return displayWidth ? transformImage(rawSrc, displayWidth) : rawSrc;
};

/** True when the browser already has this URL in its image cache. */
const isImageCached = (url: string): boolean => {
  if (!url) return false;
  const probe = document.createElement('img');
  probe.src = url;
  return probe.complete && probe.naturalWidth > 0;
};

const initialAvatarFlags = (
  src: string | null | undefined,
  errorFallback: string,
  displayWidth?: number,
) => {
  if (!src) return { failed: false, loaded: false };
  const resolved = resolveImgSrc(src, false, errorFallback, displayWidth);
  const persisted = getAvatarImageState(resolved);
  if (persisted === 'failed') return { failed: true, loaded: false };
  if (persisted === 'loaded' || isImageCached(resolved)) {
    return { failed: false, loaded: true };
  }
  return { failed: false, loaded: false };
};

const Image = ({
  src,
  alt,
  className,
  displayWidth,
  fallback,
  showLoading = true,
  onError,
  onLoad,
  ...props
}: ImageProps) => {
  const errorFallback = fallback ?? AVATAR_FALLBACK;
  const isAvatarMode = errorFallback === AVATAR_FALLBACK;
  const [failed, setFailed] = useState(() =>
    isAvatarMode ? initialAvatarFlags(src, errorFallback, displayWidth).failed : false,
  );
  const [loaded, setLoaded] = useState(() =>
    isAvatarMode ? initialAvatarFlags(src, errorFallback, displayWidth).loaded : false,
  );
  const [prevSrc, setPrevSrc] = useState(src);

  if (src !== prevSrc) {
    setPrevSrc(src);
    const next = isAvatarMode
      ? initialAvatarFlags(src, errorFallback, displayWidth)
      : { failed: false, loaded: false };
    setFailed(next.failed);
    setLoaded(next.loaded);
  }

  const imgSrc = resolveImgSrc(src, failed, errorFallback, displayWidth);
  const attemptedSrc = src ? resolveImgSrc(src, false, errorFallback, displayWidth) : '';

  useLayoutEffect(() => {
    if (!src || failed || loaded) return;
    if (getAvatarImageState(attemptedSrc) === 'loaded' || isImageCached(attemptedSrc)) {
      setLoaded(true);
    }
  }, [src, attemptedSrc, failed, loaded]);

  const showAvatarLoading =
    isAvatarMode && showLoading && Boolean(src) && !failed && !loaded;
  const imgVisible =
    !isAvatarMode || !showLoading || loaded || failed || !src;

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    if (event.currentTarget.src.includes(errorFallback)) return;
    if (isAvatarMode && attemptedSrc) markAvatarImageFailed(attemptedSrc);
    setFailed(true);
    onError?.(event);
  };

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (isAvatarMode && attemptedSrc && !failed) markAvatarImageLoaded(attemptedSrc);
    setLoaded(true);
    onLoad?.(event);
  };

  const img = (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      loading={isAvatarMode && !showLoading ? 'eager' : 'lazy'}
      decoding="async"
      onError={handleError}
      onLoad={handleLoad}
      className={`object-cover transition-opacity duration-300 ${
        imgVisible ? 'opacity-100' : 'opacity-0'
      } ${isAvatarMode ? 'relative z-1 h-full w-full' : ''} ${className ?? ''}`}
    />
  );

  if (!isAvatarMode) return img;

  return (
    <span className={`relative inline-block overflow-hidden ${className ?? ''}`}>
      {showAvatarLoading ? (
        <span className="absolute inset-0 bg-border/15" aria-hidden aria-busy>
          <img
            src={AVATAR_LOADING}
            alt=""
            className="h-full w-full object-cover animate-pulse motion-reduce:animate-none"
          />
        </span>
      ) : null}
      {img}
    </span>
  );
};

export default Image;
