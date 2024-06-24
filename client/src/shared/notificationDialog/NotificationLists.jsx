import { useGetMyNotificationsQuery } from "@/redux/reducers/apis/api"
import { FriendRequestNotifyItem, NotificationItem } from "./NotificationItems"
import useErrors from "@/hooks/error"

export const NotificationList = ({ notifications = [] }) => {
    return (
        <div>
            {notifications.map((data) => <NotificationItem key={data.id} notification={data} />)}
        </div>
    )
}


export const FriendRequestList = () => {

    const { data: notifications, isLoading, isError, error } = useGetMyNotificationsQuery()
    const notificationData = notifications?.data

    useErrors([{ error, isError }]);

    return (
        isLoading ?
            <> Fetching Your friend request notifications</>
            :
            <div>
                {notificationData.length === 0 ?
                    <div className="grid place-items-center h-[60vh]">
                        <div>
                            <img src="/images/no-request.svg" className="w-4/5 mx-auto" alt="request" />
                            <p className="mt-8 text-center font-medium text-xl">No new Request</p>
                        </div>
                    </div>
                    :
                    notificationData?.map((data) =>
                        <FriendRequestNotifyItem key={data.id} notification={data} />
                    )
                }
            </div>
    )
}
