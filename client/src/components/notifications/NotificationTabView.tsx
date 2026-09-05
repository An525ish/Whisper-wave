import TabView from '@/components/ui/swipeable-tabs/TabView';
import { FriendRequestList, NotificationList } from '@/components/notifications/NotificationList';
import { useNotificationsStore } from '@/stores/notifications';
import { useGetMyNotificationsQuery } from '@/hooks/chat';
import { useMemo } from 'react';
import type { TabItem } from '@/components/ui/swipeable-tabs/Tab';
import ChatIcon from '@/components/ui/icons/Chat';
import AddMemberIcon from '@/components/ui/icons/AddMember';

const NotificationTabView = () => {
  const messageNotificationCount = useNotificationsStore(
    (s) => s.messageNotificationCount,
  );

  // Derive request count from the live query (cached — no extra network hit).
  // Reading from the store is unreliable here because FriendRequestList resets
  // requestNotificationCount to 0 on mount, so the tab badge would always show 0.
  const { data: notifData } = useGetMyNotificationsQuery();
  const requestCount = (notifData as { data?: unknown[] } | undefined)?.data?.length ?? 0;

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
        count: requestCount,
      },
    ],
    [messageNotificationCount, requestCount],
  );

  return (
    <TabView tabsData={tabsData} variant="pills" ariaLabel="Notification types">
      <NotificationList />
      <FriendRequestList />
    </TabView>
  );
};

export default NotificationTabView;
