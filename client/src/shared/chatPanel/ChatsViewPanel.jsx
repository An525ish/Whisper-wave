import { useChatDetailsQuery, useGetMessagesQuery } from "@/redux/reducers/apis/api"
import ChatBox from "./ChatBox"
import ChatInput from "./ChatInput"
import { useState, useEffect, useCallback, useRef } from "react"
import { useSocket } from "@/hooks/socketContext"
import useErrors from "@/hooks/error"
import { NEW_MESSAGE } from "@/lib/socketConstants"
import useSocketEvent from "@/hooks/socketEvent"

const ChatsViewPanel = ({ chatId }) => {
    const socket = useSocket()
    const containerRef = useRef()
    const [page, setPage] = useState(1)

    const { data: dbMessages, isLoading: msgLoading, error: dbError, isError: dbIsError } = useGetMessagesQuery({ chatId, page }, { skip: !chatId })

    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])

    const { data: chatDetails, isLoading, error, isError } = useChatDetailsQuery(
        { id: chatId },
        { skip: !chatId }
    )

    const chatMembers = chatDetails?.data?.members
    const isGroupChat = dbMessages?.groupChat

    useErrors([{ error, isError }, { dbError, dbIsError }])

    useEffect(() => {
        if (dbMessages?.data) {
            setMessages(dbMessages.data);
        }
    }, [dbMessages]);

    const handleEnterPress = (e) => {
        e.key === 'Enter' && handleSubmit()
    }

    const handleSubmit = () => {
        if (!message.trim()) return

        socket.emit(NEW_MESSAGE, {
            message,
            chatId,
            members: chatMembers,
        })
        setMessage('')
    }

    console.log(socket.id)

    const newMessageHandler = useCallback((res) => {
        console.log("New message received:", res);
        setMessages((prev) => [...prev, res.message])
    }, []);

    const events = { [NEW_MESSAGE]: newMessageHandler }

    useSocketEvent(socket, events)

    return (
        <>
            <div className="bg-glass-background bg-center -mt-4">
                <div ref={containerRef} className='h-[85vh] p-2 pt-20 flex flex-col gap-4 overflow-y-auto scrollbar-hide backdrop-blur-lg backdrop-saturate-[100%] bg-[rgba(33,26,42,0.75)]'>
                    {msgLoading ? (
                        <div>Fetching messages...</div>
                    ) : (
                        messages.map((message) => (
                            <ChatBox
                                key={message._id}
                                chatData={message}
                                isGroupChat={isGroupChat}
                            />
                        ))
                    )}
                </div>
            </div>

            <ChatInput
                value={message}
                disabled={isLoading}
                autoFocus={true} // won't work bcoz of isLoading
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleEnterPress}
                handleSubmit={handleSubmit}
                className={'text-body-700 placeholder:text-body-300'}
                placeholder={'Type Message here...'}
            />
        </>
    )
}

export default ChatsViewPanel