import TabView from '@/components/ui/swipable-tabs/TabView';
import { FriendRequestList, NotificationList } from './NotificationLists';
import { useNotificationsStore } from '@/stores/notifications';

const tabsData = Object.freeze({
  0: {
    id: 'notification',
    name: 'Notifications',
    badge: false,
  },
  1: {
    id: 'friendrequest',
    name: 'Friend Requests',
    badge: false,
  },
});

const NotificationTabView = () => {
  const messageNotificationCount = useNotificationsStore(
    (s) => s.messageNotificationCount,
  );
  const requestNotificationCount = useNotificationsStore(
    (s) => s.requestNotificationCount,
  );

  tabsData[0].badge = Boolean(messageNotificationCount);
  tabsData[1].badge = Boolean(requestNotificationCount);

  return (
    <>
      <TabView tabsData={tabsData}>
        {(activeTabIndex: number) =>
          Object.values(tabsData).map((tab) => {
            if (activeTabIndex == 0)
              return <NotificationList key={tab.id} />;
            if (activeTabIndex == 1)
              return <FriendRequestList key={tab.id} />;
            return null;
          })
        }
      </TabView>
    </>
  );
};

export default NotificationTabView;
