import TabView from '@/components/ui/swipeable-tabs/TabView';
import { useSocket } from '@/socket/SocketProvider';
import useSocketEvent from '@/hooks/shared/useSocketEvent';
import { SOCKET_EVENTS } from '@/constants/socket';
import {
  useMyChatsQuery,
} from '@/hooks/chat';
import ChatList from '@/components/chat/list/ChatList';
import { useCallback, useEffect } from 'react';
import { useNotificationsStore } from '@/stores/notifications';
import GridAllIcon from '@/components/ui/icons/GridAll';
import ChatIcon from '@/components/ui/icons/Chat';
import MembersIcon from '@/components/ui/icons/Members';
import type { ChatRow, ChatsResponse, NewMessagePayload } from '@/types/chat';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/chat';
import { useAuthStore } from '@/stores/auth';

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
  const socket = useSocket();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?._id);

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

  // Instantly patch lastMessage in the cache when any new message arrives —
  // avoids the full /get-my-chats round-trip for both sender and recipient.
  const newMessageChatListPatch = useCallback(
    (...args: unknown[]) => {
      const res = args[0] as NewMessagePayload;
      if (!res.chatId || !res.message) return;
      queryClient.setQueryData<ChatsResponse>(queryKeys.chats, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((chat) =>
            chat._id !== res.chatId
              ? chat
              : {
                  ...chat,
                  lastMessage: {
                    content: res.message.content,
                    createdAt: res.message.createdAt,
                    sender: res.message.sender
                      ? { _id: String(res.message.sender._id), name: res.message.sender.name }
                      : undefined,
                    isRead: String(res.message.sender?._id) === String(userId),
                  },
                }
          ),
        };
      });
    },
    [queryClient, userId],
  );

  const events = {
    [SOCKET_EVENTS.REFETCH_CHATS]: refetchChatListener,
    [SOCKET_EVENTS.NEW_MESSAGE]: newMessageChatListPatch,
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
          />
        ))
      }
    </TabView>
  );
};

export default ChatTabView;
