import TabView from '@/components/ui/swipeable-tabs/TabView';
import { useSocket } from '@/socket/SocketProvider';
import useSocketEvent from '@/hooks/shared/useSocketEvent';
import { SOCKET_EVENTS } from '@/constants/socket';
import {
  useMyChatsQuery,
  useGetMyNotificationsQuery,
} from '@/hooks/chat';
import ChatList from '@/components/chat/list/ChatList';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNotificationsStore } from '@/stores/notifications';
import GridAllIcon from '@/components/ui/icons/GridAll';
import ChatIcon from '@/components/ui/icons/Chat';
import MembersIcon from '@/components/ui/icons/Members';
import type { ChatsResponse, NewMessagePayload, ChatReadPayload } from '@/types/chat';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/chat';
import { useAuthStore } from '@/stores/auth';

const tabsData = [
  { id: 'allchats', name: 'All Chats',  icon: <GridAllIcon className="h-4 w-4" /> },
  { id: 'personal', name: 'Personal',   icon: <ChatIcon className="h-4 w-4" /> },
  { id: 'group',    name: 'Groups',     icon: <MembersIcon className="h-5 w-5" /> },
];

type ChatTabViewProps = {
  searchText: string;
};

const ChatTabView = ({ searchText }: ChatTabViewProps) => {
  const { data: chats, isLoading } = useMyChatsQuery();
  const { data: notificationsData } = useGetMyNotificationsQuery();
  const syncMessageNotificationsFromServer = useNotificationsStore(
    (s) => s.syncMessageNotificationsFromServer,
  );
  const syncRequestNotificationsFromServer = useNotificationsStore(
    (s) => s.syncRequestNotificationsFromServer,
  );

  // Stable insert-time map: records when each chatId was first seen this session.
  // New empty chats (from accepted requests) get Date.now() so they sort to top.
  // Once a real lastMessage arrives its createdAt takes over naturally.
  const seenChatIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);
  const [chatInsertTimes, setChatInsertTimes] = useState<Record<string, number>>({});
  const socket = useSocket();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?._id);

  const chatsData = (chats as ChatsResponse | undefined)?.data;

  // Track insert time for every chatId we see. Empty chats (no lastMessage) that
  // appear for the first time get Date.now() so they sort to top exactly once —
  // subsequent message activity naturally overtakes the insert time.
  useEffect(() => {
    if (!chatsData) return;
    const isInitialLoad = !initialLoadDoneRef.current;
    initialLoadDoneRef.current = true;

    const newEntries: Record<string, number> = {};
    for (const chat of chatsData) {
      if (!seenChatIdsRef.current.has(chat._id)) {
        seenChatIdsRef.current.add(chat._id);
        newEntries[chat._id] = chat.lastMessage?.createdAt
          ? Date.parse(chat.lastMessage.createdAt)
          : isInitialLoad
            ? (chat.createdAt ? Date.parse(chat.createdAt) : 0)
            : Date.now();
      }
    }
    if (Object.keys(newEntries).length > 0) {
      setChatInsertTimes((prev) => ({ ...prev, ...newEntries }));
    }
  }, [chatsData]);

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
    const count = (notificationsData as { data?: unknown[] } | undefined)?.data?.length ?? 0;
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
