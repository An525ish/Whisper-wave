import { useCallback } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import * as chatApi from '@/api/chat';
import { queryKeys } from './queryKeys';
import type { MessagesPage } from '@/types/chat';

type ContextResponse = {
  page: number;
  totalPages: number;
  data: MessagesPage['data'];
};

/**
 * Returns `ensureMessageLoaded(messageId)` — call it before setting
 * `focusMessageId`. It figures out which page the target message lives on,
 * then bulk-fetches every missing page in parallel so the virtualizer can
 * scroll directly to the message without the sequential page-chase fallback
 * in useChatScroll.
 *
 * Throws on network error; callers should catch and fall back gracefully.
 */
export function useMessageJump(chatId: string | undefined) {
  const queryClient = useQueryClient();

  const ensureMessageLoaded = useCallback(
    async (messageId: string) => {
      if (!chatId || !messageId) return;

      const cached = queryClient.getQueryData<InfiniteData<MessagesPage>>(
        queryKeys.messages(chatId)
      );

      // Fast-path: already in cache
      if (cached?.pages.some((p) => p.data?.some((m) => m._id === messageId))) {
        return;
      }

      const ctx = (await chatApi.getMessageContext(chatId, messageId)) as ContextResponse;
      const currentPageCount = cached?.pages.length ?? 0;

      if (ctx.page <= currentPageCount) return;

      // Fetch all pages between what we have and the target — in parallel
      const pagesToFetch = Array.from(
        { length: ctx.page - currentPageCount },
        (_, i) => currentPageCount + i + 1
      );

      const results = (await Promise.all(
        pagesToFetch.map((p) => chatApi.getMessages(chatId, p))
      )) as MessagesPage[];

      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        queryKeys.messages(chatId),
        (old) => {
          if (!old) return old;
          return {
            pages: [...old.pages, ...results],
            pageParams: [...old.pageParams, ...pagesToFetch],
          };
        }
      );
    },
    [chatId, queryClient]
  );

  return { ensureMessageLoaded };
}
