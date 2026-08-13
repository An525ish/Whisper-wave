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
  const chatIdsKey = useMemo(
    () =>
      messageNotifications
        .map((el) => `${el.chatId}:${el.count}`)
        .sort()
        .join('|'),
    [messageNotifications],
  );
  const [findChats, { isLoading }] = useAsyncMutation(useFindChatsMutation);

  const [msgNotificationsList, setMsgNotificationsList] = useState<
    FoundChatNotification[]
  >([]);

  useEffect(() => {
    let cancelled = false;

    const handleFindChats = async () => {
      if (messageNotifications.length === 0) {
        setMsgNotificationsList([]);
        return;
      }

      const userIds = messageNotifications.map((el) => el.chatId);
      const res = await findChats('', {
        userIds,
        notifications: messageNotifications,
      });

      if (cancelled) return;

      if (res) {
        const list =
          (res as { data?: FoundChatNotification[] }).data ??
          (res as FoundChatNotification[]);
        setMsgNotificationsList(Array.isArray(list) ? list : []);
      }
    };

    void handleFindChats();
    return () => {
      cancelled = true;
    };
    // chatIdsKey captures id+count changes; findChats identity is unstable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatIdsKey]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-y-auto px-1 py-1 scrollbar-hide">
      {isLoading ? (
        Array.from({ length: 3 }, (_, i) => (
          <AvatarSkeleton key={i} className="h-16 rounded-2xl px-3 py-2" />
        ))
      ) : msgNotificationsList.length === 0 ? (
        <EmptyState
          className="h-full"
          imageSrc="/images/no-notification.svg"
          imageAlt="notification"
          imageClassName="mx-auto w-3/5 max-w-[14rem]"
          titleClassName="mt-6 text-center text-base font-medium text-body-700"
          title="No new messages"
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
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-y-auto px-1 py-1 scrollbar-hide">
      {isLoading ? (
        Array.from({ length: 3 }, (_, i) => (
          <AvatarSkeleton
            key={i}
            className="h-24 rounded-2xl bg-transparent px-3 py-2"
          />
        ))
      ) : !notificationData || notificationData.length === 0 ? (
        <EmptyState
          className="h-full"
          imageSrc="/images/no-request.svg"
          imageAlt="request"
          imageClassName="mx-auto w-3/5 max-w-[14rem]"
          titleClassName="mt-6 text-center text-base font-medium text-body-700"
          title="No new requests"
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
