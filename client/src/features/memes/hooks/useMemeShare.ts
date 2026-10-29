import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { track } from '@/shared/lib/analytics';
import { ROUTES } from '@/shared/constants/routes';
import useAsyncMutation from '@/shared/hooks/useAsyncMutation';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { useAuthStore } from '@/features/auth';
import { useSendGifMutation } from '@/features/chat';
import { MEME_EVENTS } from '../constants';
import { memeText } from '../utils/memeText';
import type { MemeItem } from '../types';

/**
 * Share a joke. Members send it to a chat through the GIF send pipeline with
 * `kind: 'meme'` (the server allow-lists memegen hosts for that kind, so a
 * foreign URL can never ride in as a spoofed attachment) or copy the text.
 * Guests have no chats to send to.
 */
export function useMemeShare(onDone: () => void) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [send] = useAsyncMutation(useSendGifMutation);
  const { copy } = useCopyToClipboard();

  const shareToChats = useCallback(
    async (item: MemeItem, chatIds: string[]) => {
      let sent = 0;
      for (const chatId of chatIds) {
        const res = await send('Sharing…', {
          chatId,
          gifId: `meme-${item.id}`,
          gifUrl: item.imageUrl,
          gifTitle: memeText(item).slice(0, 200),
          mimeType: 'image/jpeg',
          kind: 'meme',
        });
        if (res) sent += 1;
      }
      if (sent === 0) return;
      track(MEME_EVENTS.SHARE, { to: 'chat', count: sent });
      onDone();
      // One target: take them there. Several: stay on the feed.
      if (chatIds.length === 1) navigate(ROUTES.chat(chatIds[0]));
    },
    [send, onDone, navigate]
  );

  const copyText = useCallback(
    (item: MemeItem) => {
      copy(memeText(item));
      track(MEME_EVENTS.SHARE, { to: 'clipboard' });
      toast.success('Copied — go make someone laugh.');
      onDone();
    },
    [copy, onDone]
  );

  return { isMember: Boolean(user), shareToChats, copyText };
}
