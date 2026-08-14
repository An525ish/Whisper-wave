import useErrors from '@/hooks/shared/useError';
import {
  useFindChatsMutation,
  useGetMyNotificationsQuery,
} from '@/hooks/chat';
import { useEffect, useMemo, useState } from 'react';
import {
  FriendRequestNotifyItem,
  NotificationItem,
} from '@/components/notifications/NotificationItem';
import { useNotificationsStore } from '@/stores/notifications';
import useAsyncMutation from '@/hooks/shared/useAsyncMutation';
import AvatarSkeleton from '@/components/ui/skeletons/AvatarSkeleton';
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
  const clearMessageNotifications = useNotificationsStore(
    (s) => s.clearMessageNotifications,
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
    <div className="flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide">
      {messageNotifications.length > 0 ? (
        <div className="mb-1 flex shrink-0 items-center justify-between gap-2 px-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-body-300">
            Inbox
          </p>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-xs font-medium text-body-300 transition hover:bg-white/8 hover:text-white"
            onClick={clearMessageNotifications}
            aria-label="Clear all message notifications"
          >
            Clear all
          </button>
        </div>
      ) : null}
      {isLoading ? (
        Array.from({ length: 3 }, (_, i) => (
          <AvatarSkeleton
            key={i}
            className="h-16 rounded-2xl bg-transparent px-2 py-2"
          />
        ))
      ) : msgNotificationsList.length === 0 ? (
        <EmptyState
          className="h-full"
          imageSrc="/images/no-notification.svg"
          imageAlt="notification"
          contentClassName="max-w-sm"
          imageClassName="mx-auto w-[56%] opacity-80"
          titleClassName="mt-5 text-center text-sm font-medium text-body-300"
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

  const hasRequests = Boolean(notificationData && notificationData.length > 0);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide">
      {hasRequests ? (
        <div className="mb-1 flex shrink-0 items-center justify-between gap-2 px-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-body-300">
            Pending
          </p>
          <span className="inline-flex h-5 items-center rounded-full bg-green/15 px-2 text-[11px] font-semibold tabular-nums text-green ring-1 ring-inset ring-green/25">
            {notificationData?.length}
          </span>
        </div>
      ) : null}
      {isLoading ? (
        Array.from({ length: 3 }, (_, i) => (
          <AvatarSkeleton
            key={i}
            className="h-24 rounded-2xl bg-transparent px-2 py-2"
          />
        ))
      ) : !hasRequests ? (
        <EmptyState
          className="h-full"
          imageSrc="/images/no-request.svg"
          imageAlt="request"
          contentClassName="max-w-sm"
          imageClassName="mx-auto w-[56%] opacity-80"
          titleClassName="mt-5 text-center text-sm font-medium text-body-300"
          title="No new requests"
        />
      ) : (
        (notificationData ?? []).map((data) => (
          <FriendRequestNotifyItem
            key={data.id ?? data._id}
            notification={data}
          />
        ))
      )}
    </div>
  );
};
