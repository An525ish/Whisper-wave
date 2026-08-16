import type { ReactNode } from 'react';
import SidebarFooter from '@/components/ui/sidebar/SidebarFooter';
import SidebarHeader from '@/components/ui/sidebar/SidebarHeader';
import { SIDEBAR_PAD, sidebarAsideClass } from '@/components/ui/sidebar/constants';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar/context';

type SidebarShellProps = {
  children: ReactNode;
};

const SidebarShell = ({ children }: SidebarShellProps) => {
  const { expanded } = useSidebar();

  return (
    <aside className={sidebarAsideClass(expanded)}>
      <SidebarHeader />

      <nav
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain scrollbar-hide"
        aria-label="Admin navigation"
      >
        <ul className={`flex flex-col gap-0.5 ${SIDEBAR_PAD}`}>{children}</ul>
      </nav>

      <SidebarFooter />
    </aside>
  );
};

type SidebarProps = {
  children: ReactNode;
  defaultExpanded?: boolean;
};

const Sidebar = ({ children, defaultExpanded }: SidebarProps) => (
  <SidebarProvider defaultExpanded={defaultExpanded}>
    <SidebarShell>{children}</SidebarShell>
  </SidebarProvider>
);

export default Sidebar;
