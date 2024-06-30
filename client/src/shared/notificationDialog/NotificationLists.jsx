import useErrors from "@/hooks/error"
import { useFindChatsMutation, useGetMyNotificationsQuery } from "@/redux/reducers/apis/api"
import { useEffect, useMemo, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { FriendRequestNotifyItem, NotificationItem } from "./NotificationItems"
import { resetMessageNotification, resetRequestNotification } from "@/redux/reducers/chat"

export const NotificationList = () => {
    const { messageNotifications } = useSelector(state => state.chat)
    const userIds = useMemo(() => messageNotifications.map((el) => el.chatId), [messageNotifications])

    const [findChats, { isLoading, error }] = useFindChatsMutation()
    const [msgNotificationsList, setMsgNotificationsList] = useState([])
    console.log(msgNotificationsList)
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(resetMessageNotification())
    }, [])

    useEffect(() => {
        const handleFindChats = async () => {
            if (userIds.length > 0) {
                try {
                    const result = await findChats({
                        userIds,
                        notifications: messageNotifications
                    }).unwrap();
                    setMsgNotificationsList(result.chats);
                } catch (error) {
                    console.error('Error finding chats:', error);
                }
            }
        };

        handleFindChats();
    }, [userIds, messageNotifications, findChats]);

    useErrors([{ error, isLoading }]);

    if (isLoading) return <>Fetching data ...</>

    return (
        <div>
            {msgNotificationsList.length === 0 ?
                <div className="grid place-items-center h-[60vh]">
                    <div>
                        <img src="/images/no-notification.svg" className="w-4/5 mx-auto" alt="request" />
                        <p className="mt-8 text-center font-medium text-xl capitalize">No new Notification</p>
                    </div>
                </div>
                :
                msgNotificationsList.map((chat) => (
                    <NotificationItem
                        key={chat._id}
                        notification={{
                            id: chat._id,
                            name: chat.name,
                            avatar: chat.avatar[0],
                            count: chat.notificationCount,
                            timestamp: Date.now()
                        }}
                    />
                ))}
        </div>
    )
}


export const FriendRequestList = () => {

    const { data: notifications, isLoading, isError, error } = useGetMyNotificationsQuery()
    const notificationData = notifications?.data

    useErrors([{ error, isError }]);

    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(resetRequestNotification())
    }, [])

    return (
        isLoading ?
            <> Fetching Your friend request notifications</>
            :
            <div>
                {notificationData.length === 0 ?
                    <div className="grid place-items-center h-[60vh]">
                        <div>
                            <img src="/images/no-request.svg" className="w-4/5 mx-auto" alt="request" />
                            <p className="mt-8 text-center font-medium text-xl capitalize">No new Request</p>
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
