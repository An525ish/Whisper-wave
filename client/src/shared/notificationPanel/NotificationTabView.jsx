import { useParams } from 'react-router-dom';
import ChatList from '@/shared/chatPanel/ChatList';
import TabView from '@/components/ui/swipable-tabs/TabView';
import { NotificationItem } from './NotificationItems';
import { FriendRequestList, NotificationList } from './NotificationLists';

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

const notifications = [
    {
        _id: "1",
        sender: {
            avatar: ["https://www.gravatar.com/avatar/2c7d99fe281ecd3bcd65ab915bac6dd5?s=250"],
            name: "John Doe",
        },
        friendRequest: false,
        newMessageAlert: {
            id: '1',
            count: 4
        }
    },
    {
        _id: "2",
        sender: {
            avatar: ["https://avatar.iran.liara.run/public/boy?username=Ash"],
            name: "John Boi",
        },
        friendRequest: true,
        newMessageAlert: {
            id: '1',
            count: 4
        }
    },
    {
        _id: "3",
        sender: {
            avatar: ["https://i.pravatar.cc/250?u=mail@ashallendesign.co.uk",
                // "https://avatar.iran.liara.run/public/boy?username=Ash",
                // "https://www.gravatar.com/avatar/2c7d99fe281ecd3bcd65ab915bac6dd5?s=250",
                // "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=mail@ashallendesign.co.uk",
            ],
            name: "John Group",
        },
        friendRequest: false,
        newMessageAlert: {
            id: '1',
            count: 4
        }
    },
]

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
