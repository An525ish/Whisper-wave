import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { track } from '@/shared/lib/analytics';
import { ROUTES } from '@/shared/constants/routes';
import { useAuthStore } from '@/features/auth';
import { useMyChatsQuery, useSendGifMutation } from '@/features/chat';
import useAsyncMutation from '@/shared/hooks/useAsyncMutation';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import BottomSheet from '@/shared/components/ui/BottomSheet';
import AvatarCard from '@/shared/components/ui/AvatarCard';
import { MEME_EVENTS } from '../constants';
import type { MemeItem } from '../types';

type Props = {
  item: MemeItem | null;
  onClose: () => void;
};

/**
 * Share a meme to a conversation. Reuses the GIF send pipeline with
 * `kind: 'meme'` (server allow-lists memegen hosts for that kind) — a
 * foreign URL can never ride in as a spoofed attachment.
 */
const ShareMemeSheet = ({ item, onClose }: Props) => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: chats } = useMyChatsQuery({ skip: !user });
  const [send] = useAsyncMutation(useSendGifMutation);
  const { copy } = useCopyToClipboard();

  const share = (chatId: string) => {
    if (!item) return;
    const text = item.delivery ? `${item.setup}\n${item.delivery}` : item.setup;
    void send('Sharing…', {
      chatId,
      gifId: `meme-${item.id}`,
      gifUrl: item.imageUrl,
      gifTitle: text.slice(0, 200),
      mimeType: 'image/jpeg',
      kind: 'meme',
    }).then((res) => {
      if (!res) return;
      track(MEME_EVENTS.SHARE, { to: 'chat' });
      onClose();
      navigate(ROUTES.chat(chatId));
    });
  };

  const rows = (chats as { data?: Array<{ _id: string; name: string; avatar?: string[] | string }> } | undefined)?.data ?? [];

  useEffect(() => {
    if (!item || user) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [item, user, onClose]);

  // Guests get a compact centered popup — the share target list needs chats,
  // and chats live behind an account.
  if (item && !user) {
    return createPortal(
      <div
        className="fixed inset-0 z-50 grid place-items-center p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-meme-guest-title"
      >
        <button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-black/60 backdrop-blur-[6px]"
          onClick={onClose}
        />
        <div className="relative w-full max-w-xs rounded-3xl border border-white/10 bg-gradient-to-b from-[#2a2136] to-[#1a1520] p-6 text-center shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
          <span
            aria-hidden
            className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-green/35 bg-green/10 text-green"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </span>
          <h2 id="share-meme-guest-title" className="mt-3 font-display text-xl text-white">
            Sign in to share
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-body-300">
            Keep the ones worth sending — drop them straight into your chats.
          </p>
          <Link
            to={ROUTES.authLogin}
            className="mt-4 block rounded-full bg-gradient-action-button-green px-5 py-2.5 text-sm font-semibold text-body transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-green"
          >
            Sign in
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full rounded-full px-5 py-2 text-sm font-medium text-body-300 transition hover:text-body focus-visible:outline-2 focus-visible:outline-green"
          >
            Not now
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  return (
    <BottomSheet open={item !== null} onClose={onClose} labelledBy="share-meme-title">
      <div className="px-5 pb-6 pt-2">
        <h2 id="share-meme-title" className="text-lg font-semibold text-white">
          Share to a chat
        </h2>
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-body-300">
            No conversations yet — vibe with someone first, then send them this.
          </p>
        ) : (
          <ul className="mt-3 flex max-h-80 flex-col gap-1 overflow-y-auto" aria-label="Your chats">
            <li>
              <button
                type="button"
                onClick={() => {
                  if (!item) return;
                  copy(item.delivery ? `${item.setup}\n${item.delivery}` : item.setup);
                  track(MEME_EVENTS.SHARE, { to: 'clipboard' });
                  toast.success('Copied — go make someone laugh.');
                  onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-green"
              >
                <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-base">⧉</span>
                <span className="text-sm font-medium text-body">Copy text</span>
              </button>
            </li>
            {rows.map((chat) => (
              <li key={chat._id}>
                <button
                  type="button"
                  onClick={() => share(String(chat._id))}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-green"
                >
                  <AvatarCard avatars={Array.isArray(chat.avatar) ? chat.avatar : chat.avatar ? [chat.avatar] : []} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-body">
                    {chat.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </BottomSheet>
  );
};

export default ShareMemeSheet;
