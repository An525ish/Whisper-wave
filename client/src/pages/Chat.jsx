import AppWrapper from "@/layout/AppWrapper"
import ChatHeader from "@/shared/chatPanel/ChatHeader"
import ChatsViewPanel from "@/shared/chatPanel/ChatsViewPanel"
import { useParams } from "react-router-dom"

const Chat = () => {
    const { chatId } = useParams()
    return (
        <AppWrapper>
            <div className="relative flex flex-col gap-6 h-full">
                <div className="">
                    <ChatHeader chatId={chatId} />
                </div>
                <ChatsViewPanel chatId={chatId} />
            </div>
        </AppWrapper>
    )
}

export default Chat