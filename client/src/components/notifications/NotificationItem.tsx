import AvatarCard from '@/components/ui/AvatarCard';
import useErrors from '@/hooks/shared/useError';
import { useHandleFriendRequestMutation } from '@/hooks/chat';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import relativeTime from 'dayjs/plugin/relativeTime';
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

type Phase = 'idle' | 'loading-accept' | 'loading-decline' | 'accepted' | 'declined' | 'exiting';

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
  const [phase, setPhase] = useState<Phase>('idle');
  const [hidden, setHidden] = useState(false);

  const handleFriendRequest = useHandleFriendRequestMutation();

  const handleRequest = async (accept: boolean) => {
    if (phase !== 'idle') return;
    setPhase(accept ? 'loading-accept' : 'loading-decline');
    try {
      await handleFriendRequest.mutateAsync({ requestId: _id, accept });
      const settled = accept ? 'accepted' : 'declined';
      setPhase(settled);
      setTimeout(() => {
        setPhase('exiting');
        setTimeout(() => setHidden(true), 350);
      }, 750);
    } catch (error: unknown) {
      setPhase('idle');
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
    }
  };

  useErrors([
    { error: handleFriendRequest.error, isError: handleFriendRequest.isError },
  ]);

  if (hidden) return null;

  const isLoading = phase === 'loading-accept' || phase === 'loading-decline';
  const isExiting = phase === 'exiting';
  const settled = phase === 'accepted' || phase === 'declined';

  return (
    <div
      style={{
        maxHeight: isExiting ? 0 : 120,
        opacity: isExiting ? 0 : 1,
        overflow: 'hidden',
        transition: 'max-height 0.35s ease, opacity 0.25s ease',
      }}
    >
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
            {settled ? (
              <p className={`mt-0.5 text-xs font-medium ${phase === 'accepted' ? 'text-green' : 'text-body-300'}`}>
                {phase === 'accepted' ? '✓ Connected' : 'Request ignored'}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-body-700">Wants to connect</p>
            )}
          </div>
        </div>

        {!settled ? (
          <div className="mt-2.5 flex gap-2 pl-1">
            <button
              type="button"
              onClick={() => void handleRequest(true)}
              disabled={isLoading}
              className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full bg-green/10 text-[12px] font-semibold text-green ring-1 ring-inset ring-green/30 transition hover:bg-green/20 enabled:active:scale-[0.98] disabled:cursor-default disabled:opacity-60"
            >
              {phase === 'loading-accept' ? (
                <>
                  <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Accept
                </>
              ) : 'Accept'}
            </button>
            <button
              type="button"
              onClick={() => void handleRequest(false)}
              disabled={isLoading}
              className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full text-[12px] font-semibold text-body-300 ring-1 ring-inset ring-white/12 transition hover:bg-white/6 hover:text-body enabled:active:scale-[0.98] disabled:cursor-default disabled:opacity-60"
            >
              {phase === 'loading-decline' ? (
                <>
                  <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Ignore
                </>
              ) : 'Ignore'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
