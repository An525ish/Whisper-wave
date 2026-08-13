import TabView from '@/components/ui/swipable-tabs/TabView';
import { FriendRequestList, NotificationList } from './NotificationLists';
import { useNotificationsStore } from '@/stores/notifications';
import { useMemo } from 'react';
import type { TabItem } from '@/components/ui/swipable-tabs/Tab';

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
        badge: messageNotificationCount > 0,
      },
      {
        id: 'friendrequest',
        name: 'Requests',
        badge: requestNotificationCount > 0,
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
