import { ADMIN_NAV_ITEMS } from '@/components/ui/sidebar/adminNavItems';
import Sidebar from '@/components/ui/sidebar/Sidebar';
import SidebarItem from '@/components/ui/sidebar/SidebarItem';
import { Outlet } from 'react-router-dom';

const AdminWrapper = () => (
  <div className="flex h-dvh overflow-hidden bg-background">
    <Sidebar>
      {ADMIN_NAV_ITEMS.map((item) => (
        <SidebarItem
          key={item.id}
          to={item.to}
          label={item.label}
          icon={item.icon}
        />
      ))}
    </Sidebar>

    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="auth-ambience pointer-events-none absolute inset-0" aria-hidden>
        <div className="auth-ambience__mesh opacity-15" />
        <div className="auth-ambience__glow auth-ambience__glow--a opacity-60" />
        <div className="auth-ambience__glow auth-ambience__glow--b opacity-80" />
      </div>

      <main className="relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain px-6 py-6 scrollbar-hide lg:px-8 lg:py-7">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AdminWrapper;
