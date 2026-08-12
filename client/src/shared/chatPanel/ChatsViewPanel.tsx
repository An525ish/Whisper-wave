import useErrors from '@/hooks/error';
import { useSocket } from '@/socket/SocketProvider';
import useSocketEvent from '@/hooks/socketEvent';
import {
  CHAT_READ,
  NEW_MESSAGE,
  START_TYPING,
  STOP_TYPING,
} from '@/lib/socketConstants';
import {
  useChatDetailsQuery,
  useInfiniteMessagesQuery,
  useMarkChatReadMutation,
  useSendAttachmentsMutation,
} from '@/features/api/hooks';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import dayjs from 'dayjs';
import ChatBox, { type ChatBoxData } from './ChatBox';
import ChatInput from './ChatInput';
import useAsyncMutation from '@/hooks/asyncMutation';
import { useNotificationsStore } from '@/stores/notifications';
import { useAuthStore } from '@/stores/auth';
import { ChatMessagesSkeleton } from '@/components/skeletons/ChatMessageSkeleton';
import toast from 'react-hot-toast';
import type { Avatar } from '@/types';
import { formatChatDayLabel, normalizeMemberIds } from '@/utils/helper';

type ChatsViewPanelProps = {
  chatId?: string;
  focusMessageId?: string | null;
  highlightQuery?: string;
  searchOpen?: boolean;
};

type ChatMessage = ChatBoxData & {
  _id: string;
  isUploading?: boolean;
  readBy?: string[];
};

type MessagesPage = {
  data?: ChatMessage[];
  groupChat?: boolean;
  totalPages?: number;
};

type ChatMember = string | { _id?: string };

type ChatDetailsResponse = {
  data?: {
    members?: ChatMember[];
  };
};

type NewMessagePayload = {
  chatId: string;
  message: ChatMessage;
};

type ChatReadPayload = {
  chatId: string;
  userId: string;
  lastReadAt: string;
  lastReadMessageId?: string;
};

type SendAttachmentsResult = {
  data?: ChatMessage;
  attachments?: ChatMessage['attachments'];
} & Partial<ChatMessage>;

type TimelineItem =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'message'; key: string; message: ChatMessage };

const NEAR_BOTTOM_PX = 120;

