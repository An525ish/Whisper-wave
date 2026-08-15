import { AVATAR_FALLBACK } from '@/constants/app';
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
} & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'className'>;

const Image = ({ src, alt, className, onError, ...props }: ImageProps) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const imgSrc = !src || failed ? AVATAR_FALLBACK : src;

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    // Avoid retry loop if the fallback itself fails
    if (event.currentTarget.src.includes(AVATAR_FALLBACK)) return;
    setFailed(true);
    onError?.(event);
  };

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={handleError}
      className={`object-cover ${className ?? ''}`}
    />
  );
};

export default Image;
