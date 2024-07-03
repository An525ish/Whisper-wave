import ContextMenu from "@/components/context-menu/ContextMenu"
import AvatarCard from "@/components/ui/AvatarCard"
import useContextMenu from "@/hooks/Context-menu"
import { useRef } from "react"
import { Link, useParams } from "react-router-dom"
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { getFirstName } from "@/utils/helper"

dayjs.extend(relativeTime)

const options = [
    {
        id: 1,
        icon: '/icons/chat-icon.svg',
        name: 'Open Conversation'
    },
    {
        id: 2,
        icon: '/icons/clear.svg',
        name: 'Clear Message'
    }
];

const ChatListItem = ({
    avatar = [],
    name,
    id,
    groupChat = false,
    // isOnline,
    // handleDeleteChat,
    lastMessage,
    messageAlert,
    currentUserId
}) => {
    const { menuState, showContextMenu, hideContextMenu } = useContextMenu();
    const dialogRef = useRef()
    const { chatId } = useParams()

    const handleContextMenu = (e, memberId, groupChat) => {
        e.preventDefault();
        const boundingRect = dialogRef.current.getBoundingClientRect();
        showContextMenu({ x: e.clientX - boundingRect.left, y: e.clientY - boundingRect.top }, options, (option) => {
            console.log(`Selected option: ${option.name} for member: ${memberId} and groupChat is ${groupChat}`);
        });
    };

    const renderLastMessagePreview = () => {
        if (!lastMessage) return 'No messages yet';
        const senderName = getFirstName(lastMessage.sender.name)

        let senderPrefix = '';
        if (groupChat) {
            senderPrefix = lastMessage.sender._id === currentUserId ? 'You: ' : `${senderName}: `;
        }

        return `${senderPrefix}${lastMessage.content}`;
    };

    const formatTime = (time) => {
        if (!time) return '';
        const messageDate = dayjs(time);
        const now = dayjs();

        if (messageDate.isSame(now, 'day')) {
            return messageDate.format('hh:mm A');
        } else if (messageDate.isSame(now.subtract(1, 'day'), 'day')) {
            return 'Yesterday';
        } else if (messageDate.isSame(now, 'week')) {
            return messageDate.format('ddd');
        } else {
            return messageDate.format('DD/MM/YYYY');
        }
    };

    return (
        <Link to={`/chat/${id}`} onContextMenu={(e) => handleContextMenu(e, id, groupChat)}>
            <div ref={dialogRef} className={`flex gap-2 items-center p-4 gradient-border cursor-pointer rounded-lg hover:bg-gradient-background ${(chatId === id) && 'bg-gradient-background'}`}>
                <AvatarCard avatars={avatar} />

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                        <p className="font-medium truncate flex-1">{name}</p>
                        <p className="text-xs text-body-300 whitespace-nowrap ml-2">{formatTime(lastMessage?.createdAt)}</p>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-sm text-body-700 truncate flex-1">{renderLastMessagePreview()}</p>
                        {(messageAlert && messageAlert.count > 0) && (
                            <div className="bg-red-dark border border-red-light text-red font-normal text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">
                                {messageAlert.count > 99 ? '99+' : messageAlert.count}
                            </div>
                        )}
                    </div>
                </div>

                <ContextMenu menuState={menuState} hideContextMenu={hideContextMenu} />
            </div>
        </Link>
    )
}

export default ChatListItem