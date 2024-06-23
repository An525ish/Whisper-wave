import ChatListItem from "./ChatListItem"

const ChatList = ({
    chats = [],
    type,
    isLoading,
    onlineUsers = [],
    newMessagesAlert = [{
        chatId: 'chatId',
        count: 4,
    }],
    handleDeleteChat,
}) => {
    console.log('first')
    return (
        isLoading ? (
            <>Loading...</>
        ) : (
            <div className="flex flex-col gap-2 p-2 h-[78vh] overflow-y-auto scrollbar-hide">
                {chats.length !== 0 ? chats.map((data) => {
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
                            id={_id}
                            handleDeleteChat={handleDeleteChat}
                        />
                    )
                })
                    :
                    <div className="grid h-full place-items-center">
                        <div className="mb-20 w-full">
                            <img src={`/images/no-${type}-chat.svg`} alt="" className="mx-auto opacity-45 w-4/5" />
                            <p className="text-body-300 text-center text-xl font-medium mt-12">No {type === 'allchats' ? '' : type} chats found</p>
                        </div>
                    </div>
                }
            </div>)


    )
}

export default ChatList