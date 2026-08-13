import useErrors from '@/hooks/error';
import { useSocket } from '@/socket/SocketProvider';
import useSocketEvent from '@/hooks/socketEvent';
import {
  CHAT_CLEARED,
  CHAT_READ,
  MESSAGE_UPDATED,
  MESSAGES_DELETED,
  NEW_MESSAGE,
  START_TYPING,
  STOP_TYPING,
} from '@/lib/socketConstants';
import {
  useChatDetailsQuery,
  useClearChatMessagesMutation,
  useDeleteManyMessagesMutation,
  useDeleteMessageMutation,
  useEditMessageMutation,
  useForwardMessagesMutation,
  useInfiniteMessagesQuery,
  useMarkChatReadMutation,
  useSendAttachmentsMutation,
} from '@/features/api/hooks';
import ContextMenu from '@/components/context-menu/ContextMenu';
import ConfirmationModal from '@/components/ui/modal/confirmation-modal/ConfirmationModal';
import PencilIcon from '@/components/icons/Pencil';
import ReplyIcon from '@/components/icons/Reply';
import ForwardIcon from '@/components/icons/Forward';
import CopyIcon from '@/components/icons/Copy';
import CloseIcon from '@/components/icons/Close';
import CheckboxIcon from '@/components/icons/Checkbox';
import SelectMessagesIcon from '@/components/icons/SelectMessages';
import TrashIcon from '@/components/icons/Trash';
import useContextMenu from '@/hooks/Context-menu';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/chat';
import dayjs from 'dayjs';
import ChatBox, { type ChatBoxData, type MessageReplyTo } from './ChatBox';
import ChatInput from './ChatInput';
import ForwardDialog from './ForwardDialog';
import useAsyncMutation from '@/hooks/asyncMutation';
import { useNotificationsStore } from '@/stores/notifications';
import { useAuthStore } from '@/stores/auth';
import { ChatMessagesSkeleton } from '@/components/skeletons/ChatMessageSkeleton';
import toast from 'react-hot-toast';
import type { Avatar } from '@/types';
import { formatChatDayLabel, isValidMessageId, normalizeMemberIds } from '@/utils/helper';
import {
  buildChatCopyPayload,
  writeCopyPayloadToSystemClipboard,
} from '@/utils/chatClipboard';
import { useChatClipboardStore } from '@/stores/chatClipboard';

type ChatsViewPanelProps = {
  chatId?: string;
  focusMessageId?: string | null;
  highlightQuery?: string;
  searchOpen?: boolean;
  selectMode?: boolean;
  onSelectModeChange?: (active: boolean) => void;
  onSelectedCountChange?: (count: number) => void;
  onDeletableSelectedCountChange?: (count: number) => void;
  onDeletingSelectedChange?: (pending: boolean) => void;
  onRegisterClearChat?: (handler: () => void) => void;
  onRegisterDeleteSelected?: (handler: () => void) => void;
  onRegisterForwardSelected?: (handler: () => void) => void;
  onRegisterCopySelected?: (handler: () => void) => void;
  onEditingChange?: (editing: boolean) => void;
};

type ChatMessage = ChatBoxData & {
  _id: string;
  isUploading?: boolean;
  readBy?: string[];
  isDeleted?: boolean;
  editedAt?: string;
  replyTo?: MessageReplyTo;
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

type MessageUpdatedPayload = {
  chatId: string;
  message: ChatMessage;
};

type MessagesDeletedPayload = {
  chatId: string;
  messageIds: string[];
};

type ChatClearedPayload = {
  chatId: string;
};

type SendAttachmentsResult = {
  data?: ChatMessage;
  attachments?: ChatMessage['attachments'];
} & Partial<ChatMessage>;

type TimelineItem =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'message'; key: string; message: ChatMessage };

const NEAR_BOTTOM_PX = 120;

const buildReplySnapshot = (msg: ChatMessage): MessageReplyTo => {
  const firstAttachment = msg.attachments?.[0];
  return {
    messageId: msg._id,
    content: msg.content,
    senderName: msg.sender.name ?? 'Unknown',
    previewAttachment: firstAttachment
      ? {
          url: firstAttachment.url ?? firstAttachment.tempUrl ?? '',
          name: firstAttachment.name ?? 'Attachment',
          fileType: firstAttachment.type ?? '',
        }
      : undefined,
  };
};

