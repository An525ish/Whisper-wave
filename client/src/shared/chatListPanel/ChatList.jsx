import ChatListItem from "./ChatListItem"

const ChatList = ({
    chats = [],
    chatId,
    onlineUsers = [],
    newMessagesAlert = [{
        chatId: chatId,
        count: 4,
    }],
    handleDeleteChat,
}) => {

    return (
        <div className="flex flex-col gap-2 p-2 h-[78vh] overflow-y-auto scrollbar-hide">
            {chats.map((data) => {
                const { avatar, name, _id, groupChat, members } = data

                const newMessageAlert = newMessagesAlert.find(({ chatId }) => chatId === _id)

                const isOnline = members?.some(() => onlineUsers.includes(_id))

                return (
                    <ChatListItem
                        key={_id}
                        avatar={avatar}
                        name={name}
                        groupChat={groupChat}
                        isOnline={isOnline}
                        newMessageAlert={newMessageAlert}
                        _id={_id}
                        sameSender={chatId === _id}
                        handleDeleteChat={handleDeleteChat}
                    />
                )
            })}
        </div>
    )
}

export default ChatList