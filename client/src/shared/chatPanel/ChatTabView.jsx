import { useParams } from 'react-router-dom';
import ChatList from '@/shared/chatPanel/ChatList';
import TabView from '@/components/ui/swipable-tabs/TabView';
import { chats } from '@/lib/samples';

const tabsData = Object.freeze({
    0: {
        id: 'allchats',
        name: 'All Chats',
    },
    1: {
        id: 'personal',
        name: 'Personal',
    },
    2: {
        id: 'groups',
        name: 'Groups',
    },
});

const ChatTabView = () => {
    const { chatId } = useParams()

    const handleDeleteChat = (e, _id, groupChat) => {
        e.preventDefault()
        console.log('delete', _id, groupChat)
    }

    const personalChats = chats.filter((chat) => !chat.groupChat)
    const groupChats = chats.filter((chat) => chat.groupChat)

    return (
        <>
            <TabView tabsData={tabsData}>
                {(activeTabIndex) => (
                    Object.values(tabsData).map((tab) => (
                        <ChatList
                            key={tab.id}
                            chats={activeTabIndex == 1 ? personalChats : activeTabIndex == 2 ? groupChats : chats}
                            chatId={chatId}
                            handleDeleteChat={handleDeleteChat}
                        />
                    ))
                )}
            </TabView>
        </>
    )
}

export default ChatTabView
