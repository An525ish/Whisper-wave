import { useGetMessagesQuery } from "@/redux/reducers/apis/api"
import ChatBox from "./ChatBox"
import { useParams } from "react-router-dom"

const ChatsViewPanel = () => {
    const { chatId } = useParams()
    const { data: messages, isLoading } = useGetMessagesQuery({ chatId })

    if (isLoading) return <>Fetching messages...</>

    const messageData = messages?.data || []
    const isGroupChat = messages?.groupChat

    return (
        <div className="bg-glass-background bg-center -mt-4">
            <div className='h-[85vh] p-2 pt-20 flex flex-col gap-4 overflow-y-auto scrollbar-hide backdrop-blur-lg backdrop-saturate-[100%] bg-[rgba(33,26,42,0.75)]'>
                {messageData.map((chat) => <ChatBox key={chat._id} chatData={chat} isGroupChat={isGroupChat} />)}
            </div>
        </div>
    )
}

export default ChatsViewPanel