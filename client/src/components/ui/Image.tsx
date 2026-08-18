import { AVATAR_FALLBACK, AVATAR_LOADING } from '@/constants/app';
import { transformImage } from '@/utils/fileFormat';
import {
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
} & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'className'>;

const Image = ({ src, alt, className, displayWidth, fallback, onError, onLoad, ...props }: ImageProps) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);
  const errorFallback = fallback ?? AVATAR_FALLBACK;
  const isAvatarMode = errorFallback === AVATAR_FALLBACK;

  if (src !== prevSrc) {
    setPrevSrc(src);
    setFailed(false);
    setLoaded(false);
  }

  const rawSrc = !src || failed ? errorFallback : src;
  const imgSrc = displayWidth ? transformImage(rawSrc, displayWidth) : rawSrc;
  const showAvatarLoading = isAvatarMode && Boolean(src) && !failed && !loaded;
  const imgVisible = !isAvatarMode || loaded || failed || !src;

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    if (event.currentTarget.src.includes(errorFallback)) return;
    setFailed(true);
    onError?.(event);
  };

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setLoaded(true);
    onLoad?.(event);
  };

  const img = (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      loading="lazy"
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
