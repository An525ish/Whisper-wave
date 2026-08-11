import TabView from '@/components/ui/swipable-tabs/TabView';
import { useSocket } from '@/socket/SocketProvider';
import useSocketEvent from '@/hooks/socketEvent';
import { REFETCH_CHATS } from '@/lib/socketConstants';
import { useMyChatsQuery } from '@/features/api/hooks';
import ChatList from '@/shared/chatListPanel/ChatList';
import { useCallback, useEffect, type MouseEvent } from 'react';
import { useNotificationsStore } from '@/stores/notifications';

type ChatRow = {
    _id: string;
    name: string;
    avatar?: string | string[];
    groupChat?: boolean;
    members?: string[];
    lastMessage?: {
        content?: string;
        createdAt?: string;
        sender?: { _id: string; name?: string };
    } | null;
};

type ChatsResponse = {
    data?: ChatRow[];
};

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

type ChatTabViewProps = {
    searchText: string;
};

const ChatTabView = ({ searchText }: ChatTabViewProps) => {

    const { data: chats, isLoading, refetch } = useMyChatsQuery();
    const messageNotifications = useNotificationsStore((s) => s.messageNotifications);

    const socket = useSocket()

    const handleDeleteChat = (e: MouseEvent, _id: string, groupChat?: boolean) => {
        e.preventDefault();
        console.log('delete', _id, groupChat);
    };

    // Filter chats based on search text
    const filteredChats = (chatList: ChatRow[] | undefined) => {
        return chatList?.filter((chat) =>
            chat.name.toLowerCase().includes(searchText.toLowerCase())
        );
    };

    const chatsData = (chats as ChatsResponse | undefined)?.data;
    const personalChats = filteredChats(chatsData?.filter((chat) => !chat.groupChat));
    const groupChats = filteredChats(chatsData?.filter((chat) => chat.groupChat));
    const allChats = filteredChats(chatsData);

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
                {(activeTabIndex: number) =>
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
