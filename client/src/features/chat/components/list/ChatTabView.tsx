import TabView from '@/shared/components/ui/swipeable-tabs/TabView';
import { useSocket } from '@/shared/lib/socket/SocketProvider';
import useSocketEvent from '@/shared/hooks/useSocketEvent';
import { SOCKET_EVENTS } from '@/shared/constants/socket';
import {
  useMyChatsQuery,
  useGetMyNotificationsQuery,
} from '../../hooks';
import ChatList from './ChatList';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNotificationsStore } from '@/features/notifications';
import GridAllIcon from '@/shared/components/ui/icons/GridAll';
import ChatIcon from '@/shared/components/ui/icons/Chat';
import MembersIcon from '@/shared/components/ui/icons/Members';
import type { ChatRow, ChatsResponse, NewMessagePayload, ChatReadPayload } from '../../types/chat';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks';
import { useAuthStore } from '@/features/auth';

const tabsData = [
  { id: 'allchats', name: 'All Chats',  icon: <GridAllIcon className="h-4 w-4" /> },
  { id: 'personal', name: 'Personal',   icon: <ChatIcon className="h-4 w-4" /> },
  { id: 'group',    name: 'Groups',     icon: <MembersIcon className="h-5 w-5" /> },
];

type Props = {
  searchText: string;
};

const ChatTabView = ({ searchText }: Props) => {
  const { data: chats, isLoading, dataUpdatedAt } = useMyChatsQuery();
  const { data: notificationsData } = useGetMyNotificationsQuery();
  const syncMessageNotificationsFromServer = useNotificationsStore(
    (s) => s.syncMessageNotificationsFromServer,
  );
  const syncRequestNotificationsFromServer = useNotificationsStore(
    (s) => s.syncRequestNotificationsFromServer,
  );

  const socket = useSocket();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?._id);

  const chatsData = chats?.data;

  // Stable insert-time map: records when each chatId was first seen this session.
  // New empty chats (from accepted requests) get the fetch time so they sort to top
  // exactly once; once a real lastMessage arrives its createdAt takes over naturally.
  // Derived during render from the previous snapshot (no effect, no refs).
  const [tracked, setTracked] = useState<{
    source: ChatRow[] | undefined;
    times: Record<string, number>;
  }>({ source: undefined, times: {} });
  if (chatsData && chatsData !== tracked.source) {
    const isInitialLoad = tracked.source === undefined;
    const fresh = chatsData.filter((chat) => !(chat._id in tracked.times));
    const times =
      fresh.length === 0
        ? tracked.times
        : {
            ...tracked.times,
            ...Object.fromEntries(
              fresh.map((chat) => [
                chat._id,
                chat.lastMessage?.createdAt
                  ? Date.parse(chat.lastMessage.createdAt)
                  : isInitialLoad
                    ? (chat.createdAt ? Date.parse(chat.createdAt) : 0)
                    : dataUpdatedAt,
              ]),
            ),
          };
    setTracked({ source: chatsData, times });
  }
  const chatInsertTimes = tracked.times;

  useEffect(() => {
    if (!chatsData) return;
    syncMessageNotificationsFromServer(
      chatsData.map((chat) => ({
        chatId: chat._id,
        count: chat.unreadCount ?? 0,
      })),
    );
  }, [chatsData, syncMessageNotificationsFromServer]);

  useEffect(() => {
    const count = notificationsData?.data?.length ?? 0;
    syncRequestNotificationsFromServer(count);
  }, [notificationsData, syncRequestNotificationsFromServer]);

  /** Memoised full sorted+filtered lists — recomputed only when data, search, or insert times change. */
  const allChats = useMemo(() => {
    const filtered = chatsData?.filter((chat) =>
      chat.name.toLowerCase().includes(searchText.toLowerCase()),
    );
    if (!filtered) return filtered;
    return [...filtered].sort((a, b) => {
      const aMsg = a.lastMessage?.createdAt ? Date.parse(a.lastMessage.createdAt) : 0;
      const bMsg = b.lastMessage?.createdAt ? Date.parse(b.lastMessage.createdAt) : 0;
      return Math.max(bMsg, chatInsertTimes[b._id] ?? 0) - Math.max(aMsg, chatInsertTimes[a._id] ?? 0);
    });
  }, [chatsData, searchText, chatInsertTimes]);

  const personalChats = useMemo(() => allChats?.filter((c) => !c.groupChat), [allChats]);
  const groupChats    = useMemo(() => allChats?.filter((c) => c.groupChat),  [allChats]);

  const refetchChatListener = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
  }, [queryClient]);

  // Instantly patch lastMessage in the cache when any new message arrives —
  // avoids the full /get-my-chats round-trip for both sender and recipient.
  const newMessageChatListPatch = useCallback(
    (...args: unknown[]) => {
      const res = args[0] as NewMessagePayload;
      if (!res.chatId || !res.message) return;
      queryClient.setQueryData<ChatsResponse>(queryKeys.chats, (old) => {
        if (!old?.data) return old;
        const next = old.data.map((chat) =>
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
                  isRead: false,
                },
              },
        );
        return { ...old, data: next };
      });
    },
    [queryClient],
  );

  // When the peer reads, flip isRead on the last message in that chat.
  const chatReadChatListPatch = useCallback(
    (...args: unknown[]) => {
      const res = args[0] as ChatReadPayload;
      if (!res?.chatId || String(res.userId) === String(userId)) return;
      queryClient.setQueryData<ChatsResponse>(queryKeys.chats, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((chat) =>
            chat._id !== res.chatId || !chat.lastMessage
              ? chat
              : { ...chat, lastMessage: { ...chat.lastMessage, isRead: true } },
          ),
        };
      });
    },
    [queryClient, userId],
  );

  const events = useMemo(() => ({
    [SOCKET_EVENTS.REFETCH_CHATS]: refetchChatListener,
    [SOCKET_EVENTS.NEW_MESSAGE]: newMessageChatListPatch,
    [SOCKET_EVENTS.CHAT_READ]: chatReadChatListPatch,
  }), [refetchChatListener, newMessageChatListPatch, chatReadChatListPatch]);

  useSocketEvent(socket, events);

  const tabLists = [allChats, personalChats, groupChats];

  return (
    <TabView tabsData={tabsData}>
      {() =>
        tabsData.map((tab, i) => (
          <ChatList
            key={tab.id}
            type={tab.id}
            isLoading={isLoading}
            chats={tabLists[i]}
          />
        ))
      }
    </TabView>
  );
};

export default ChatTabView;
