import AvatarCard from '@/components/ui/AvatarCard';
import Button from '@/components/ui/Button';
import useErrors from '@/hooks/error';
import { useHandleFriendRequestMutation } from '@/features/api/hooks';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { ApiSuccess, Avatar } from '@/types';
import { formatUnreadCount } from '@/utils/unread';

dayjs.extend(relativeTime);

type MessageNotifyItem = {
  id: string;
  name?: string;
  avatar?: string | null;
  count?: number;
  timestamp?: string | number;
};

type FriendRequestNotify = {
  _id: string;
  createdAt?: string;
  sender: {
    name?: string;
    avatar?: string | Avatar;
  };
};

type NotificationItemProps = {
  notification: MessageNotifyItem;
};

type FriendRequestNotifyItemProps = {
  notification: FriendRequestNotify;
};

const useRelativeTime = (timestamp?: string | number) => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!timestamp) {
      setTimeAgo('');
      return;
    }

    const update = () => setTimeAgo(dayjs(timestamp).fromNow());
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, [timestamp]);

  return timeAgo;
};

export const NotificationItem = ({ notification }: NotificationItemProps) => {
  const { id, name, avatar, count, timestamp } = notification;
  const timeAgo = useRelativeTime(timestamp);
  const unread = count ?? 0;

  return (
    <Link
      to={`/chat/${id}`}
      className="group flex items-center gap-3 rounded-2xl border border-border/50 bg-primary/25 px-3 py-3 transition hover:border-border/80 hover:bg-primary/45"
    >
      <AvatarCard avatars={[avatar]} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-white">{name}</p>
          {timeAgo ? (
            <p className="shrink-0 text-[11px] text-body-300">{timeAgo}</p>
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <p className="truncate text-xs text-body-700">
            {formatUnreadCount(unread)} new message
            {unread === 1 ? '' : 's'}
          </p>
          {unread > 0 ? (
            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-green/20 px-1.5 text-[10px] font-semibold tabular-nums text-green">
              {formatUnreadCount(unread)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
};

export const FriendRequestNotifyItem = ({
  notification,
}: FriendRequestNotifyItemProps) => {
  const { _id, sender, createdAt } = notification;
  const { name, avatar } = sender;
  const avatarSrc =
    typeof avatar === 'string'
      ? avatar
      : avatar && typeof avatar === 'object' && 'url' in avatar
        ? (avatar as { url?: string }).url
        : undefined;

  const timeAgo = useRelativeTime(createdAt);
  const [clickedButton, setClickedButton] = useState<
    'accept' | 'decline' | null
  >(null);

  const handleFriendRequest = useHandleFriendRequestMutation();

  const handleRequest = async (accept: boolean) => {
    setClickedButton(accept ? 'accept' : 'decline');

    try {
      const res = (await handleFriendRequest.mutateAsync({
        requestId: _id,
        accept,
      })) as ApiSuccess;
      if (res?.success) {
        toast.success(res?.message || 'Request Handled');
      }
    } catch (error: unknown) {
      setClickedButton(null);
      const message =
        error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
    }
  };

  useErrors([
    { error: handleFriendRequest.error, isError: handleFriendRequest.isError },
  ]);

  return (
    <div className="rounded-2xl border border-border/50 bg-primary/25 px-3 py-3">
      <div className="flex items-center gap-3">
        <AvatarCard avatars={[avatarSrc]} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-white">{name}</p>
            {timeAgo ? (
              <p className="shrink-0 text-[11px] text-body-300">{timeAgo}</p>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-body-700">wants to connect</p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          variant={clickedButton === 'accept' ? 'primary' : 'outlineGreen'}
          className="w-full"
          onClick={() => handleRequest(true)}
          disabled={!!clickedButton}
        >
          Accept
        </Button>
        <Button
          variant={clickedButton === 'decline' ? 'danger' : 'outlineRed'}
          className="w-full"
          onClick={() => handleRequest(false)}
          disabled={!!clickedButton}
        >
          Ignore
        </Button>
      </div>
    </div>
  );
};
