import AvatarSkeleton from "@/components/skeletons/AvatarSkeleton";
import ChatListItem from "./ChatListItem";
import { useSelector } from "react-redux";

const ChatList = ({
    chats = [],
    type,
    isLoading,
    onlineUsers = [],
    newMessageAlert,
    handleDeleteChat,
}) => {
    const { user } = useSelector(state => state.auth)

    return (
        <div className="flex flex-col gap-2 p-2 h-[78vh] overflow-y-auto scrollbar-hide">
            {isLoading ? (
                Array(8).fill(0).map((_, i) => <AvatarSkeleton key={i} className={'px-4 py-2 h-20'} />)
            ) : (
                <>
                    {chats.length !== 0 ? (
                        chats.map((data) => {
                            const { avatar, name, _id, groupChat, members, lastMessage } = data;
                            const messageAlert = newMessageAlert.find(({ chatId }) => chatId === _id);
                            const isOnline = members?.some(() => onlineUsers.includes(_id));

                            return (
                                <ChatListItem
                                    key={_id}
                                    avatar={avatar}
                                    name={name}
                                    groupChat={groupChat}
                                    isOnline={isOnline}
                                    messageAlert={messageAlert}
                                    id={_id}
                                    lastMessage={lastMessage}
                                    handleDeleteChat={handleDeleteChat}
                                    currentUserId={user._id}
                                />
                            );
                        })
                    ) : (
                        <div className="grid h-full place-items-center">
                            <div className="mb-20 w-full">
                                <img src={`/images/no-${type}-chat.svg`} alt="" className="mx-auto opacity-45 w-4/5" />
                                <p className="text-body-300 text-center text-xl font-medium mt-12">
                                    No {type === 'allchats' ? '' : type} chats found
                                </p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ChatList;
