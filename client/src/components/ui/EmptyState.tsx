import type { ReactNode } from 'react';

type EmptyStateProps = {
  imageSrc?: string;
  imageAlt?: string;
  title: string;
  className?: string;
  imageClassName?: string;
  titleClassName?: string;
  contentClassName?: string;
  icon?: ReactNode;
};

const EmptyState = ({
  imageSrc,
  imageAlt = '',
  title,
  className = '',
  imageClassName = 'w-20 opacity-50',
  titleClassName = 'mt-3 text-center text-sm font-medium text-body-300',
  contentClassName = 'max-w-xs',
  icon,
}: EmptyStateProps) => (
  <div
    className={`flex w-full flex-col items-center justify-center py-6 ${className}`.trim()}
  >
    <div className={`flex w-full flex-col items-center ${contentClassName}`}>
      {icon}
      {imageSrc ? (
        <img src={imageSrc} alt={imageAlt} className={imageClassName} />
      ) : null}
      <p className={titleClassName}>{title}</p>
    </div>
  </div>
);

export default EmptyState;
