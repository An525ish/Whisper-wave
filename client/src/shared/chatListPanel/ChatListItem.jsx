import ContextMenu from "@/components/context-menu/ContextMenu"
import AvatarCard from "@/components/ui/AvatarCard"
import useContextMenu from "@/hooks/Context-menu"
import { useRef } from "react"
import { Link, useParams } from "react-router-dom"

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
    isOnline,
    newMessage,
    messageAlert
}) => {

    const { menuState, showContextMenu, hideContextMenu } = useContextMenu();
    const dialogRef = useRef()

    const { chatId } = useParams()

    console.log(messageAlert)


    const handleContextMenu = (e, memberId, groupChat) => {
        e.preventDefault();
        const boundingRect = dialogRef.current.getBoundingClientRect();
        showContextMenu({ x: e.clientX - boundingRect.left, y: e.clientY - boundingRect.top }, options, (option) => {
            console.log(`Selected option: ${option.name} for member: ${memberId} and groupChat is ${groupChat}`);
        });
    };

    return (
        <Link to={`/chat/${id}`} onContextMenu={(e) => handleContextMenu(e, id, groupChat)}>
            <div ref={dialogRef} className={`flex gap-2 items-center p-4 gradient-border cursor-pointer rounded-lg hover:bg-gradient-background ${(chatId === id) && 'bg-gradient-background'}`}>
                <AvatarCard avatars={avatar} />

                <div className="flex-[1]">
                    <div className="flex justify-between items-center">
                        <p className={`font-medium ${groupChat ? 'w-36' : 'w-52'} truncate`}>{name}</p>
                        {isOnline ? <div className="w-3 h-3 rounded-full bg-green animate-pulse"></div> : <p className="text-xs text-body-300">2 hours ago</p>}
                    </div>
                    <div className={`flex justify-between text-sm text-body-700`}>
                        <p>{`Last Message`}</p>
                        {(messageAlert && messageAlert.count > 0) &&
                            <div className="bg-red-dark border border-red-light text-red font-normal text-sm rounded-full w-5 h-5 text-center grid place-items-center mt-1 mr-4">
                                {messageAlert?.count > 9 ?
                                    <span className="text-xs">9+</span> :
                                    <span>{messageAlert?.count} </span>
                                }
                            </div>
                        }
                    </div>
                </div>

                <ContextMenu menuState={menuState} hideContextMenu={hideContextMenu} />
            </div>
        </Link>
    )
}

export default ChatListItem