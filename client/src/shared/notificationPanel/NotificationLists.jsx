import { FriendRequestNotifyItem, NotificationItem } from "./NotificationItems"

export const NotificationList = ({ notifications = [] }) => {
    return (
        <div>
            {notifications.map((data) => <NotificationItem key={data.id} notification={data} />)}
        </div>
    )
}


export const FriendRequestList = ({ notifications = [] }) => {
    return (
        <div>
            {notifications.map((data) => <FriendRequestNotifyItem key={data.id} notification={data} />)}
        </div>
    )
}
