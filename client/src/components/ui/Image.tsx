import { AVATAR_FALLBACK } from '@/constants/app';
import { transformImage } from '@/utils/fileFormat';
import {
  useEffect,
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
  const errorFallback = fallback ?? AVATAR_FALLBACK;

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  const rawSrc = !src || failed ? errorFallback : src;
  const imgSrc = displayWidth ? transformImage(rawSrc, displayWidth) : rawSrc;

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    if (event.currentTarget.src.includes(errorFallback)) return;
    setFailed(true);
    onError?.(event);
  };

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setLoaded(true);
    onLoad?.(event);
  };

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={handleError}
      onLoad={handleLoad}
      className={`object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className ?? ''}`}
    />
  );
};

export default Image;
