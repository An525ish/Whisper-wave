import ChatIcon from '@/components/ui/icons/Chat';
import CreateGroupIcon from '@/components/ui/icons/CreateGroup';
import DashboardIcon from '@/components/ui/icons/Dashboard';
import MembersIcon from '@/components/ui/icons/Members';
import Sidebar from '@/components/ui/sidebar/Sidebar';
import SidebarItem from '@/components/ui/sidebar/SidebarItem';
import { Outlet } from 'react-router-dom';

const sidebarItems = Object.freeze([
    {
        id: 'dashboard',
        icon: DashboardIcon,
        text: 'dashboard',
        alert: false
    },
    {
        id: 'users',
        icon: MembersIcon,
        text: 'users',
        alert: false
    },
    {
        id: 'groups',
        icon: CreateGroupIcon,
        text: 'groups',
        alert: false
    },
    {
        id: 'messages',
        icon: ChatIcon,
        text: 'messages',
        alert: false
    },
]);

const AdminWrapper = () => {

    return (
        <div className="flex min-h-dvh">
            <Sidebar>
                {sidebarItems.map(item => (
                    <SidebarItem
                        key={item.id}
                        Icon={item.icon}
                        text={item.text}
                        alert={item.alert}
                    />
                ))}
            </Sidebar>
            <main className="min-h-0 h-dvh w-full overflow-y-auto p-4 scrollbar-hide">
                <Outlet />
            </main>
        </div>
    );
}

export default AdminWrapper;