const getReplyPreviewText = (reply: MessageReplyTo) =>
  reply.previewAttachment?.name || reply.content?.trim() || 'Message';

const ChatsViewPanel = ({
  chatId,
  focusMessageId = null,
  highlightQuery = '',
  searchOpen = false,
  selectMode = false,
  onSelectModeChange,
  onSelectedCountChange,
  onDeletableSelectedCountChange,
  onDeletingSelectedChange,
  onRegisterClearChat,
  onRegisterDeleteSelected,
  onRegisterForwardSelected,
  onRegisterCopySelected,
  onEditingChange,
}: ChatsViewPanelProps) => {
  const socket = useSocket();
  const queryClient = useQueryClient();
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<
    null | { type: 'one'; messageId: string } | { type: 'many' }
  >(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardMessageIds, setForwardMessageIds] = useState<string[]>([]);
  const { menuState, showContextMenu, hideContextMenu } = useContextMenu();
  const isEditing = Boolean(editingMessageId);

  const editMessageMutation = useEditMessageMutation();
  const deleteMessageMutation = useDeleteMessageMutation();
  const deleteManyMutation = useDeleteManyMessagesMutation();
  const clearChatMutation = useClearChatMessagesMutation();
  const forwardMutation = useForwardMessagesMutation();

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
  const memberIdsRef = useRef(memberIds);
  memberIdsRef.current = memberIds;
  const isTypingRef = useRef(isTyping);
  isTypingRef.current = isTyping;

  const emitStopTyping = useCallback(() => {
    const id = chatId;
    const members = memberIdsRef.current;
    if (!id || members.length === 0) return;
    socket.emit(STOP_TYPING, { members, chatId: id });
  }, [chatId, socket]);

  const emitStartTyping = useCallback(() => {
    const id = chatId;
    const members = memberIdsRef.current;
    if (!id || members.length === 0) return;
    socket.emit(START_TYPING, { members, chatId: id });
  }, [chatId, socket]);

  const clearTypingState = useCallback(
    (notifyPeers: boolean) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (isTypingRef.current) {
        setIsTyping(false);
        if (notifyPeers) emitStopTyping();
      }
    },
    [emitStopTyping],
  );

  // Leave / switch chat: stop telling peers we're typing.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (isTypingRef.current) {
        const id = chatId;
        const members = memberIdsRef.current;
        if (id && members.length > 0) {
          socket.emit(STOP_TYPING, { members, chatId: id });
        }
      }
    };
  }, [chatId, socket]);

  useEffect(() => {
    setIsTyping(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [chatId]);

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
    setSelectedIds(new Set());
    setEditingMessageId(null);
    setReplyingTo(null);
    setForwardOpen(false);
    setForwardMessageIds([]);
    isNearBottomRef.current = true;
    if (chatId) {
      removeMessageNotification({ chatId });
      markReadMutation.mutate({ chatId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mark-read only on chat switch
  }, [chatId]);

  useEffect(() => {
    if (!selectMode) setSelectedIds(new Set());
  }, [selectMode]);

  useEffect(() => {
    onSelectedCountChange?.(selectedIds.size);
  }, [onSelectedCountChange, selectedIds]);

  useEffect(() => {
    onDeletingSelectedChange?.(deleteManyMutation.isPending);
  }, [deleteManyMutation.isPending, onDeletingSelectedChange]);

  useEffect(() => {
    onEditingChange?.(isEditing);
  }, [isEditing, onEditingChange]);

  useEffect(() => {
    onRegisterClearChat?.(() => setConfirmClearOpen(true));
  }, [onRegisterClearChat]);

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
      const idx = prev.findIndex((msg) => msg._id === message._id);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], ...message };
      return next;
    });
  }, []);

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
      if (editingMessageId) {
        void saveEdit();
        return;
      }
      void handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (editingMessageId) {
      await saveEdit();
      return;
    }

    if (!message.trim() && (!attachments || attachments.length === 0)) return;

    if (isTyping) {
      clearTypingState(true);
    }

    if (!attachments || attachments.length === 0) {
      const trimmed = message.trim();
      if (!trimmed) return;

      if (!chatId || memberIds.length === 0) {
        toast.error('Unable to send message right now');
        return;
      }

      const replySnapshot = replyingTo
        ? buildReplySnapshot(replyingTo)
        : undefined;
      const replyToMessageId =
        replyingTo && isValidMessageId(replyingTo._id)
          ? replyingTo._id
          : undefined;

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
        replyTo: replySnapshot,
      };

      setLiveMessages((prev) => [...prev, pendingMessage]);
      setMessage('');
      setReplyingTo(null);

      socket.emit(NEW_MESSAGE, {
        message: trimmed,
        chatId,
        members: memberIds,
        replyToMessageId,
      });
      scrollToBottom();
      return;
    }

    const replySnapshot = replyingTo
      ? buildReplySnapshot(replyingTo)
      : undefined;
    const replyToMessageId =
      replyingTo && isValidMessageId(replyingTo._id) ? replyingTo._id : undefined;
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
      replyTo: replySnapshot,
    };

    setLiveMessages((prev) => [...prev, tempMessage]);
    setMessage('');
    setAttachments([]);
    setReplyingTo(null);

    const formData = new FormData();
    formData.append('chatId', chatId ?? '');
    formData.append('content', message);
    if (replyToMessageId) {
      formData.append('replyToMessageId', replyToMessageId);
    }
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

  const invalidateMessages = useCallback(() => {
    if (!chatId) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
  }, [chatId, queryClient]);

  const canManageMessage = useCallback(
    (msg: ChatMessage) =>
      String(msg.sender._id) === String(user?._id ?? '') &&
      isValidMessageId(msg._id) &&
      !msg.isDeleted &&
      !msg.isUploading,
    [user?._id],
  );

  const canInteractMessage = useCallback(
    (msg: ChatMessage) =>
      isValidMessageId(msg._id) && !msg.isDeleted && !msg.isUploading,
    [],
  );

  const canEditMessage = useCallback(
    (msg: ChatMessage) =>
      canManageMessage(msg) &&
      Boolean(msg.content?.trim()) &&
      (msg.attachments?.length ?? 0) === 0,
    [canManageMessage],
  );

  const deletableSelectedIds = useMemo(() => {
    if (selectedIds.size === 0) return [] as string[];
    return allMessages
      .filter((msg) => selectedIds.has(msg._id) && canManageMessage(msg))
      .map((msg) => msg._id);
  }, [allMessages, canManageMessage, selectedIds]);

  useEffect(() => {
    onDeletableSelectedCountChange?.(deletableSelectedIds.length);
  }, [deletableSelectedIds.length, onDeletableSelectedCountChange]);

  const toggleSelected = useCallback((messageId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  }, []);

  const startEditMessage = useCallback(
    (msg: ChatMessage) => {
      if (!canEditMessage(msg)) return;
      clearTypingState(true);
      setAttachments([]);
      setEditingMessageId(msg._id);
      setMessage(msg.content ?? '');
      onSelectModeChange?.(false);
      setSelectedIds(new Set());
    },
    [canEditMessage, clearTypingState, onSelectModeChange],
  );

  const cancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setMessage('');
  }, []);

  const clearReply = useCallback(() => setReplyingTo(null), []);

  const startReply = useCallback(
    (msg: ChatMessage) => {
      if (!canInteractMessage(msg)) return;
      cancelEdit();
      clearTypingState(true);
      onSelectModeChange?.(false);
      setSelectedIds(new Set());
      setReplyingTo(msg);
    },
    [
      canInteractMessage,
      cancelEdit,
      clearTypingState,
      onSelectModeChange,
    ],
  );

  const openForwardDialog = useCallback(
    (messageIds: string[]) => {
      const ids = messageIds.filter(isValidMessageId);
      if (!chatId || ids.length === 0) return;
      setForwardMessageIds(ids);
      setForwardOpen(true);
    },
    [chatId],
  );

  const handleForwardToChat = useCallback(
    async (targetChatIds: string[]) => {
      if (!chatId || forwardMessageIds.length === 0 || targetChatIds.length === 0) {
        return;
      }

      try {
        const results = await Promise.allSettled(
          targetChatIds.map((targetChatId) =>
            forwardMutation.mutateAsync({
              targetChatId,
              sourceChatId: chatId,
              messageIds: forwardMessageIds,
            }),
          ),
        );

        const succeeded = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.length - succeeded;

        if (succeeded === 0) {
          toast.error('Failed to forward');
          return;
        }

        setForwardOpen(false);
        setForwardMessageIds([]);
        setSelectedIds(new Set());
        onSelectModeChange?.(false);
        invalidateMessages();

        if (failed > 0) {
          toast.success(
            `Forwarded to ${succeeded} chat${succeeded === 1 ? '' : 's'} (${failed} failed)`,
          );
        } else {
          toast.success(
            succeeded === 1
              ? 'Forwarded'
              : `Forwarded to ${succeeded} chats`,
          );
        }
      } catch {
        toast.error('Failed to forward');
      }
    },
    [
      chatId,
      forwardMessageIds,
      forwardMutation,
      invalidateMessages,
      onSelectModeChange,
    ],
  );

  const saveEdit = useCallback(async () => {
    const trimmed = message.trim();
    if (!chatId || !editingMessageId || !trimmed) return;
    try {
      await editMessageMutation.mutateAsync({
        messageId: editingMessageId,
        content: trimmed,
        chatId,
      });
      applyUpdatedMessage({
        _id: editingMessageId,
        content: trimmed,
        editedAt: new Date().toISOString(),
        sender: {
          _id: user?._id ?? '',
          name: user?.name,
          avatar: user?.avatar as Avatar | undefined,
        },
      });
      cancelEdit();
      invalidateMessages();
      toast.success('Message updated');
    } catch {
      toast.error('Failed to edit message');
    }
  }, [
    applyUpdatedMessage,
    cancelEdit,
    chatId,
    editMessageMutation,
    editingMessageId,
    invalidateMessages,
    message,
    user?.avatar,
    user?.name,
    user?._id,
  ]);

  const deleteOneMessage = useCallback(
    async (messageId: string) => {
      if (!chatId || !isValidMessageId(messageId)) return;
      try {
        await deleteMessageMutation.mutateAsync({ messageId, chatId });
        applyDeletedMessages([messageId]);
        invalidateMessages();
        toast.success('Message deleted');
      } catch {
        toast.error('Failed to delete message');
      }
    },
    [
      applyDeletedMessages,
      chatId,
      deleteMessageMutation,
      invalidateMessages,
    ],
  );

  const deleteSelectedMessages = useCallback(async () => {
    if (!chatId || deletableSelectedIds.length === 0) return;
    const messageIds = deletableSelectedIds.filter(isValidMessageId);
    if (messageIds.length === 0) return;

    try {
      await deleteManyMutation.mutateAsync({ chatId, messageIds });
      applyDeletedMessages(messageIds);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of messageIds) next.delete(id);
        if (next.size === 0) onSelectModeChange?.(false);
        return next;
      });
      invalidateMessages();
      toast.success(
        messageIds.length === 1
          ? 'Message deleted'
          : `${messageIds.length} messages deleted`,
      );
    } catch {
      toast.error('Failed to delete messages');
    }
  }, [
    applyDeletedMessages,
    chatId,
    deleteManyMutation,
    deletableSelectedIds,
    invalidateMessages,
    onSelectModeChange,
  ]);

  useEffect(() => {
    onRegisterDeleteSelected?.(() => {
      if (
        selectedIds.size === 0 ||
        deletableSelectedIds.length === 0 ||
        selectedIds.size !== deletableSelectedIds.length
      ) {
        return;
      }
      setConfirmDelete({ type: 'many' });
    });
  }, [
    deletableSelectedIds.length,
    onRegisterDeleteSelected,
    selectedIds.size,
  ]);

  useEffect(() => {
    onRegisterForwardSelected?.(() => {
      if (selectedIds.size === 0) return;
      openForwardDialog([...selectedIds]);
    });
  }, [onRegisterForwardSelected, openForwardDialog, selectedIds]);

  const copyMessagesByIds = useCallback(
    async (messageIds: string[]) => {
      const idSet = new Set(messageIds);
      const messages = allMessages.filter(
        (msg) => idSet.has(msg._id) && !msg.isDeleted,
      );

      if (messages.length === 0) {
        toast.error('Nothing to copy');
        return;
      }

      try {
        const payload = await buildChatCopyPayload(messages);
        if (!payload.text && payload.files.length === 0) {
          toast.error('Nothing to copy');
          return;
        }

        useChatClipboardStore.getState().setPayload(payload);

        try {
          await writeCopyPayloadToSystemClipboard(payload);
        } catch {
          // In-app paste still works via chat clipboard store.
        }

        const fileCount = payload.files.length;
        if (fileCount > 0 && payload.text) {
          toast.success(
            fileCount === 1
              ? 'Copied message and attachment'
              : `Copied with ${fileCount} attachments`,
          );
        } else if (fileCount > 0) {
          toast.success(
            fileCount === 1 ? 'Attachment copied' : `${fileCount} attachments copied`,
          );
        } else {
          toast.success(
            messages.length === 1 ? 'Copied' : `Copied ${messages.length} messages`,
          );
        }
      } catch {
        toast.error('Failed to copy');
      }
    },
    [allMessages],
  );

  useEffect(() => {
    onRegisterCopySelected?.(() => {
      if (selectedIds.size === 0) return;
      void copyMessagesByIds([...selectedIds]);
    });
  }, [copyMessagesByIds, onRegisterCopySelected, selectedIds]);

  useEffect(() => {
    if (!isEditing) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') cancelEdit();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cancelEdit, isEditing]);

  useEffect(() => {
    if (!replyingTo) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') clearReply();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [clearReply, replyingTo]);

  const handleClearChat = useCallback(async () => {
    if (!chatId) return;
    try {
      await clearChatMutation.mutateAsync(chatId);
      setLiveMessages([]);
      setSelectedIds(new Set());
      onSelectModeChange?.(false);
      cancelEdit();
      invalidateMessages();
      toast.success('Chat cleared');
    } catch {
      toast.error('Failed to clear chat');
    } finally {
      setConfirmClearOpen(false);
    }
  }, [
    cancelEdit,
    chatId,
    clearChatMutation,
    invalidateMessages,
    onSelectModeChange,
  ]);

  const openMessageContextMenu = useCallback(
    (e: MouseEvent, msg: ChatMessage) => {
      if (isEditing || !canInteractMessage(msg)) return;
      e.preventDefault();
      e.stopPropagation();

      const isOwn = canManageMessage(msg);
      const options = [
        {
          id: 4,
          icon: <ReplyIcon className="h-4 w-4" />,
          name: 'Reply',
        },
        {
          id: 6,
          icon: <CopyIcon className="h-4 w-4" />,
          name: 'Copy',
        },
        {
          id: 5,
          icon: <ForwardIcon className="h-4 w-4" />,
          name: 'Forward',
        },
        ...(isOwn && canEditMessage(msg)
          ? [
              {
                id: 1,
                icon: <PencilIcon className="h-4 w-4" />,
                name: 'Edit',
              },
            ]
          : []),
        ...(isOwn
          ? [
              {
                id: 2,
                icon: <TrashIcon className="h-4 w-4" />,
                name: 'Delete',
              },
            ]
          : []),
        {
          id: 3,
          icon: <SelectMessagesIcon className="h-4 w-4" />,
          name: 'Select',
        },
      ];

      showContextMenu({ x: e.clientX, y: e.clientY }, options, (option) => {
        if (option.id === 4) startReply(msg);
        if (option.id === 6) void copyMessagesByIds([msg._id]);
        if (option.id === 5) openForwardDialog([msg._id]);
        if (option.id === 1) startEditMessage(msg);
        if (option.id === 2) {
          setConfirmDelete({ type: 'one', messageId: msg._id });
        }
        if (option.id === 3) {
          onSelectModeChange?.(true);
          setSelectedIds(new Set([msg._id]));
        }
      });
    },
    [
      canEditMessage,
      canInteractMessage,
      canManageMessage,
      copyMessagesByIds,
      isEditing,
      onSelectModeChange,
      openForwardDialog,
      showContextMenu,
      startEditMessage,
      startReply,
    ],
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
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of res.messageIds) next.delete(id);
        return next;
      });
      invalidateMessages();
    },
    [applyDeletedMessages, chatId, invalidateMessages],
  );

  const chatClearedListener = useCallback(
    (res: ChatClearedPayload) => {
      if (res.chatId !== chatId) return;
      setLiveMessages([]);
      setSelectedIds(new Set());
      onSelectModeChange?.(false);
      cancelEdit();
      invalidateMessages();
    },
    [cancelEdit, chatId, invalidateMessages, onSelectModeChange],
  );

  const handleMessageChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setMessage(next);

    if (isEditing) return;
    if (!chatId || memberIdsRef.current.length === 0) return;

    // Cleared the draft — stop immediately.
    if (!next.trim()) {
      clearTypingState(true);
      return;
    }

    if (!isTypingRef.current) {
      setIsTyping(true);
      emitStartTyping();
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      emitStopTyping();
      timeoutRef.current = null;
    }, 1200);
  };

  const socketEvents = useMemo(
    () => ({
      [NEW_MESSAGE]: newMessageListener,
      [CHAT_READ]: chatReadListener,
      [MESSAGE_UPDATED]: messageUpdatedListener,
      [MESSAGES_DELETED]: messagesDeletedListener,
      [CHAT_CLEARED]: chatClearedListener,
    }),
    [
      chatReadListener,
      chatClearedListener,
      messageUpdatedListener,
      messagesDeletedListener,
      newMessageListener,
    ],
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
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="bg-glass-background relative min-h-0 flex-1 overflow-hidden md:rounded-xl">
        <div
          ref={containerRef}
          className={`relative h-full min-h-0 overflow-y-auto bg-[rgba(33,26,42,0.75)] px-2 py-3 pt-[5.75rem] backdrop-blur-lg backdrop-saturate-100 scrollbar-hide md:rounded-xl md:p-2 md:pt-28 ${
            isEditing ? 'pointer-events-none select-none' : ''
          }`}
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
                  const isSelected = selectedIds.has(msg._id);
                  const selectable = selectMode && canInteractMessage(msg);

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
                        className={`flex max-w-[min(88%,20rem)] items-center gap-2 md:max-w-[70%] ${
                          sameSender ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        {selectable ? (
                          <button
                            type="button"
                            onClick={() => toggleSelected(msg._id)}
                            className={`grid h-5 w-5 shrink-0 place-items-center transition ${
                              isSelected ? 'text-green' : 'text-body-700'
                            }`}
                            aria-label={
                              isSelected
                                ? 'Deselect message'
                                : 'Select message'
                            }
                          >
                            <CheckboxIcon
                              className="h-5 w-5"
                              checked={isSelected}
                            />
                          </button>
                        ) : null}
                        <div
                          className="w-fit max-w-full rounded-2xl"
                          onContextMenu={(e) => openMessageContextMenu(e, msg)}
                          onClick={() => {
                            if (selectable) toggleSelected(msg._id);
                          }}
                          role={selectable ? 'button' : undefined}
                          tabIndex={selectable ? 0 : undefined}
                          onKeyDown={
                            selectable
                              ? (e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    toggleSelected(msg._id);
                                  }
                                }
                              : undefined
                          }
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
                            isDeleted={Boolean(msg.isDeleted)}
                            editedAt={msg.editedAt}
                          />
                        </div>
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
            className={`absolute right-3 z-20 grid h-10 w-10 place-items-center rounded-full border border-border/80 bg-primary/95 text-body shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition hover:border-green/40 hover:bg-background-alt hover:text-green md:right-4 ${
              attachments.length > 0
                ? 'bottom-20 md:bottom-24'
                : 'bottom-[max(0.75rem,env(safe-area-inset-bottom))] md:bottom-4'
            }`}
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

        {isEditing ? (
          <div
            aria-hidden
            className="pointer-events-auto absolute inset-0 z-30 bg-black/45 backdrop-blur-[2px]"
            onClick={cancelEdit}
          />
        ) : null}
      </div>

      {isEditing ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-green/25 bg-green/10 px-3 py-1.5 text-xs text-green md:rounded-t-xl">
          <span className="font-medium">Editing message</span>
          <button
            type="button"
            onClick={cancelEdit}
            className="grid h-8 w-8 place-items-center rounded-full text-body-700 transition hover:bg-white/8 hover:text-body"
            aria-label="Cancel edit"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      {replyingTo ? (
        <div className="flex shrink-0 items-center gap-2 border-t border-green/20 bg-green/10 px-3 py-2 md:rounded-t-xl">
          <div className="min-w-0 flex-1 border-l-2 border-green pl-2">
            <p className="text-[11px] font-semibold text-green">
              Reply to {replyingTo.sender.name ?? 'Unknown'}
            </p>
            <p className="truncate text-xs text-body-300">
              {getReplyPreviewText(buildReplySnapshot(replyingTo))}
            </p>
          </div>
          <button
            type="button"
            onClick={clearReply}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-body-700 transition hover:bg-white/8 hover:text-body"
            aria-label="Cancel reply"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <div className="relative z-40 shrink-0 border-t border-border/40 bg-background/95 px-2 py-2 backdrop-blur-md md:border-0 md:bg-transparent md:px-0 md:pb-0 md:pt-3">
        <ChatInput
          message={message}
          setMessage={setMessage}
          disabled={isLoading || editMessageMutation.isPending}
          autoFocus={true}
          onKeyDown={handleEnterPress}
          handleSubmit={handleSubmit}
          onChange={handleMessageChange}
          attachments={attachments}
          setAttachments={setAttachments}
          editMode={isEditing}
          className={'text-body-700 placeholder:text-body-300'}
          placeholder={isEditing ? 'Edit message…' : 'Message…'}
        />
      </div>

      <ForwardDialog
        open={forwardOpen}
        sourceChatId={chatId ?? ''}
        messageIds={forwardMessageIds}
        onClose={() => {
          setForwardOpen(false);
          setForwardMessageIds([]);
        }}
        onForward={handleForwardToChat}
        isForwarding={forwardMutation.isPending}
      />

      <ContextMenu menuState={menuState} hideContextMenu={hideContextMenu} />

      {confirmClearOpen ? (
        <ConfirmationModal
          variant="danger"
          title="Clear this chat?"
          description="All messages will be removed for everyone in this conversation. This cannot be undone."
          confirmLabel="Clear all"
          cancelLabel="Cancel"
          onClose={() => setConfirmClearOpen(false)}
          handleConfirmationModal={({ accept }) => {
            if (accept) void handleClearChat();
            else setConfirmClearOpen(false);
          }}
        />
      ) : null}

      {confirmDelete ? (
        <ConfirmationModal
          variant="danger"
          title={
            confirmDelete.type === 'many'
              ? `Delete ${deletableSelectedIds.length} message${deletableSelectedIds.length === 1 ? '' : 's'}?`
              : 'Delete this message?'
          }
          description={
            confirmDelete.type === 'many'
              ? deletableSelectedIds.length < selectedIds.size
                ? 'Only your own messages in this selection will be deleted for everyone.'
                : 'Selected messages will be removed for everyone in this chat.'
              : 'This message will be removed for everyone in this chat.'
          }
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onClose={() => setConfirmDelete(null)}
          handleConfirmationModal={({ accept }) => {
            if (!accept) {
              setConfirmDelete(null);
              return;
            }
            if (confirmDelete.type === 'one') {
              void deleteOneMessage(confirmDelete.messageId);
            } else {
              void deleteSelectedMessages();
            }
            setConfirmDelete(null);
          }}
        />
      ) : null}
    </div>
  );
};

export default ChatsViewPanel;
