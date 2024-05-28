import AvatarCard from "@/components/ui/AvatarCard"
import { Link } from "react-router-dom"

const ChatListItem = ({
    avatar = [],
    name,
    _id,
    groupChat = false,
    sameSender,
    isOnline,
    newMessage,
    index = 0,
    newMessageAlert,
    handleDeleteChat
}) => {
    console.log(newMessageAlert)
    return (
        <Link to={`/chat/${_id}`} onContextMenu={(e) => handleDeleteChat(e, _id, groupChat)}>
            <div className={`flex gap-2 items-center p-4 gradient-border cursor-pointer rounded-lg hover:bg-gradient-background ${sameSender && 'bg-gradient-background'}`}>
                <AvatarCard avatars={avatar} />

                <div className="flex-[1]">
                    <div className="flex justify-between items-center">
                        <p className="font-medium">{name}</p>
                        {isOnline ? <div className="w-3 h-3 rounded-full bg-green animate-pulse"></div> : <p className="text-xs text-body-300">2 hours ago</p>}
                    </div>
                    <p className={`text-sm text-body-700`}>{newMessageAlert ? `${newMessageAlert?.count} New Message` : `Last Message`}</p>
                </div>
            </div>
        </Link>
    )
}

export default ChatListItem