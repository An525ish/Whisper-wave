import TabView from '@/components/ui/swipable-tabs/TabView'
import ChatHeader from './ChatHeader'

const ChatListPanel = () => {
    return (
        <div className='max-w-[25rem]'>
            <ChatHeader />
            <TabView />
        </div>
    )
}

export default ChatListPanel