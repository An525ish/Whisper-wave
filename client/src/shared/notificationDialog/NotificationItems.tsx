import AvatarCard from "@/components/ui/AvatarCard"
import Button from "@/components/ui/Button"
import useErrors from "@/hooks/error"
import { useHandleFriendRequestMutation } from '@/features/api/hooks'
import dayjs from "dayjs"
import { useEffect } from "react"
import { useState } from "react"
import toast from "react-hot-toast"
import { Link } from "react-router-dom"
import relativeTime from 'dayjs/plugin/relativeTime'
import type { ApiSuccess, Avatar } from "@/types"
import { formatUnreadCount } from "@/utils/unread"

dayjs.extend(relativeTime)

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

export const NotificationItem = ({ notification }: NotificationItemProps) => {
    const { id, name, avatar, count, timestamp } = notification
    const [timeAgo, setTimeAgo] = useState('')

    useEffect(() => {
        const updateTimeAgo = () => {
            setTimeAgo(dayjs(timestamp).fromNow())
        }

        updateTimeAgo()
        const timer = setInterval(updateTimeAgo, 60000) // Update every minute

        return () => clearInterval(timer)
    }, [timestamp])

    return (
        <Link to={`/chat/${id}`} className="block">
            <div className="flex cursor-pointer items-center gap-2 rounded-lg p-4 gradient-border hover:bg-gradient-line-fade-dark">
                <AvatarCard avatars={[avatar]} />

                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium">{name}</p>
                        <p className="shrink-0 text-xs text-body-300">{timeAgo}</p>
                    </div>
                    <p className="text-sm text-body-700">
                        {formatUnreadCount(count ?? 0)} New Message{(count ?? 0) === 1 ? '' : 's'}
                    </p>
                </div>
            </div>
        </Link>
    )
}

export const FriendRequestNotifyItem = ({ notification }: FriendRequestNotifyItemProps) => {
    const { _id, sender, createdAt } = notification;
    const { name, avatar } = sender;
    const avatarSrc =
        typeof avatar === 'string'
            ? avatar
            : avatar && typeof avatar === 'object' && 'url' in avatar
                ? (avatar as { url?: string }).url
                : undefined;

    const [clickedButton, setClickedButton] = useState<'accept' | 'decline' | null>(null);

    const handleFriendRequest = useHandleFriendRequestMutation();

    const handleRequest = async (accept: boolean) => {
        setClickedButton(accept ? "accept" : "decline");

        try {
            const res = await handleFriendRequest.mutateAsync({
                requestId: _id,
                accept,
            }) as ApiSuccess;
            if (res?.success) {
                toast.success(res?.message || "Request Handled");
            }
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "An error occurred";
            toast.error(message);
        }
    };

    useErrors([{ error: handleFriendRequest.error, isError: handleFriendRequest.isError }]);

    return (
        <div className="flex gap-2 items-center p-4 gradient-border rounded-lg">
            <AvatarCard avatars={[avatarSrc]} />
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <p className="font-medium">{name}</p>
                    <p className="text-xs text-body-300">{createdAt}</p>
                </div>
                <div className="flex gap-4 mt-2">
                    <Button
                        variant={clickedButton === "accept" ? 'primary' : 'outlineGreen'}
                        className="w-full"
                        onClick={() => handleRequest(true)}
                        disabled={!!clickedButton}
                    >
                        Accept
                    </Button>
                    <Button
                        variant={clickedButton === "decline" ? 'danger' : 'outlineRed'}
                        className="w-full"
                        onClick={() => handleRequest(false)}
                        disabled={!!clickedButton}
                    >
                        Ignore
                    </Button>
                </div>
            </div>
        </div>
    );
};
