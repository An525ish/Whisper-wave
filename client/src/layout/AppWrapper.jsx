import { useSocket } from '@/hooks/socketContext'
import useSocketEvent from '@/hooks/socketEvent'
import { NEW_MESSAGE_ALERT, NEW_REQUEST } from '@/lib/socketConstants'
import { addMessageNotification, incrementRequestNotification } from '@/redux/reducers/chat'
import Title from '@/shared/Title'
import ChatListPanel from '@/shared/chatListPanel/ChatListPanel'
import ProfileHeader from '@/shared/profilePanel/ProfileHeader'
import ProfilePanel from '@/shared/profilePanel/ProfilePanel'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'

const AppWrapper = ({ children }) => {
    const socket = useSocket()
    const { chatId } = useParams()

    const dispatch = useDispatch()

    const newMessageAlertHandler = useCallback((res) => {
        if (res.chatId === chatId) return
        dispatch(addMessageNotification({ chatId: res.chatId }))
    }, [dispatch, chatId])

    const newRequestHandler = useCallback(() => {
        dispatch(incrementRequestNotification())
    }, [dispatch])


    const events = {
        [NEW_MESSAGE_ALERT]: newMessageAlertHandler,
        [NEW_REQUEST]: newRequestHandler
    }

    useSocketEvent(socket, events)

    return (
        <>
            <Title />

            <main className='flex gap-4 h-[100vh] p-4'>
                <div className='flex-[1] rounded-lg hidden sm:block'>
                    <ChatListPanel />
                </div>

                <div className='flex-[2]'>{children}</div>

                <div className='flex-[1] hidden lg:block'>
                    <ProfileHeader />
                    <ProfilePanel />
                </div>
            </main>
        </>
    )
}

export default AppWrapper