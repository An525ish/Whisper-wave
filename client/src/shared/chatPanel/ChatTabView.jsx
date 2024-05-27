import { useParams } from 'react-router-dom';
import ChatList from '@/shared/chatPanel/ChatList';
import TabView from '@/components/ui/swipable-tabs/TabView';

const tabsData = Object.freeze({
    0: {
        id: 'chats',
        name: 'Chats',
    },
    1: {
        id: 'groups',
        name: 'Groups',
    },
    2: {
        id: 'archieved',
        name: 'Archieved',
    },
});

const chats = [
    {
        _id: "1",
        avatar: ["https://www.gravatar.com/avatar/2c7d99fe281ecd3bcd65ab915bac6dd5?s=250"],
        name: "John Doe",
        groupChat: false,
        members: ["1", "2"]
    },
    {
        _id: "2",
        avatar: ["https://avatar.iran.liara.run/public/boy?username=Ash"],
        name: "Marry Jain",
        groupChat: false,
        members: ["1", "2"]
    },
    {
        _id: "3",
        avatar: ["https://i.pravatar.cc/250?u=mail@ashallendesign.co.uk",
            "https://avatar.iran.liara.run/public/boy?username=Ash",
            "https://www.gravatar.com/avatar/2c7d99fe281ecd3bcd65ab915bac6dd5?s=250",
            "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=mail@ashallendesign.co.uk",
        ],
        name: "John Group",
        groupChat: true,
        members: ["1", "2"]
    },
]

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
                            chats={activeTabIndex == 0 ? personalChats : activeTabIndex == 1 ? groupChats : chats}
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
