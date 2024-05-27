import AvatarCard from "@/components/ui/AvatarCard"
import { Link } from "react-router-dom"

export const NotificationItem = ({ notification }) => {
    const { _id, sender, newMessageAlert } = notification
    const { name, avatar } = sender
    const handleDeleteNotification = (e, id) => {
        console.log(id)
    }
    return (
        <Link to={`/chat/${_id}`} onContextMenu={(e) => handleDeleteNotification(e, _id)}>
            < div className={`flex gap-2 items-center p-4 gradient-border cursor-pointer rounded-lg hover:bg-gradient-line-fade-dark`}>
                <AvatarCard avatars={avatar} />

                <div className="flex-[1]">
                    <div className="flex justify-between items-center">
                        <p className="font-medium">{name}</p>
                        <p className="text-xs text-body-300">2 hours ago</p>
                    </div>
                    {newMessageAlert && <p className={`text-sm text-body-700`}>{newMessageAlert.count} New Message</p>}
                </div>
            </div>
        </Link >
    )
}

export const FriendRequestNotifyItem = ({ notification }) => {
    const { _id, sender, newMessageAlert } = notification
    const { name, avatar } = sender

    const handleRequest = ({ id, accept }) => {
        console.log(id, accept)
    }

    return (
        <Link to={`/chat/${_id}`}>
            <div className={`flex gap-2 items-center p-4 gradient-border cursor-pointer rounded-lg`}>
                <AvatarCard avatars={avatar} />

                <div className="flex-[1]">
                    <div className="flex justify-between items-center">
                        <p className="font-medium">{name}</p>
                        <p className="text-xs text-body-300">2 hours ago</p>
                    </div>

                    <div className="flex gap-4 mt-2">
                        <button
                            className="border-2 border-green-light hover:scale-95 transition text-green rounded-2xl w-full py-1 px-4"
                            onClick={() => handleRequest({ _id, accept: true })}
                        >
                            Accept
                        </button>
                        <button
                            className="border-2 border-red-light hover:scale-95 transition text-red  rounded-2xl w-full py-1 px-4"
                            onClick={() => handleRequest({ _id, accept: false })}
                        >
                            Ignore
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    )
}