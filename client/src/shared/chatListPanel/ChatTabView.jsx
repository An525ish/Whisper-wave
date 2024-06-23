import ChatList from '@/shared/chatListPanel/ChatList';
import TabView from '@/components/ui/swipable-tabs/TabView';
import { useMyChatsQuery } from '@/redux/reducers/apis/api';

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
        id: 'group',
        name: 'Groups',
    },
});

const ChatTabView = ({ searchText }) => {
    const { data, isLoading } = useMyChatsQuery();

    const handleDeleteChat = (e, _id, groupChat) => {
        e.preventDefault();
        console.log('delete', _id, groupChat);
    };

    // Filter chats based on search text
    const filteredChats = (chats) => {
        return chats?.filter((chat) =>
            chat.name.toLowerCase().includes(searchText.toLowerCase())
        );
    };

    const personalChats = filteredChats(data?.chats?.filter((chat) => !chat.groupChat));
    const groupChats = filteredChats(data?.chats?.filter((chat) => chat.groupChat));
    const allChats = filteredChats(data?.chats);

    return (
        <>
            <TabView tabsData={tabsData}>
                {(activeTabIndex) =>
                    Object.values(tabsData).map((tab) => (
                        <ChatList
                            key={tab.id}
                            type={tab.id}
                            isLoading={isLoading}
                            chats={
                                activeTabIndex == 1 ? personalChats
                                    : activeTabIndex == 2 ? groupChats
                                        : allChats
                            }
                            handleDeleteChat={handleDeleteChat}
                        />
                    ))
                }
            </TabView>
        </>
    );
};

export default ChatTabView;
