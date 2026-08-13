import TabView from '@/shared/components/ui/swipeable-tabs/TabView';
import { FriendRequestList, NotificationList } from './NotificationList';
import { useNotificationsStore } from '@/features/notifications/store';
import { useMemo } from 'react';
import type { TabItem } from '@/shared/components/ui/swipeable-tabs/Tab';
import ChatIcon from '@/shared/components/icons/Chat';
import AddMemberIcon from '@/shared/components/icons/AddMember';

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
