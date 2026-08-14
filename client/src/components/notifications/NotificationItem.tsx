import AvatarCard from '@/components/ui/AvatarCard';
import useErrors from '@/hooks/shared/useError';
import { useHandleFriendRequestMutation } from '@/hooks/chat';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { ApiSuccess } from '@/types';
import type {
  MessageNotifyItem,
  FriendRequestNotifyItemProps,
} from '@/types/notifications';
import CountBadge from '@/components/ui/CountBadge';

dayjs.extend(relativeTime);

type NotificationItemProps = {
  notification: MessageNotifyItem;
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
      className="flex items-center gap-2 rounded-2xl px-2 py-2.5 transition hover:bg-gradient-row-hover"
    >
      <AvatarCard avatars={[avatar]} avatarClassName="shadow-none" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-white">{name}</p>
          {timeAgo ? (
            <p className="shrink-0 text-[11px] font-medium text-green">
              {timeAgo}
            </p>
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="truncate text-xs text-body-700">
            {unread === 1 ? 'New message' : 'New messages'}
          </p>
          <CountBadge count={unread} />
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

  const busy = !!clickedButton;

  return (
    <div className="rounded-2xl px-2 py-2.5 transition hover:bg-gradient-row-hover">
      <div className="flex items-center gap-2">
        <AvatarCard avatars={[avatarSrc]} avatarClassName="shadow-none" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-white">{name}</p>
            {timeAgo ? (
              <p className="shrink-0 text-[11px] text-body-300">{timeAgo}</p>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-body-700">Wants to connect</p>
        </div>
      </div>

      <div className="mt-2.5 flex gap-2 pl-1">
        <button
          type="button"
          onClick={() => handleRequest(true)}
          disabled={busy}
          className={`inline-flex h-8 flex-1 items-center justify-center rounded-full text-[12px] font-semibold transition ${
            clickedButton === 'accept'
              ? 'bg-gradient-green text-white'
              : 'bg-green/10 text-green ring-1 ring-inset ring-green/30 hover:bg-green/20 enabled:active:scale-[0.98]'
          } disabled:cursor-default`}
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => handleRequest(false)}
          disabled={busy}
          className={`inline-flex h-8 flex-1 items-center justify-center rounded-full text-[12px] font-semibold transition ${
            clickedButton === 'decline'
              ? 'bg-white/8 text-body-300'
              : 'text-body-300 ring-1 ring-inset ring-white/12 hover:bg-white/6 hover:text-body enabled:active:scale-[0.98]'
          } disabled:cursor-default`}
        >
          Ignore
        </button>
      </div>
    </div>
  );
};
