import AvatarCard from "@/components/ui/AvatarCard"
import useErrors from "@/hooks/error"
import { useHandleFriendRequestMutation } from "@/redux/reducers/apis/api"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useState } from "react"
import toast from "react-hot-toast"
import { Link } from "react-router-dom"
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export const NotificationItem = ({ notification }) => {
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
        <Link to={`/chat/${id}`}>
            < div className={`flex gap-2 items-center p-4 gradient-border cursor-pointer rounded-lg hover:bg-gradient-line-fade-dark`}>
                <AvatarCard avatars={[avatar]} />

                <div className="flex-[1]">
                    <div className="flex justify-between items-center">
                        <p className="font-medium">{name}</p>
                        <p className="text-xs text-body-300">{timeAgo}</p>
                    </div>
                    {<p className={`text-sm text-body-700`}>{count} New Message</p>}
                </div>
            </div>
        </Link >
    )
}

export const FriendRequestNotifyItem = ({ notification }) => {
    const { _id, sender, createdAt } = notification;
    const { name, avatar } = sender;

    const [clickedButton, setClickedButton] = useState(null);

    const [handleFriendRequest, { error, isError }] = useHandleFriendRequestMutation();

    const handleRequest = async (accept) => {
        setClickedButton(accept ? "accept" : "decline");

        try {
            const res = await handleFriendRequest({
                requestId: _id,
                accept,
            });
            if (res?.data?.success) {
                toast.success(res?.data?.message || "Request Handled");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    };

    useErrors([{ error, isError }]);

    return (
        <div className="flex gap-2 items-center p-4 gradient-border rounded-lg">
            <AvatarCard avatars={[avatar]} />
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <p className="font-medium">{name}</p>
                    <p className="text-xs text-body-300">{createdAt}</p>
                </div>
                <div className="flex gap-4 mt-2">
                    <button
                        className={`hover:scale-95 transition rounded-2xl w-full py-1 px-4 ${clickedButton === "accept" ? 'bg-gradient-action-button-green text-body' : 'border-2 border-green-light text-green'}`}
                        onClick={() => handleRequest(true)}
                        disabled={!!clickedButton}
                    >
                        Accept
                    </button>
                    <button
                        className={`hover:scale-95 transition rounded-2xl w-full py-1 px-4 ${clickedButton === "decline" ? 'bg-gradient-action-button-red text-body' : 'border-2 border-red-light text-red'}`}
                        onClick={() => handleRequest(false)}
                        disabled={!!clickedButton}
                    >
                        Ignore
                    </button>
                </div>
            </div>
        </div>
    );
};
