import BottomSheet from '@/shared/components/ui/BottomSheet';
import AvatarCard from '@/shared/components/ui/AvatarCard';
import { useMemeShare } from '../hooks/useMemeShare';
import MemeSignInDialog from './MemeSignInDialog';
import type { MemeItem } from '../types';

type Props = {
  item: MemeItem;
  open: boolean;
  onClose: () => void;
};

/**
 * Share a joke: members pick a chat (or copy the text); guests are asked to
 * sign in, because chats live behind an account.
 */
const ShareMemeSheet = ({ item, open, onClose }: Props) => {
  const { isMember, chats, shareToChat, copyText } = useMemeShare(onClose);

  if (!isMember) {
    return (
      <MemeSignInDialog
        open={open}
        onClose={onClose}
        title="Sign in to share"
        body="Keep the ones worth sending — drop them straight into your chats."
      />
    );
  }

  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="share-meme-title">
      <div className="px-5 pb-6 pt-2">
        <h2 id="share-meme-title" className="text-lg font-semibold text-white">
          Share to a chat
        </h2>
        <ul className="mt-3 flex max-h-80 flex-col gap-1 overflow-y-auto" aria-label="Share options">
          <li>
            <button
              type="button"
              onClick={() => copyText(item)}
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-green"
            >
              <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-base">⧉</span>
              <span className="text-sm font-medium text-body">Copy text</span>
            </button>
          </li>
          {chats.map((chat) => (
            <li key={chat._id}>
              <button
                type="button"
                onClick={() => shareToChat(item, String(chat._id))}
                className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-green"
              >
                <AvatarCard avatars={Array.isArray(chat.avatar) ? chat.avatar : chat.avatar ? [chat.avatar] : []} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-body">{chat.name}</span>
              </button>
            </li>
          ))}
        </ul>
        {chats.length === 0 && (
          <p className="mt-2 text-sm text-body-300">
            No conversations yet — vibe with someone first, then send them this.
          </p>
        )}
      </div>
    </BottomSheet>
  );
};

export default ShareMemeSheet;
