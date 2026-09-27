import type { ReactNode } from 'react';

type EmptyStateProps = {
  imageSrc?: string;
  imageAlt?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  imageClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  contentClassName?: string;
  icon?: ReactNode;
};

const EmptyState = ({
  imageSrc,
  imageAlt = '',
  title,
  description,
  action,
  className = '',
  imageClassName = 'w-20 opacity-50',
  titleClassName = 'mt-3 text-center text-sm font-medium text-body-300',
  descriptionClassName = 'mt-1.5 text-center text-xs leading-relaxed text-body-300/75',
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
      {description ? (
        <p className={descriptionClassName}>{description}</p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  </div>
);

export default EmptyState;
