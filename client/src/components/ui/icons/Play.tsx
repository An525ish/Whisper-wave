import type { IconProps } from '@/types';

const PlayIcon = ({ className, ...props }: IconProps) => (
  <svg
    {...props}
    className={className ?? 'h-8 w-8'}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M8 5.14v14l11-7-11-7z" />
  </svg>
);

export default PlayIcon;
