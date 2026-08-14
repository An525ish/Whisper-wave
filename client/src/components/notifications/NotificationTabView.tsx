import TabView from '@/components/ui/swipeable-tabs/TabView';
import { FriendRequestList, NotificationList } from '@/components/notifications/NotificationList';
import { useNotificationsStore } from '@/stores/notifications';
import { useMemo } from 'react';
import type { TabItem } from '@/components/ui/swipeable-tabs/Tab';
import ChatIcon from '@/components/ui/icons/Chat';
import AddMemberIcon from '@/components/ui/icons/AddMember';

const NotificationTabView = () => {
  const messageNotificationCount = useNotificationsStore(
    (s) => s.messageNotificationCount,
  );
  const requestNotificationCount = useNotificationsStore(
    (s) => s.requestNotificationCount,
  );

  const tabsData = useMemo<TabItem[]>(
    () => [
      {
        id: 'notification',
        name: 'Messages',
        icon: <ChatIcon className="h-4 w-4" />,
        count: messageNotificationCount,
      },
      {
        id: 'friendrequest',
        name: 'Requests',
        icon: <AddMemberIcon className="h-4 w-4" />,
        count: requestNotificationCount,
      },
    ],
    [messageNotificationCount, requestNotificationCount],
  );

  return (
    <TabView tabsData={tabsData}>
      <NotificationList />
      <FriendRequestList />
    </TabView>
  );
};

export default NotificationTabView;
