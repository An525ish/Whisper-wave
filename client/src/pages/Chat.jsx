import AppWrapper from "@/layout/AppWrapper"
import { sampleMessage, user } from "@/lib/samples"
import ChatHeader from "@/shared/chatPanel/ChatHeader"
import ChatInput from "@/shared/chatPanel/ChatInput"
import ChatsViewPanel from "@/shared/chatPanel/ChatsViewPanel"

const Chat = () => {
    return (
        <AppWrapper>
            <div className="relative flex flex-col gap-6 h-full">
                <div className="">
                    <ChatHeader />
                </div>
                <ChatsViewPanel chats={sampleMessage} user={user} />
                <ChatInput
                    className={'text-body-700 placeholder:text-body-300'}
                    placeholder={'Type Message here...'}
                />
            </div>
        </AppWrapper>
    )
}

export default Chat