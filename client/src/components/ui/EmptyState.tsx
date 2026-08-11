import type { ReactNode } from 'react';

type EmptyStateProps = {
  imageSrc?: string;
  imageAlt?: string;
  title: string;
  className?: string;
  imageClassName?: string;
  titleClassName?: string;
  icon?: ReactNode;
};

const EmptyState = ({
  imageSrc,
  imageAlt = '',
  title,
  className = '',
  imageClassName = 'w-20 mx-auto opacity-50',
  titleClassName = 'text-center text-body-300 text-sm mt-3 font-medium',
  icon,
}: EmptyStateProps) => (
  <div className={`grid place-items-center w-full py-6 ${className}`.trim()}>
    {icon}
    {imageSrc ? (
      <img src={imageSrc} alt={imageAlt} className={imageClassName} />
    ) : null}
    <p className={titleClassName}>{title}</p>
  </div>
);

export default EmptyState;
