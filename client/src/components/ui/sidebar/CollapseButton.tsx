import ChevronLeft from '@/components/ui/icons/ChevronLeft';

type CollapseButtonProps = {
  expanded: boolean;
  onClick: () => void;
  className?: string;
};

const collapseBase =
  'shrink-0 filter-none outline-none [-webkit-tap-highlight-color:transparent] hover:filter-none active:filter-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue/30';

const CollapseButton = ({
  expanded,
  onClick,
  className = '',
}: CollapseButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={
      expanded
        ? `flex h-8 w-8 items-center justify-center rounded-lg text-body-300 transition-colors duration-200 hover:bg-primary/40 hover:text-blue active:bg-primary/50 ${collapseBase} ${className}`
        : `inline-flex items-center justify-center p-0 text-body-300 transition-colors duration-200 hover:text-blue active:text-blue ${collapseBase} ${className}`
    }
    aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
  >
    <ChevronLeft
      aria-hidden
      className={`h-3.5 w-3.5 transition-transform duration-300 ${expanded ? '' : 'rotate-180'}`}
    />
  </button>
);

export default CollapseButton;
