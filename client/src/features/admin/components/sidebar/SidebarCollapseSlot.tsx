import type { ReactNode } from 'react';
import { collapseTextClass } from '@/features/admin/components/sidebar/constants';
import { useSidebar } from '@/features/admin/components/sidebar/context';

type SidebarCollapseSlotProps = {
  children: ReactNode;
  className?: string;
};

/** Text region that animates out when the sidebar collapses */
const SidebarCollapseSlot = ({
  children,
  className = '',
}: SidebarCollapseSlotProps) => {
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
