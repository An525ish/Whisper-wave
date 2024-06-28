import { useChatDetailsQuery, useGetMessagesQuery, useSendAttachmentsMutation } from "@/redux/reducers/apis/api"
import ChatBox from "./ChatBox"
import ChatInput from "./ChatInput"
import { useState, useEffect, useCallback, useRef } from "react"
import { useSocket } from "@/hooks/socketContext"
import useErrors from "@/hooks/error"
import { NEW_MESSAGE } from "@/lib/socketConstants"
import useSocketEvent from "@/hooks/socketEvent"
// import { useInfiniteScrollTop } from "@/hooks/infiniteScroll"
import useAsyncMutation from "@/hooks/asyncMutation"
import { useSelector } from "react-redux"

const ChatsViewPanel = ({ chatId }) => {
    const socket = useSocket()
    const containerRef = useRef()
    const [page, setPage] = useState(1)

    const { user } = useSelector(state => state.auth)

    const { data: dbMessages, isLoading: msgLoading, error: dbError, isError: dbIsError } = useGetMessagesQuery({ chatId, page }, { skip: !chatId })

    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])
    const [attachments, setAttachments] = useState([])

    const { data: chatDetails, isLoading, error, isError } = useChatDetailsQuery(
        { id: chatId },
        { skip: !chatId }
    )

    const chatMembers = chatDetails?.data?.members
    const isGroupChat = dbMessages?.groupChat
    // const totalPages = dbMessages?.totalPages

    useErrors([{ error, isError }, { dbError, dbIsError }])

    const [sendAttachments, { data: result }] = useAsyncMutation(useSendAttachmentsMutation);

    // const { data: updatedDbMessages } = useInfiniteScrollTop(
    //     containerRef,
    //     totalPages,
    //     page,
    //     setPage,
    //     dbMessages?.data
    // )

    // console.log(updatedDbMessages)

    useEffect(() => {
        if (dbMessages?.data) {
            setMessages(dbMessages.data);
        }
    }, [dbMessages]);

    const handleEnterPress = (e) => {
        e.key === 'Enter' && handleSubmit()
    }

    const [isUploading, setIsUploading] = useState(false);
    console.log(messages)

    const handleSubmit = async () => {
        if (!message.trim() && (!attachments || attachments.length === 0)) return;

        if (!attachments || attachments.length === 0) {
            socket.emit('NEW_MESSAGE', {
                message,
                chatId,
                members: chatMembers,
            });
            setMessage('');
        } else {
            setIsUploading(true);
            const tempId = Date.now();
            const tempMessage = {
                _id: tempId,
                content: message,
                sender: { _id: user._id, name: user.name, avatar: user.avatar },
                attachments: attachments.map(file => ({
                    tempUrl: URL.createObjectURL(file),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    uploading: true,
                })),
                createdAt: new Date().toISOString(),
                isUploading: true,
            };

            // Add new message
            setMessages(prev => [...prev, tempMessage]);

            setMessage('');
            setAttachments([]);

            const formData = new FormData();
            formData.append("chatId", chatId);
            formData.append("content", message);
            attachments.forEach((attachment) => formData.append("files", attachment));

            try {
                const result = await sendAttachments('', formData);

                if (result) {
                    const newMessageFromServer = {
                        ...result,
                        attachments: result.attachments.map((att, index) => ({
                            ...att,
                            tempUrl: tempMessage.attachments[index].tempUrl,
                            uploading: false,
                        })),
                    };

                    setMessages(prev => prev.map(msg =>
                        msg._id === tempId ? newMessageFromServer : msg
                    ));
                } else {
                    setMessages(prev => prev.map(msg =>
                        msg._id === tempId ? { ...msg, isUploading: false } : msg
                    ));
                }
            } catch (error) {
                console.error('Failed to send attachments', error);
                setMessages(prev => prev.map(msg =>
                    msg._id === tempId ? { ...msg, isUploading: false, error: true } : msg
                ));
            } finally {
                setIsUploading(false);
            }
        }
    };

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
                                key={message?._id}
                                chatData={message}
                                isGroupChat={isGroupChat}
                            />
                        ))
                    )}
                </div>
            </div>

            <ChatInput
                message={message}
                setMessage={setMessage}
                disabled={isLoading}
                autoFocus={true} // won't work bcoz of isLoading
                onKeyDown={handleEnterPress}
                handleSubmit={handleSubmit}
                attachments={attachments}
                setAttachments={setAttachments}
                className={'text-body-700 placeholder:text-body-300'}
                placeholder={'Type Message here...'}
            />
        </>
    )
}

export default ChatsViewPanel