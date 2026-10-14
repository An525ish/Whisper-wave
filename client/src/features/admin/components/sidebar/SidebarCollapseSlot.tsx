import type { ReactNode } from 'react';
import { collapseTextClass } from './constants';
import { useSidebar } from './context';

type Props = {
  children: ReactNode;
  className?: string;
};

/** Text region that animates out when the sidebar collapses */
const SidebarCollapseSlot = ({
  children,
  className = '',
}: Props) => {
  const { expanded } = useSidebar();

  return (
    <div
      className={`${collapseTextClass(expanded)} ${className}`}
      aria-hidden={!expanded}
    >
      {children}
    </div>
  );
};

export default SidebarCollapseSlot;
