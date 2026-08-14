import TabView from '@/shared/components/ui/swipeable-tabs/TabView';
import { useSocket } from '@/socket/SocketProvider';
import useSocketEvent from '@/shared/hooks/useSocketEvent';
import { SOCKET_EVENTS } from '@/shared/constants/socketEvents';
import {
  useMarkChatReadMutation,
  useMyChatsQuery,
} from '@/features/chat/hooks';
import ChatList from '@/features/chat/components/list/ChatList';
import { useCallback, useEffect } from 'react';
import { useNotificationsStore } from '@/features/notifications/store';
import GridAllIcon from '@/shared/components/icons/GridAll';
import ChatIcon from '@/shared/components/icons/Chat';
import MembersIcon from '@/shared/components/icons/Members';

type ChatRow = {
  _id: string;
  name: string;
  avatar?: string | string[];
  groupChat?: boolean;
  members?: string[];
  unreadCount?: number;
  lastMessage?: {
    content?: string;
    createdAt?: string;
    isRead?: boolean;
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
    icon: <GridAllIcon className="h-4 w-4" />,
  },
  1: {
    id: 'personal',
    name: 'Personal',
    icon: <ChatIcon className="h-4 w-4" />,
  },
  2: {
    id: 'group',
    name: 'Groups',
    icon: <MembersIcon className="h-5 w-5" />,
  },
});

type ChatTabViewProps = {
  searchText: string;
};

const ChatTabView = ({ searchText }: ChatTabViewProps) => {
  const { data: chats, isLoading, refetch } = useMyChatsQuery();
  const syncMessageNotificationsFromServer = useNotificationsStore(
    (s) => s.syncMessageNotificationsFromServer,
  );
  const removeMessageNotification = useNotificationsStore(
    (s) => s.removeMessageNotification,
  );
  const markReadMutation = useMarkChatReadMutation();
  const socket = useSocket();

  const handleMarkRead = (chatId: string) => {
    removeMessageNotification({ chatId });
    markReadMutation.mutate({ chatId });
  };

  const filteredChats = (chatList: ChatRow[] | undefined) => {
    return chatList?.filter((chat) =>
      chat.name.toLowerCase().includes(searchText.toLowerCase()),
    );
  };

  /** WhatsApp-style: most recent lastMessage first; unread is badge-only. */
  const sortByRecent = (chatList: ChatRow[] | undefined) => {
    if (!chatList) return chatList;
    return [...chatList].sort((a, b) => {
      const aTime = a.lastMessage?.createdAt
        ? Date.parse(a.lastMessage.createdAt)
        : 0;
      const bTime = b.lastMessage?.createdAt
        ? Date.parse(b.lastMessage.createdAt)
        : 0;
      return bTime - aTime;
    });
  };

  const chatsData = (chats as ChatsResponse | undefined)?.data;

  useEffect(() => {
    if (!chatsData) return;
    syncMessageNotificationsFromServer(
      chatsData.map((chat) => ({
        chatId: chat._id,
        count: chat.unreadCount ?? 0,
      })),
    );
  }, [chatsData, syncMessageNotificationsFromServer]);

  const personalChats = sortByRecent(
    filteredChats(chatsData?.filter((chat) => !chat.groupChat)),
  );
  const groupChats = sortByRecent(
    filteredChats(chatsData?.filter((chat) => chat.groupChat)),
  );
  const allChats = sortByRecent(filteredChats(chatsData));

  const refetchChatListener = useCallback(() => {
    refetch();
  }, [refetch]);

  const events = {
    [SOCKET_EVENTS.REFETCH_CHATS]: refetchChatListener,
  };

  useSocketEvent(socket, events);

  return (
    <TabView tabsData={tabsData}>
      {(activeTabIndex: number) =>
        Object.values(tabsData).map((tab) => (
          <ChatList
            key={tab.id}
            type={tab.id}
            isLoading={isLoading}
            chats={
              activeTabIndex == 1
                ? personalChats
                : activeTabIndex == 2
                  ? groupChats
                  : allChats
            }
            onMarkRead={handleMarkRead}
          />
        ))
      }
    </TabView>
  );
};

export default ChatTabView;
