import ChatHeader from './ChatHeader'
import ChatTabView from './ChatTabView'

const ChatListPanel = () => {
    return (
        <div className='max-w-[25rem]'>
            <ChatHeader />
            <ChatTabView />
        </div>
    )
}

export default ChatListPanel