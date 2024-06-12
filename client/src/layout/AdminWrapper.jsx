import ChatIcon from '@/components/icons/Chat';
import CreateGroupIcon from '@/components/icons/CreateGroup';
import DashboardIcon from '@/components/icons/Dashboard';
import MembersIcon from '@/components/icons/Members';
import Sidebar from '@/components/sidebar/Sidebar';
import SidebarItem from '@/components/sidebar/SidebarItem';

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

const AdminWrapper = ({ children }) => {

    return (
        <div className='flex'>
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
            <main className='p-4'>
                {children}
            </main>
        </div>
    );
}

export default AdminWrapper;
