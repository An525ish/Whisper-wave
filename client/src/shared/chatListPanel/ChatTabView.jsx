import TabView from '@/components/ui/swipable-tabs/TabView';
import { useSocket } from '@/hooks/socketContext';
import useSocketEvent from '@/hooks/socketEvent';
import { REFETCH_CHATS } from '@/lib/socketConstants';
import { useMyChatsQuery } from '@/redux/reducers/apis/api';
import ChatList from '@/shared/chatListPanel/ChatList';
import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

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

    const { data: chats, isLoading, refetch } = useMyChatsQuery();
    const { messageNotifications } = useSelector(state => state.chat)

    const socket = useSocket()

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

    const personalChats = filteredChats(chats?.data?.filter((chat) => !chat.groupChat));
    const groupChats = filteredChats(chats?.data?.filter((chat) => chat.groupChat));
    const allChats = filteredChats(chats?.data);

    const refetchChatListener = useCallback(() => {
        refetch()
    }, [refetch]
    )

    useEffect(() => {
        refetch()
    }, [refetch])

    const events = {
        [REFETCH_CHATS]: refetchChatListener
    }

    useSocketEvent(socket, events)

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
                            newMessageAlert={messageNotifications}
                        />
                    ))
                }
            </TabView>
        </>
    );
};

export default ChatTabView;
