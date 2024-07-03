import useErrors from "@/hooks/error"
import { useSocket } from "@/hooks/socketContext"
import useSocketEvent from "@/hooks/socketEvent"
import { NEW_MESSAGE, START_TYPING, STOP_TYPING } from "@/lib/socketConstants"
import { useChatDetailsQuery, useGetMessagesQuery, useSendAttachmentsMutation } from "@/redux/reducers/apis/api"
import { useCallback, useEffect, useRef, useState } from "react"
import ChatBox from "./ChatBox"
import ChatInput from "./ChatInput"
import { useInfiniteScrollTop } from "@/hooks/infiniteScroll"
import useAsyncMutation from "@/hooks/asyncMutation"
import { removeMessageNotification } from "@/redux/reducers/chat"
import { useDispatch, useSelector } from "react-redux"
import SkeletonBox from "@/components/skeletons/SkeletonBox"


const ChatsViewPanel = ({ chatId }) => {
    const socket = useSocket()
    const dispatch = useDispatch()
    const containerRef = useRef()
    const lastMessageRef = useRef(null);
    const timeoutRef = useRef()
    const [page, setPage] = useState(1)

    const { user } = useSelector(state => state.auth)

    const { data: dbMessages, isLoading: msgLoading, error: dbError, isError: dbIsError } = useGetMessagesQuery({ chatId, page }, { skip: !chatId })

    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])
    const [attachments, setAttachments] = useState([])
    const [isTyping, setIsTyping] = useState(false)

    const { data: chatDetails, isLoading, error, isError } = useChatDetailsQuery(
        { id: chatId },
        { skip: !chatId }
    )

    const chatMembers = chatDetails?.data?.members
    const isGroupChat = dbMessages?.groupChat
    const totalPages = dbMessages?.totalPages

    useErrors([{ error, isError }, { dbError, dbIsError }])

    const [sendAttachments] = useAsyncMutation(useSendAttachmentsMutation);

    const { data: oldMessages, setData: setOldMessages } = useInfiniteScrollTop(
        containerRef,
        totalPages,
        page,
        setPage,
        dbMessages?.data
    )

    const scrollToBottom = useCallback(() => {
        lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const handleEnterPress = (e) => {
        e.key === 'Enter' && handleSubmit()
    }

    // console.log(messages)

    // Scroll when chat opens or messages change
    useEffect(() => {
        scrollToBottom();
    }, [chatId, messages, scrollToBottom]);

    const handleSubmit = async () => {
        if (!message.trim() && (!attachments || attachments.length === 0)) return;

        if (!attachments || attachments.length === 0) {
            socket.emit(NEW_MESSAGE, {
                message,
                chatId,
                members: chatMembers,
            });
            setMessage('');
            scrollToBottom();
        } else {
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
                    scrollToBottom();
                } else {
                    setMessages(prev => prev.filter(msg => msg._id !== tempId));
                }
            } catch (error) {
                console.error('Failed to send attachments', error);
                setMessages(prev => prev.filter(msg => msg._id !== tempId));
            }
        }
    };



    const newMessageListener = useCallback((res) => {
        if (res.chatId === chatId) {
            setMessages((prev) => [...prev, res.message])
            scrollToBottom();
        }
    }, [chatId, scrollToBottom]);


    const handleMessageChange = (e) => {
        setMessage(e.target.value)

        if (!isTyping) {
            setIsTyping(true)
            socket.emit(START_TYPING, { members: chatMembers, chatId })
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current)

        timeoutRef.current = setTimeout(() => {
            setIsTyping(false)
            socket.emit(STOP_TYPING, { members: chatMembers, chatId })
        }, 1000);
    }

    const events = {
        [NEW_MESSAGE]: newMessageListener
    }

    useSocketEvent(socket, events)

    useEffect(() => {
        dispatch(removeMessageNotification({ chatId }))

        return () => {
            setMessage('')
            setMessages([])
            setOldMessages([])
            setAttachments([])
            setPage(1)
        }
    }, [chatId, dispatch, setOldMessages])

    const allMessages = [...oldMessages, ...messages]

    return (
        <>
            <div className="bg-glass-background bg-center -mt-4">
                <div ref={containerRef} className='h-[85vh] p-2 pt-20 flex flex-col gap-4 overflow-y-auto scrollbar-hide backdrop-blur-lg backdrop-saturate-[100%] bg-[rgba(33,26,42,0.75)]'>
                    {msgLoading ? (
                        <div className="flex flex-col gap-2">
                            <SkeletonBox className={'w-40 rounded-e-[2rem] border-2 border-green-light rounded-b-xl'} />
                            <SkeletonBox className={'w-52 self-end border-2 border-green-light rounded-b-xl rounded-s-[2rem]'} />
                            <SkeletonBox className={'w-60 rounded-e-[2rem] border-2 border-green-light rounded-b-xl'} />
                            <SkeletonBox className={'w-60 self-end border-2 border-green-light rounded-b-xl rounded-s-[2rem]'} />
                            <SkeletonBox className={'w-40 rounded-e-[2rem] border-2 border-green-light rounded-b-xl'} />
                            <SkeletonBox className={'w-52 self-end border-2 border-green-light rounded-b-xl rounded-s-[2rem]'} />
                        </div>
                    ) : (
                        allMessages.map((message, index) => {
                            const sameSender = message.sender._id === user._id

                            return (
                                <div className={`${sameSender ? 'self-end' : 'self-start'} max-w-[70%] w-fit`} key={message?._id} ref={index === allMessages.length - 1 ? lastMessageRef : null}>
                                    <ChatBox
                                        chatData={message}
                                        isGroupChat={isGroupChat}
                                    />
                                </div>
                            )
                        })
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
                onChange={handleMessageChange}
                attachments={attachments}
                setAttachments={setAttachments}
                className={'text-body-700 placeholder:text-body-300'}
                placeholder={'Type Message here...'}
            />
        </>
    )
}

export default ChatsViewPanel