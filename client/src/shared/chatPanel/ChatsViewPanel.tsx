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
import SkeletonBox from '@/components/skeletons/SkeletonBox';
import toast from 'react-hot-toast';
import type { Avatar } from '@/types';
import { formatChatDayLabel } from '@/utils/helper';

type ChatsViewPanelProps = {
  chatId?: string;
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

type ChatDetailsResponse = {
  data?: {
    members?: string[];
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

const ChatsViewPanel = ({ chatId }: ChatsViewPanelProps) => {
  const socket = useSocket();
  const removeMessageNotification = useNotificationsStore(
    (s) => s.removeMessageNotification,
  );
  const user = useAuthStore((s) => s.user);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didInitialScrollRef = useRef(false);
  const timelineRef = useRef<TimelineItem[]>([]);
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
  const chatMembers = (chatDetails as ChatDetailsResponse | undefined)?.data
    ?.members;

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

  const scrollToBottom = useCallback(() => {
    const count = timelineRef.current.length;
    if (count === 0) return;
    requestAnimationFrame(() => {
      virtualizerRef.current.scrollToIndex(count - 1, { align: 'end' });
    });
  }, []);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const onScroll = () => {
      if (root.scrollTop > 80) return;
      if (!hasNextPage || isFetchingNextPage) return;

      const prevHeight = root.scrollHeight;
      const prevTop = root.scrollTop;

      void fetchNextPage().then(() => {
        requestAnimationFrame(() => {
          const el = containerRef.current;
          if (!el) return;
          el.scrollTop = prevTop + (el.scrollHeight - prevHeight);
        });
      });
    };

    root.addEventListener('scroll', onScroll, { passive: true });
    return () => root.removeEventListener('scroll', onScroll);
  }, [chatId, fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    didInitialScrollRef.current = false;
    setLiveMessages([]);
    setMessage('');
    setAttachments([]);
    setPeerLastReadAt(null);
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
    scrollToBottom();
  }, [liveMessages.length, scrollToBottom]);

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

  const handleEnterPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void handleSubmit();
  };

  const handleSubmit = async () => {
    if (!message.trim() && (!attachments || attachments.length === 0)) return;

    if (!attachments || attachments.length === 0) {
      socket.emit(NEW_MESSAGE, {
        message,
        chatId,
        members: chatMembers,
      });
      setMessage('');
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
      setLiveMessages((prev) => [...prev, res.message]);
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

  const handleMessageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      socket.emit(START_TYPING, { members: chatMembers, chatId });
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit(STOP_TYPING, { members: chatMembers, chatId });
    }, 1000);
  };

  useSocketEvent(socket, {
    [NEW_MESSAGE]: newMessageListener,
    [CHAT_READ]: chatReadListener,
  } as Parameters<typeof useSocketEvent>[1]);

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
      <div className="bg-glass-background min-h-0 flex-1 overflow-hidden md:rounded-xl">
        <div
          ref={containerRef}
          className="relative h-full min-h-0 overflow-y-auto bg-[rgba(33,26,42,0.75)] px-2 py-3 pt-4 backdrop-blur-lg backdrop-saturate-[100%] scrollbar-hide md:rounded-xl md:p-2 md:pt-28"
        >
          {msgLoading ? (
            <div className="flex flex-col gap-2">
              <SkeletonBox className="bubble-in h-12 w-40 border border-border bg-primary/90" />
              <SkeletonBox className="bubble-out h-12 w-52 self-end border border-green/35 bg-green-dark/55" />
              <SkeletonBox className="bubble-in h-12 w-60 border border-border bg-primary/90" />
              <SkeletonBox className="bubble-out h-12 w-60 self-end border border-green/35 bg-green-dark/55" />
            </div>
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
                      <div className="w-fit max-w-[min(88%,20rem)] md:max-w-[70%]">
                        <ChatBox
                          chatData={msg}
                          isGroupChat={isGroupChat}
                          showReadReceipt={!isGroupChat && sameSender}
                          isRead={isMessageRead(msg)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
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
