import useErrors from '@/hooks/error';
import {
  useFindChatsMutation,
  useGetMyNotificationsQuery,
} from '@/features/api/hooks';
import { useEffect, useMemo, useState } from 'react';
import {
  FriendRequestNotifyItem,
  NotificationItem,
} from './NotificationItems';
import { useNotificationsStore } from '@/stores/notifications';
import useAsyncMutation from '@/hooks/asyncMutation';
import AvatarSkeleton from '@/components/skeletons/AvatarSkeleton';
import EmptyState from '@/components/ui/EmptyState';

type FoundChatNotification = {
  _id: string;
  name?: string;
  avatar?: string[];
  notificationCount?: number;
  timestamp?: string | number;
};

type FriendRequestRow = {
  id?: string;
  _id: string;
  createdAt?: string;
  sender: {
    name?: string;
    avatar?: string;
  };
};

type NotificationsResponse = {
  data?: FriendRequestRow[];
};

export const NotificationList = () => {
  const messageNotifications = useNotificationsStore(
    (s) => s.messageNotifications,
  );
  const userIds = useMemo(
    () => messageNotifications.map((el) => el.chatId),
    [messageNotifications],
  );
  const [findChats, { isLoading }] = useAsyncMutation(useFindChatsMutation);

  const [msgNotificationsList, setMsgNotificationsList] = useState<
    FoundChatNotification[]
  >([]);

  useEffect(() => {
    const handleFindChats = async () => {
      if (userIds.length > 0) {
        const res = await findChats('', {
          userIds,
          notifications: messageNotifications,
        });

        if (res) {
          const list =
            (res as { data?: FoundChatNotification[] }).data ??
            (res as FoundChatNotification[]);
          setMsgNotificationsList(Array.isArray(list) ? list : []);
        }
      } else {
        setMsgNotificationsList([]);
      }
    };

    void handleFindChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- match prior behavior
  }, [userIds.length]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-y-auto p-2 scrollbar-hide">
      {isLoading ? (
        Array(3)
          .fill(0)
          .map((_, i) => <AvatarSkeleton key={i} className={'h-20 px-4 py-2'} />)
      ) : msgNotificationsList.length === 0 ? (
        <EmptyState
          className="h-full"
          imageSrc="/images/no-notification.svg"
          imageAlt="notification"
          imageClassName="w-4/5 mx-auto"
          titleClassName="mt-8 text-center text-xl font-medium capitalize"
          title="No new Notification"
        />
      ) : (
        msgNotificationsList.map((chat) => (
          <NotificationItem
            key={chat._id}
            notification={{
              id: chat._id,
              name: chat.name,
              avatar: chat.avatar?.[0] || null,
              count: chat.notificationCount,
              timestamp: chat.timestamp || Date.now(),
            }}
          />
        ))
      )}
    </div>
  );
};

export const FriendRequestList = () => {
  const { data: notifications, isLoading, isError, error } =
    useGetMyNotificationsQuery();
  const notificationData = (notifications as NotificationsResponse | undefined)
    ?.data;

  useErrors([{ error, isError }]);

  const resetRequestNotification = useNotificationsStore(
    (s) => s.resetRequestNotification,
  );

  useEffect(() => {
    resetRequestNotification();
  }, [resetRequestNotification]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-y-auto p-2 scrollbar-hide">
      {isLoading ? (
        Array(3)
          .fill(0)
          .map((_, i) => (
            <AvatarSkeleton
              key={i}
              className={'h-20 bg-transparent px-4 py-1'}
            />
          ))
      ) : !notificationData || notificationData.length === 0 ? (
        <EmptyState
          className="h-full"
          imageSrc="/images/no-request.svg"
          imageAlt="request"
          imageClassName="w-4/5 mx-auto"
          titleClassName="mt-8 text-center text-xl font-medium capitalize"
          title="No new Request"
        />
      ) : (
        notificationData.map((data) => (
          <FriendRequestNotifyItem
            key={data.id ?? data._id}
            notification={data}
          />
        ))
      )}
    </div>
  );
};
