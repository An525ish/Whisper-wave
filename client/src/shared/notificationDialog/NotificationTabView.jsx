import TabView from '@/components/ui/swipable-tabs/TabView';
import { FriendRequestList, NotificationList } from './NotificationLists';
import { notifications } from '@/lib/samples';

const tabsData = Object.freeze({
    0: {
        id: 'notification',
        name: 'Notifications',
    },
    1: {
        id: 'friendrequest',
        name: 'Friend Requests',
    },
});

const NotificationTabView = () => {

    const normalNotifications = notifications.filter((item) => !item.friendRequest)
    const frienndRequestNotifications = notifications.filter((item) => item.friendRequest)

    return (
        <>
            <TabView tabsData={tabsData}>
                {(activeTabIndex) => (
                    Object.values(tabsData).map((tab) => {
                        if (activeTabIndex == 0) return <NotificationList key={tab.id} notifications={normalNotifications} />
                        if (activeTabIndex == 1) return <FriendRequestList key={tab.id} notifications={frienndRequestNotifications} />
                    })
                )}
            </TabView>
        </>
    )
}

export default NotificationTabView
