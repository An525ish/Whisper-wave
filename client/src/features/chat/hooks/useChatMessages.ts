import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import dayjs from 'dayjs';
import useSocketEvent from '@/shared/hooks/useSocketEvent';
import { SOCKET_EVENTS } from '@/shared/constants/socket';
import { queryKeys } from '.';
import { useNotificationsStore } from '@/features/notifications';
import { formatChatDayLabel } from '@/shared/utils/helpers';
import { useInfiniteMessagesQuery, useMarkChatReadMutation } from './useMessageQueries';
import { useAuthStore } from '@/features/auth';
import type {
  ChatClearedPayload,
  ChatMessage,
  ChatReadPayload,
  MessageReactionPayload,
  MessageUpdatedPayload,
  MessagesDeletedPayload,
  MessagesPage,
  NewMessagePayload,
  TimelineItem,
  SocketUser,
} from '../types/chat';

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
  const [socketPeerReadAt, setSocketPeerReadAt] = useState<string | null>(null);
  const [stateChatId, setStateChatId] = useState(chatId);
  if (stateChatId !== chatId) {
    // Reset all live state on chat switch.
    setStateChatId(chatId);
    setLiveMessages([]);
    setSocketPeerReadAt(null);
  }

  const historyMessages = useMemo(() => {
    const pages = (messagesData?.pages ?? []) as MessagesPage[];
    return [...pages].reverse().flatMap((page) => page.data ?? []);
  }, [messagesData?.pages]);

  const historyIds = useMemo(() => new Set(historyMessages.map((m) => m._id)), [historyMessages]);

  // Drop live copies once history contains them (prevents duplicate keys in the virtualizer).
  if (liveMessages.length > 0) {
    const pruned = liveMessages.filter(
      (m) => m.isUploading || m._id.startsWith('pending-') || !historyIds.has(m._id),
    );
    if (pruned.length !== liveMessages.length) setLiveMessages(pruned);
  }

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

  const invalidateMessages = useCallback(() => {
    if (!chatId) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId) });
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

  const markReadOnChatSwitch = useEffectEvent(markCurrentChatRead);
  useEffect(() => {
    markReadOnChatSwitch();
  }, [chatId]);

  // Peer read tracking: latest of what history shows and what the socket reported.
  const myId = user?._id ? String(user._id) : '';
  const peerLastReadAt = useMemo(() => {
    let latest = socketPeerReadAt;
    if (isGroupChat || !myId) return latest;
    const me = myId;
    for (const msg of historyMessages) {
      if (String(msg.sender._id) !== me) continue;
      if (!msg.createdAt || !(msg.readBy ?? []).some((id) => String(id) !== me)) continue;
      if (!latest || dayjs(msg.createdAt).isAfter(dayjs(latest))) latest = msg.createdAt;
    }
    return latest;
  }, [historyMessages, isGroupChat, socketPeerReadAt, myId]);

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
      setSocketPeerReadAt((prev) =>
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

  const messageReactionListener = useCallback(
    (res: MessageReactionPayload) => {
      if (res.chatId !== chatId) return;
      const patch = (m: ChatMessage) =>
        m._id === res.messageId ? { ...m, reactions: res.reactions } : m;
      // Patch the live (in-session) layer
      setLiveMessages((prev) => prev.map(patch));
      // Patch the query-cache layer so history messages also update
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        queryKeys.messages(chatId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data?.map(patch),
            })),
          };
        },
      );
    },
    [chatId, queryClient, setLiveMessages],
  );

  const socketEvents = useMemo(
    () => ({
      [SOCKET_EVENTS.NEW_MESSAGE]: newMessageListener,
      [SOCKET_EVENTS.CHAT_READ]: chatReadListener,
      [SOCKET_EVENTS.MESSAGE_UPDATED]: messageUpdatedListener,
      [SOCKET_EVENTS.MESSAGES_DELETED]: messagesDeletedListener,
      [SOCKET_EVENTS.CHAT_CLEARED]: chatClearedListener,
      [SOCKET_EVENTS.MESSAGE_REACTION]: messageReactionListener,
    }),
    [chatReadListener, chatClearedListener, messageUpdatedListener, messagesDeletedListener, newMessageListener, messageReactionListener],
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
    peerLastReadAt,
    invalidateMessages,
    applyDeletedMessages,
    applyUpdatedMessage,
  };
}
