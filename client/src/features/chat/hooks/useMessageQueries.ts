import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import * as chatApi from '@/features/chat/api';
import { queryKeys } from '@/features/chat/queryKeys';
import { isValidChatId } from '@/shared/utils/helper';

export function useInfiniteMessagesQuery(chatId?: string) {
  const id = chatId ?? '';

  return useInfiniteQuery({
    queryKey: queryKeys.messages(id),
    queryFn: ({ pageParam }) => chatApi.getMessages(id, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      const totalPages =
        (lastPage as { totalPages?: number } | undefined)?.totalPages ?? 0;
      return lastPageParam < totalPages ? lastPageParam + 1 : undefined;
    },
    enabled: isValidChatId(id),
    // Messages arrive via socket into liveMessages — avoid page waterfalls on refocus/remount.
    staleTime: 60_000,
  });
}

export function useSearchMessagesQuery(
  params: {
    chatId?: string;
    q?: string;
    scope?: 'all' | 'text' | 'media' | 'links';
    from?: 'anyone' | 'me' | 'others';
    dateFrom?: string;
    dateTo?: string;
    senderId?: string;
  },
  options?: { enabled?: boolean },
) {
  const chatId = params.chatId ?? '';
  const q = (params.q ?? '').trim();
  const scope = params.scope ?? 'all';
  const from = params.from ?? 'anyone';
  const dateFrom = params.dateFrom ?? '';
  const dateTo = params.dateTo ?? '';
  const senderId = params.senderId ?? '';
  const hasDate = Boolean(dateFrom);
  const hasBrowseScope = scope === 'media' || scope === 'links';
  const canSearch = q.length >= 1 || hasDate || hasBrowseScope;

  return useQuery({
    queryKey: queryKeys.messageSearch(chatId, q, scope, from, dateFrom, dateTo, senderId),
    queryFn: () =>
      chatApi.searchMessages({
        chatId,
        q,
        scope,
        from,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        senderId: senderId || undefined,
      }),
    enabled: isValidChatId(chatId) && canSearch && (options?.enabled ?? true),
    staleTime: 20_000,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useJumpToDateMutation() {
  return useMutation({
    mutationFn: (params: { chatId: string; dateFrom: string; dateTo?: string }) =>
      chatApi.jumpToDate(params),
  });
}

export function useActiveMessageDatesQuery(
  params: { chatId?: string; dateFrom?: string; dateTo?: string; tz?: string },
  options?: { enabled?: boolean },
) {
  const chatId = params.chatId ?? '';
  const dateFrom = params.dateFrom ?? '';
  const dateTo = params.dateTo ?? '';
  const tz =
    params.tz ||
    (typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC');

  return useQuery({
    queryKey: queryKeys.activeMessageDates(chatId, dateFrom, dateTo, tz),
    queryFn: async () => {
      const res = (await chatApi.listActiveDates({ chatId, dateFrom, dateTo, tz })) as {
        dates?: string[];
        minYear?: number | null;
      };
      return { dates: res.dates ?? [], minYear: res.minYear ?? null };
    },
    enabled:
      isValidChatId(chatId) &&
      Boolean(dateFrom && dateTo) &&
      (options?.enabled ?? true),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useGetMediaQuery(
  params: { chatId?: string },
  options?: { skip?: boolean },
) {
  const chatId = params.chatId ?? '';
  return useQuery({
    queryKey: queryKeys.media(chatId),
    queryFn: () => chatApi.getMedia(chatId),
    enabled: isValidChatId(chatId) && !options?.skip,
    // Attachments and links don't change on every message. Re-fetch only when
    // explicitly invalidated (after sendAttachments) or after 5 minutes.
    staleTime: 5 * 60_000,
  });
}

export function useMarkChatReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      chatId,
      lastReadMessageId,
    }: {
      chatId: string;
      lastReadMessageId?: string;
    }) => chatApi.markChatRead(chatId, { lastReadMessageId }),
    onSuccess: () => {
      // Only refresh the chat list (unread counts) — message content is unchanged by a read receipt.
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}

export function useMarkAllChatsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatApi.markAllChatsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}
