import useErrors from "@/hooks/error";
import { useFindChatsMutation, useGetMyNotificationsQuery } from "@/redux/reducers/apis/api";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FriendRequestNotifyItem, NotificationItem } from "./NotificationItems";
import { resetMessageNotification, resetRequestNotification } from "@/redux/reducers/chat";
import useAsyncMutation from "@/hooks/asyncMutation";
import AvatarSkeleton from "@/components/skeletons/AvatarSkeleton";

export const NotificationList = () => {
    const { messageNotifications } = useSelector(state => state.chat);
    const userIds = useMemo(() => messageNotifications.map((el) => el.chatId), [messageNotifications]);
    const [findChats, { isLoading }] = useAsyncMutation(useFindChatsMutation);

    const [msgNotificationsList, setMsgNotificationsList] = useState([]);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(resetMessageNotification());
    }, [dispatch]);

    useEffect(() => {
        const handleFindChats = async () => {
            if (userIds.length > 0) {
                const res = await findChats('', {
                    userIds,
                    notifications: messageNotifications
                });

                if (res) {
                    setMsgNotificationsList(res);
                }

            } else {
                setMsgNotificationsList([]);
            }
        };

        handleFindChats();
    }, [userIds.length]); // Added dependencies for findChats and messageNotifications


    return (
        <div className="flex flex-col gap-2 p-2 h-[76vh] overflow-y-auto scrollbar-hide">
            {isLoading ? (
                Array(3).fill(0).map((_, i) => <AvatarSkeleton key={i} className={'px-4 py-2 h-20'} />)
            ) : (
                <>
                    {msgNotificationsList.length === 0 ? (
                        <div className="grid place-items-center h-[60vh]">
                            <div>
                                <img src="/images/no-notification.svg" className="w-4/5 mx-auto" alt="request" />
                                <p className="mt-8 text-center font-medium text-xl capitalize">No new Notification</p>
                            </div>
                        </div>
                    ) : (
                        msgNotificationsList.map((chat) => (
                            <NotificationItem
                                key={chat._id}
                                notification={{
                                    id: chat._id,
                                    name: chat.name,
                                    avatar: chat.avatar?.[0] || null,
                                    count: chat.notificationCount,
                                    timestamp: chat.timestamp || Date.now()
                                }}
                            />
                        ))

                    )}
                </>
            )}
        </div>
    );
};

export const FriendRequestList = () => {
    const { data: notifications, isLoading, isError, error } = useGetMyNotificationsQuery();
    const notificationData = notifications?.data;

    useErrors([{ error, isError }]);

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(resetRequestNotification());
    }, [dispatch]);


    return (
        <div className="flex flex-col gap-2 p-2 h-[76vh] overflow-y-auto scrollbar-hide">
            {isLoading ? (
                Array(3).fill(0).map((_, i) => <AvatarSkeleton key={i} className={'px-4 py-1 h-20 bg-transparent'} />)
            ) : (
                <>
                    {!notificationData || notificationData.length === 0 ? (
                        <div className="grid place-items-center h-[60vh]">
                            <div>
                                <img src="/images/no-request.svg" className="w-4/5 mx-auto" alt="request" />
                                <p className="mt-8 text-center font-medium text-xl capitalize">No new Request</p>
                            </div>
                        </div>
                    ) : (
                        notificationData.map((data) =>
                            <FriendRequestNotifyItem key={data.id} notification={data} />
                        )
                    )}
                </>)
            }
        </div>
    );
};
