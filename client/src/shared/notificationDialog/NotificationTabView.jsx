import TabView from '@/components/ui/swipable-tabs/TabView';
import { FriendRequestList, NotificationList } from './NotificationLists';
import { useSelector } from 'react-redux';

const tabsData = Object.freeze({
    0: {
        id: 'notification',
        name: 'Notifications',
        badge: false
    },
    1: {
        id: 'friendrequest',
        name: 'Friend Requests',
        badge: false
    },
});

const NotificationTabView = () => {

    const {
        messageNotificationCount,
        requestNotificationCount
    } = useSelector(state => state.chat)

    console.log(messageNotificationCount, requestNotificationCount)

    tabsData[0].badge = Boolean(messageNotificationCount)
    tabsData[1].badge = Boolean(requestNotificationCount)


    return (
        <>
            <TabView tabsData={tabsData}>
                {(activeTabIndex) => (
                    Object.values(tabsData).map((tab) => {
                        if (activeTabIndex == 0) return <NotificationList key={tab.id} />
                        if (activeTabIndex == 1) return <FriendRequestList key={tab.id} />
                    })
                )}
            </TabView>
        </>
    )
}

export default NotificationTabView