const ChatsViewPanel = ({
  chatId,
  focusMessageId = null,
  highlightQuery = '',
  searchOpen = false,
}: ChatsViewPanelProps) => {
  const socket = useSocket();
  const removeMessageNotification = useNotificationsStore(
    (s) => s.removeMessageNotification,
  );
  const user = useAuthStore((s) => s.user);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didInitialScrollRef = useRef(false);
  const timelineRef = useRef<TimelineItem[]>([]);
  const isNearBottomRef = useRef(true);
  const markReadMutation = useMarkChatReadMutation();

  const {
    data: messagesData,
    isLoading: msgLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error: dbError,
    isError: dbIsError,
  } = useInfiniteMessagesQuery(chatId);

  const [message, setMessage] = useState('');
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [peerLastReadAt, setPeerLastReadAt] = useState<string | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const { data: chatDetails, isLoading, error, isError } = useChatDetailsQuery(
    { id: chatId },
    { skip: !chatId },
  );

  const historyMessages = useMemo(() => {
    const pages = (messagesData?.pages ?? []) as MessagesPage[];
    return [...pages].reverse().flatMap((page) => page.data ?? []);
  }, [messagesData?.pages]);

  const isGroupChat = (messagesData?.pages?.[0] as MessagesPage | undefined)
    ?.groupChat;
  const memberIds = useMemo(
    () =>
      normalizeMemberIds(
        (chatDetails as ChatDetailsResponse | undefined)?.data?.members,
      ),
    [chatDetails],
  );

  const allMessages = useMemo(
    () => [...historyMessages, ...liveMessages],
    [historyMessages, liveMessages],
  );

  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];
    let lastDayKey = '';

    for (const msg of allMessages) {
      const dayKey = dayjs(msg.createdAt).format('YYYY-MM-DD');
      if (dayKey !== lastDayKey) {
        items.push({
          kind: 'day',
          key: `day-${dayKey}`,
          label: formatChatDayLabel(msg.createdAt),
        });
        lastDayKey = dayKey;
      }
      items.push({ kind: 'message', key: msg._id, message: msg });
    }

    return items;
  }, [allMessages]);

  timelineRef.current = timelineItems;

  useErrors([
    { error, isError },
    { error: dbError, isError: dbIsError },
  ]);

  const [sendAttachments] = useAsyncMutation(useSendAttachmentsMutation);

  const markCurrentChatRead = useCallback(() => {
    if (!chatId) return;
    removeMessageNotification({ chatId });
    markReadMutation.mutate({ chatId });
  }, [chatId, markReadMutation, removeMessageNotification]);

  const virtualizer = useVirtualizer({
    count: timelineItems.length,
    getScrollElement: () => containerRef.current,
    estimateSize: (index) =>
      timelineRef.current[index]?.kind === 'day' ? 44 : 88,
    overscan: 8,
    getItemKey: (index) => timelineItems[index]?.key ?? index,
  });
  const virtualizerRef = useRef(virtualizer);
  virtualizerRef.current = virtualizer;

  const scrollToBottom = useCallback((smooth = false) => {
    const count = timelineRef.current.length;
    if (count === 0) return;
    isNearBottomRef.current = true;
    setShowScrollToBottom(false);
    requestAnimationFrame(() => {
      virtualizerRef.current.scrollToIndex(count - 1, {
        align: 'end',
        behavior: smooth ? 'smooth' : 'auto',
      });
    });
  }, []);

  const updateNearBottom = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;
    const distance =
      root.scrollHeight - root.scrollTop - root.clientHeight;
    const near = distance <= NEAR_BOTTOM_PX;
    isNearBottomRef.current = near;
    setShowScrollToBottom(!near && timelineRef.current.length > 0);
  }, []);

  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const focusRequestRef = useRef<string | null>(null);
  const loadingForFocusRef = useRef(false);

  useEffect(() => {
    if (!focusMessageId) {
      focusRequestRef.current = null;
      return;
    }
    focusRequestRef.current = focusMessageId;
  }, [focusMessageId]);

  useEffect(() => {
    const targetId = focusRequestRef.current;
    if (!targetId) return;

    const index = timelineItems.findIndex(
      (item) => item.kind === 'message' && item.message._id === targetId,
    );

    if (index >= 0) {
      loadingForFocusRef.current = false;
      requestAnimationFrame(() => {
        virtualizerRef.current.scrollToIndex(index, {
          align: 'center',
          behavior: 'smooth',
        });
      });
      setHighlightedMessageId(targetId);
      const clearHighlight = setTimeout(() => {
        setHighlightedMessageId((prev) => (prev === targetId ? null : prev));
      }, 1750);
      return () => clearTimeout(clearHighlight);
    }

    if (!hasNextPage || isFetchingNextPage || loadingForFocusRef.current) {
      return;
    }

    loadingForFocusRef.current = true;
    void fetchNextPage().finally(() => {
      loadingForFocusRef.current = false;
    });
  }, [
    focusMessageId,
    timelineItems,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const onScroll = () => {
      updateNearBottom();

      if (root.scrollTop > 80) return;
      if (!hasNextPage || isFetchingNextPage) return;

      const prevHeight = root.scrollHeight;
      const prevTop = root.scrollTop;

      void fetchNextPage().then(() => {
        requestAnimationFrame(() => {
          const el = containerRef.current;
          if (!el) return;
          el.scrollTop = prevTop + (el.scrollHeight - prevHeight);
          updateNearBottom();
        });
      });
    };

    root.addEventListener('scroll', onScroll, { passive: true });
    return () => root.removeEventListener('scroll', onScroll);
  }, [
    chatId,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    updateNearBottom,
  ]);

  useEffect(() => {
    didInitialScrollRef.current = false;
    setLiveMessages([]);
    setMessage('');
    setAttachments([]);
    setPeerLastReadAt(null);
    setShowScrollToBottom(false);
    isNearBottomRef.current = true;
    if (chatId) {
      removeMessageNotification({ chatId });
      markReadMutation.mutate({ chatId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mark-read only on chat switch
  }, [chatId]);

  useEffect(() => {
    if (didInitialScrollRef.current || historyMessages.length === 0) return;
    didInitialScrollRef.current = true;
    scrollToBottom();
  }, [historyMessages.length, scrollToBottom]);

  useEffect(() => {
    if (liveMessages.length === 0) return;
    if (searchOpen || focusMessageId) return;
    if (!isNearBottomRef.current) {
      setShowScrollToBottom(true);
      return;
    }
    scrollToBottom();
  }, [liveMessages.length, scrollToBottom, searchOpen, focusMessageId]);

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

  const handleEnterPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!message.trim() && (!attachments || attachments.length === 0)) return;

    if (isTyping) {
      setIsTyping(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      socket.emit(STOP_TYPING, { members: memberIds, chatId });
    }

    if (!attachments || attachments.length === 0) {
      const trimmed = message.trim();
      if (!trimmed) return;

      if (!chatId || memberIds.length === 0) {
        toast.error('Unable to send message right now');
        return;
      }

      const pendingId = `pending-${Date.now()}`;
      const pendingMessage: ChatMessage = {
        _id: pendingId,
        content: trimmed,
        sender: {
          _id: user?._id ?? '',
          name: user?.name ?? '',
          avatar: user?.avatar as Avatar | undefined,
        },
        createdAt: new Date().toISOString(),
      };

      setLiveMessages((prev) => [...prev, pendingMessage]);
      setMessage('');

      socket.emit(NEW_MESSAGE, {
        message: trimmed,
        chatId,
        members: memberIds,
      });
      scrollToBottom();
      return;
    }

    const tempId = String(Date.now());
    const tempMessage: ChatMessage = {
      _id: tempId,
      content: message,
      sender: {
        _id: user?._id ?? '',
        name: user?.name ?? '',
        avatar: user?.avatar as Avatar | undefined,
      },
      attachments: attachments.map((file) => ({
        tempUrl: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
        size: file.size,
        uploading: true,
      })),
      createdAt: new Date().toISOString(),
      isUploading: true,
    };

    setLiveMessages((prev) => [...prev, tempMessage]);
    setMessage('');
    setAttachments([]);

    const formData = new FormData();
    formData.append('chatId', chatId ?? '');
    formData.append('content', message);
    attachments.forEach((attachment) => formData.append('files', attachment));

    try {
      const result = (await sendAttachments(
        '',
        formData,
      )) as SendAttachmentsResult | null;

      if (!result) {
        setLiveMessages((prev) => prev.filter((msg) => msg._id !== tempId));
        return;
      }

      const payload = (result.data ?? result) as ChatMessage;
      setLiveMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId
            ? {
                ...payload,
                attachments: (payload.attachments ?? []).map((att, index) => ({
                  ...att,
                  tempUrl: tempMessage.attachments?.[index]?.tempUrl,
                  uploading: false,
                })),
              }
            : msg,
        ),
      );
      scrollToBottom();
    } catch {
      toast.error('Failed to send attachments');
      setLiveMessages((prev) => prev.filter((msg) => msg._id !== tempId));
    }
  };

  const newMessageListener = useCallback(
    (res: NewMessagePayload) => {
      if (res.chatId !== chatId) return;
      setLiveMessages((prev) => {
        if (prev.some((msg) => msg._id === res.message._id)) return prev;

        const pendingIdx = prev.findIndex(
          (msg) =>
            msg._id.startsWith('pending-') &&
            msg.content === res.message.content &&
            String(msg.sender._id) === String(res.message.sender._id),
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

  const chatReadListener = useCallback(
    (res: ChatReadPayload) => {
      if (res.chatId !== chatId) return;
      if (String(res.userId) === String(user?._id ?? '')) return;
      setPeerLastReadAt((prev) =>
        !prev || dayjs(res.lastReadAt).isAfter(dayjs(prev))
          ? res.lastReadAt
          : prev,
      );
      setLiveMessages((prev) =>
        prev.map((msg) => {
          if (String(msg.sender._id) !== String(user?._id ?? '')) return msg;
          if (
            msg.createdAt &&
            dayjs(msg.createdAt).isAfter(dayjs(res.lastReadAt))
          ) {
            return msg;
          }
          const readBy = new Set((msg.readBy ?? []).map(String));
          readBy.add(res.userId);
          return { ...msg, readBy: Array.from(readBy) };
        }),
      );
    },
    [chatId, user?._id],
  );

  const handleMessageChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      socket.emit(START_TYPING, { members: memberIds, chatId });
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit(STOP_TYPING, { members: memberIds, chatId });
    }, 1000);
  };

  const socketEvents = useMemo(
    () => ({
      [NEW_MESSAGE]: newMessageListener,
      [CHAT_READ]: chatReadListener,
    }),
    [newMessageListener, chatReadListener],
  );

  useSocketEvent(
    socket,
    socketEvents as Parameters<typeof useSocketEvent>[1],
  );

  const isMessageRead = (msg: ChatMessage) => {
    if (isGroupChat) return false;
    if (String(msg.sender._id) !== String(user?._id ?? '')) return false;
    if (peerLastReadAt && msg.createdAt) {
      return !dayjs(msg.createdAt).isAfter(dayjs(peerLastReadAt));
    }
    const readers = (msg.readBy ?? []).map(String);
    return readers.some((id) => id !== String(user?._id ?? ''));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="bg-glass-background relative min-h-0 flex-1 overflow-hidden md:rounded-xl">
        <div
          ref={containerRef}
          className="relative h-full min-h-0 overflow-y-auto bg-[rgba(33,26,42,0.75)] px-2 py-3 pt-4 backdrop-blur-lg backdrop-saturate-100 scrollbar-hide md:rounded-xl md:p-2 md:pt-28"
        >
          {msgLoading ? (
            <ChatMessagesSkeleton />
          ) : (
            <>
              {isFetchingNextPage ? (
                <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center">
                  <span className="rounded-full border border-border bg-primary/90 px-3 py-1 text-xs text-body-300">
                    Loading older messages…
                  </span>
                </div>
              ) : null}
              <div
                className="relative w-full"
                style={{ height: `${virtualizer.getTotalSize()}px` }}
              >
                {virtualizer.getVirtualItems().map((item) => {
                  const entry = timelineItems[item.index];
                  if (!entry) return null;

                  if (entry.kind === 'day') {
                    const isToday = entry.label === 'Today';

                    return (
                      <div
                        key={entry.key}
                        data-index={item.index}
                        ref={virtualizer.measureElement}
                        className="absolute left-0 flex w-full justify-center px-4 pb-3 pt-2"
                        style={{ transform: `translateY(${item.start}px)` }}
                      >
                        <time
                          className={`rounded-md px-2.5 py-1 font-display text-[12px] leading-none tracking-[0.03em] ${
                            isToday
                              ? 'bg-green-light text-green'
                              : 'bg-body/8 text-body-700'
                          }`}
                        >
                          {entry.label}
                        </time>
                      </div>
                    );
                  }

                  const msg = entry.message;
                  const sameSender =
                    String(msg.sender._id) === String(user?._id ?? '');
                  const isSearchHighlight = msg._id === highlightedMessageId;

                  return (
                    <div
                      key={entry.key}
                      data-index={item.index}
                      ref={virtualizer.measureElement}
                      className={`absolute left-0 w-full pb-4 ${
                        sameSender ? 'flex justify-end' : 'flex justify-start'
                      }`}
                      style={{ transform: `translateY(${item.start}px)` }}
                    >
                      <div
                        className={`w-fit max-w-[min(88%,20rem)] rounded-2xl md:max-w-[70%]`}
                      >
                        <ChatBox
                          chatData={msg}
                          isGroupChat={isGroupChat}
                          showReadReceipt={!isGroupChat && sameSender}
                          isRead={isMessageRead(msg)}
                          searchHighlight={isSearchHighlight}
                          highlightQuery={
                            isSearchHighlight && highlightQuery
                              ? highlightQuery
                              : undefined
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {showScrollToBottom ? (
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-3 right-3 z-20 grid h-10 w-10 place-items-center rounded-full border border-border/80 bg-primary/95 text-body shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition hover:border-green/40 hover:bg-background-alt hover:text-green md:bottom-4 md:right-4"
            aria-label="Scroll to latest messages"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
              <path
                d="M2.5 3.5 8 7.5 13.5 3.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2.5 9 8 13 13.5 9"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-border/40 bg-background/95 px-2 py-2 backdrop-blur-md md:border-0 md:bg-transparent md:px-0 md:pb-0 md:pt-3">
        <ChatInput
          message={message}
          setMessage={setMessage}
          disabled={isLoading}
          autoFocus={true}
          onKeyDown={handleEnterPress}
          handleSubmit={handleSubmit}
          onChange={handleMessageChange}
          attachments={attachments}
          setAttachments={setAttachments}
          className={'text-body-700 placeholder:text-body-300'}
          placeholder={'Message…'}
        />
      </div>
    </div>
  );
};

export default ChatsViewPanel;
