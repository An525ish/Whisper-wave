import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import dayjs from 'dayjs';
import useSocketEvent from '@/hooks/shared/useSocketEvent';
import { SOCKET_EVENTS } from '@/constants/socket';
import { queryKeys } from '@/hooks/chat';
import { useNotificationsStore } from '@/stores/notifications';
import { formatChatDayLabel } from '@/utils/helpers';
import { useInfiniteMessagesQuery, useMarkChatReadMutation } from '@/hooks/chat/useMessageQueries';
import { useAuthStore } from '@/stores/auth';
import type {
  ChatClearedPayload,
  ChatMessage,
  ChatReadPayload,
  MessageUpdatedPayload,
  MessagesDeletedPayload,
  MessagesPage,
  NewMessagePayload,
  TimelineItem,
  SocketUser,
} from '@/types/chat';

interface Params {
  chatId: string | undefined;
  socket: Socket;
  user: SocketUser;
  isGroupChat?: boolean;
  onChatCleared?: () => void;
  onMessagesDeleted?: (messageIds: string[]) => void;
}

export function useChatMessages({
  chatId,
  socket,
  user,
  isGroupChat = false,
  onChatCleared,
  onMessagesDeleted,
}: Params) {
  const queryClient = useQueryClient();
  const removeMessageNotification = useNotificationsStore((s) => s.removeMessageNotification);
  const markReadMutation = useMarkChatReadMutation();
  const isImpersonated = useAuthStore((s) => s.isImpersonated);

  const {
    data: messagesData,
    isLoading: msgLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error: dbError,
    isError: dbIsError,
  } = useInfiniteMessagesQuery(chatId);

  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [peerLastReadAt, setPeerLastReadAt] = useState<string | null>(null);

  const historyMessages = useMemo(() => {
    const pages = (messagesData?.pages ?? []) as MessagesPage[];
    return [...pages].reverse().flatMap((page) => page.data ?? []);
  }, [messagesData?.pages]);

  // Drop live copies once history contains them (prevents duplicate keys in the virtualizer).
  useEffect(() => {
    if (liveMessages.length === 0) return;
    const historyIds = new Set(historyMessages.map((m) => m._id));
    setLiveMessages((prev) => {
      const next = prev.filter(
        (m) =>
          m.isUploading ||
          m._id.startsWith('pending-') ||
          !historyIds.has(m._id),
      );
      return next.length === prev.length ? prev : next;
    });
  }, [historyMessages, liveMessages.length]);

  const allMessages = useMemo(() => {
    const seen = new Set<string>();
    const liveById = new Map(liveMessages.map((m) => [m._id, m]));
    const merged: ChatMessage[] = [];

    for (const msg of historyMessages) {
      if (seen.has(msg._id)) continue;
      seen.add(msg._id);
      merged.push(liveById.get(msg._id) ?? msg);
    }
    for (const msg of liveMessages) {
      if (seen.has(msg._id)) continue;
      seen.add(msg._id);
      merged.push(msg);
    }
    return merged;
  }, [historyMessages, liveMessages]);

  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];
    let lastDayKey = '';
    for (const msg of allMessages) {
      const dayKey = dayjs(msg.createdAt).format('YYYY-MM-DD');
      if (dayKey !== lastDayKey) {
        items.push({ kind: 'day', key: `day-${dayKey}`, label: formatChatDayLabel(msg.createdAt) });
        lastDayKey = dayKey;
      }
      items.push({ kind: 'message', key: msg._id, message: msg });
    }
    return items;
  }, [allMessages]);

  const timelineRef = useRef<TimelineItem[]>(timelineItems);
  timelineRef.current = timelineItems;

  const invalidateMessages = useCallback(() => {
    if (!chatId) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
  }, [chatId, queryClient]);

  const applyDeletedMessages = useCallback((messageIds: string[]) => {
    const idSet = new Set(messageIds);
    setLiveMessages((prev) =>
      prev.map((msg) =>
        idSet.has(msg._id)
          ? { ...msg, isDeleted: true, content: undefined, attachments: [] }
          : msg,
      ),
    );
  }, []);

  const applyUpdatedMessage = useCallback((message: ChatMessage) => {
    setLiveMessages((prev) => {
      const idx = prev.findIndex((m) => m._id === message._id);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], ...message };
      return next;
    });
  }, []);

  const markCurrentChatRead = useCallback(() => {
    if (!chatId) return;
    removeMessageNotification({ chatId });
    // Ghost mode: skip read marking — would clear unread badges and send read receipts.
    if (!isImpersonated) markReadMutation.mutate({ chatId });
  }, [chatId, isImpersonated, markReadMutation, removeMessageNotification]);

  // Reset all live state on chat switch
  useEffect(() => {
    setLiveMessages([]);
    setPeerLastReadAt(null);
    if (chatId) {
      removeMessageNotification({ chatId });
      if (!isImpersonated) markReadMutation.mutate({ chatId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // Peer read tracking from history
  useEffect(() => {
    if (isGroupChat || !user?._id) return;
    let latest: string | null = null;
    for (const msg of historyMessages) {
      if (String(msg.sender._id) !== String(user._id)) continue;
      const readers = (msg.readBy ?? []).map(String);
      if (readers.some((id) => id !== String(user._id))) {
        if (!latest || dayjs(msg.createdAt).isAfter(dayjs(latest))) {
          latest = msg.createdAt ?? null;
        }
      }
    }
    if (latest) {
      setPeerLastReadAt((prev) =>
        !prev || dayjs(latest).isAfter(dayjs(prev)) ? latest : prev,
      );
    }
  }, [historyMessages, isGroupChat, user?._id]);

  // Socket listeners
  const newMessageListener = useCallback(
    (res: NewMessagePayload) => {
      if (res.chatId !== chatId) return;
      setLiveMessages((prev) => {
        if (prev.some((m) => m._id === res.message._id)) return prev;
        const pendingIdx = prev.findIndex(
          (m) =>
            m._id.startsWith('pending-') &&
            m.content === res.message.content &&
            String(m.sender._id) === String(res.message.sender._id),
        );
        if (pendingIdx >= 0) {
          const next = [...prev];
          next[pendingIdx] = res.message;
          return next;
        }
        return [...prev, res.message];
      });
      markCurrentChatRead();
    },
    [chatId, markCurrentChatRead],
  );

  const applyReadByUser = useCallback(
    (readerId: string, lastReadAt: string) => {
      const patchMessage = (msg: ChatMessage): ChatMessage => {
        if (String(msg.sender._id) !== String(user?._id ?? '')) return msg;
        if (msg.createdAt && dayjs(msg.createdAt).isAfter(dayjs(lastReadAt))) return msg;
        const readBy = new Set((msg.readBy ?? []).map(String));
        readBy.add(readerId);
        return { ...msg, readBy: Array.from(readBy) };
      };

      setLiveMessages((prev) => prev.map(patchMessage));

      if (!chatId) return;
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        queryKeys.messages(chatId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data?.map(patchMessage),
            })),
          };
        },
      );
    },
    [chatId, queryClient, user?._id],
  );

  const chatReadListener = useCallback(
    (res: ChatReadPayload) => {
      if (res.chatId !== chatId) return;
      if (String(res.userId) === String(user?._id ?? '')) return;
      setPeerLastReadAt((prev) =>
        !prev || dayjs(res.lastReadAt).isAfter(dayjs(prev)) ? res.lastReadAt : prev,
      );
      applyReadByUser(res.userId, res.lastReadAt);
    },
    [applyReadByUser, chatId, user?._id],
  );

  const messageUpdatedListener = useCallback(
    (res: MessageUpdatedPayload) => {
      if (res.chatId !== chatId) return;
      applyUpdatedMessage(res.message);
      invalidateMessages();
    },
    [applyUpdatedMessage, chatId, invalidateMessages],
  );

  const messagesDeletedListener = useCallback(
    (res: MessagesDeletedPayload) => {
      if (res.chatId !== chatId) return;
      applyDeletedMessages(res.messageIds);
      onMessagesDeleted?.(res.messageIds);
      invalidateMessages();
    },
    [applyDeletedMessages, chatId, invalidateMessages, onMessagesDeleted],
  );

  const chatClearedListener = useCallback(
    (res: ChatClearedPayload) => {
      if (res.chatId !== chatId) return;
      setLiveMessages([]);
      onChatCleared?.();
      invalidateMessages();
    },
    [chatId, invalidateMessages, onChatCleared],
  );

  const socketEvents = useMemo(
    () => ({
      [SOCKET_EVENTS.NEW_MESSAGE]: newMessageListener,
      [SOCKET_EVENTS.CHAT_READ]: chatReadListener,
      [SOCKET_EVENTS.MESSAGE_UPDATED]: messageUpdatedListener,
      [SOCKET_EVENTS.MESSAGES_DELETED]: messagesDeletedListener,
      [SOCKET_EVENTS.CHAT_CLEARED]: chatClearedListener,
    }),
    [chatReadListener, chatClearedListener, messageUpdatedListener, messagesDeletedListener, newMessageListener],
  );

  useSocketEvent(socket, socketEvents as Parameters<typeof useSocketEvent>[1]);

  return {
    messagesData,
    msgLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    dbError,
    dbIsError,
    liveMessages,
    setLiveMessages,
    historyMessages,
    allMessages,
    timelineItems,
    timelineRef,
    peerLastReadAt,
    markCurrentChatRead,
    invalidateMessages,
    applyDeletedMessages,
    applyUpdatedMessage,
  };
}
