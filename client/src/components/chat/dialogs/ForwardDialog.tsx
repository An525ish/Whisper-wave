import EmptyState from '@/components/ui/EmptyState';
import ChevronLeft from '@/components/ui/icons/ChevronLeft';
import AvatarSkeleton from '@/components/ui/skeletons/AvatarSkeleton';
import AvatarCard from '@/components/ui/AvatarCard';
import CheckboxIcon from '@/components/ui/icons/Checkbox';
import ChatIcon from '@/components/ui/icons/Chat';
import MembersIcon from '@/components/ui/icons/Members';
import ForwardIcon from '@/components/ui/icons/Forward';
import { useMyChatsQuery } from '@/hooks/chat';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ChatsResponse } from '@/types/chat';

type ForwardDialogProps = {
  open: boolean;
  sourceChatId: string;
  messageIds: string[];
  onClose: () => void;
  onForward: (targetChatIds: string[]) => void | Promise<void>;
  isForwarding?: boolean;
};

const SearchGlyph = ({ className = 'h-3.5 w-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="m16.2 16.2 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const ForwardDialog = ({
  open,
  sourceChatId,
  messageIds,
  onClose,
  onForward,
  isForwarding = false,
}: ForwardDialogProps) => {
  const [searchText, setSearchText] = useState('');
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [entered, setEntered] = useState(false);
  const { data, isLoading } = useMyChatsQuery();
  const chats = ((data as ChatsResponse | undefined)?.data ?? []).filter(
    (chat) => chat._id !== sourceChatId,
  );

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((chat) => chat.name.toLowerCase().includes(q));
  }, [chats, searchText]);

  useEffect(() => {
    if (!open) {
      setSearchText('');
      setSelectedChatIds([]);
      setEntered(false);
      return;
    }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  const handleSelectChat = (id: string) => {
    setSelectedChatIds((prev) =>
      prev.includes(id) ? prev.filter((el) => el !== id) : [...prev, id],
    );
  };

  if (!open) return null;

  const messageCountLabel =
    messageIds.length === 1 ? '1 message' : `${messageIds.length} messages`;
  const selectedCount = selectedChatIds.length;
  const forwardLabel = isForwarding
    ? 'Sending…'
    : selectedCount === 0
      ? 'Select a chat'
      : selectedCount === 1
        ? 'Forward'
        : `Forward to ${selectedCount}`;

  return createPortal(
    <div
      className="fixed inset-0 z-80 flex items-end justify-center p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forward-title"
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/55 backdrop-blur-[6px] transition-opacity duration-300 motion-reduce:transition-none ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Close forward dialog"
        onClick={onClose}
      />
      <div
        className={`relative z-10 flex h-[min(760px,calc(100dvh-1.5rem))] w-full max-w-110 flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/95 shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          entered
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-6 scale-[0.98] opacity-0 sm:translate-y-0'
        }`}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-24 bg-[radial-gradient(ellipse_at_top,rgba(1,195,109,0.14),transparent_70%)]" />
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-border/80 sm:hidden" />

        <header className="relative shrink-0 px-4 pb-3 pt-3 sm:px-5 sm:pt-4">
          <div className="mb-3.5 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/12 bg-white/6 text-body transition hover:border-green/40 hover:bg-green/10 hover:text-green"
              aria-label="Close"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2
                  id="forward-title"
                  className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl"
                >
                  Forward
                </h2>
                <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-green/15 px-2 text-[11px] font-semibold tabular-nums text-green ring-1 ring-inset ring-green/25">
                  {messageCountLabel}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-body-300 sm:text-sm">
                {selectedCount > 0
                  ? `${selectedCount} chat${selectedCount === 1 ? '' : 's'} selected`
                  : 'Pick one or more chats'}
              </p>
            </div>
          </div>

          <div className="group/search relative flex h-10 items-center gap-2.5 rounded-full border border-white/10 bg-black-light/35 px-3 transition focus-within:border-green/35 focus-within:bg-background/80 focus-within:shadow-[0_0_18px_rgba(1,195,109,0.08)]">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-body-300 transition group-focus-within/search:text-green">
              <SearchGlyph />
            </span>
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Find a chat…"
              className="min-w-0 flex-1 border-0 bg-transparent py-0 text-sm text-body placeholder:text-body-300/80 outline-none [&::-ms-clear]:hidden [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              aria-label="Filter chats"
            />
          </div>
        </header>

        <div className="mx-4 h-px shrink-0 bg-border/60 sm:mx-5" />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2 scrollbar-hide sm:px-4">
          {isLoading ? (
            <div className="space-y-1">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <AvatarSkeleton
                    key={i}
                    className="h-16 rounded-2xl bg-transparent px-2"
                  />
                ))}
            </div>
          ) : chats.length === 0 ? (
            <EmptyState
              className="h-full min-h-48"
              imageSrc="/images/no-member.svg"
              imageAlt="no chats"
              imageClassName="mx-auto w-36 opacity-40 sm:w-44"
              titleClassName="mt-4 max-w-64 text-center text-base font-medium text-body-300"
              title="No other chats to forward to"
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              className="h-full min-h-48"
              imageSrc="/images/no-member.svg"
              imageAlt="no chats"
              imageClassName="mx-auto w-36 opacity-40 sm:w-44"
              titleClassName="mt-4 max-w-64 text-center text-base font-medium text-body-300"
              title="No chats match your search"
            />
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map((chat) => {
                const selected = selectedChatIds.includes(chat._id);
                const avatars = Array.isArray(chat.avatar)
                  ? chat.avatar
                  : chat.avatar
                    ? [chat.avatar]
                    : [];

                return (
                  <button
                    key={chat._id}
                    type="button"
                    onClick={() => handleSelectChat(chat._id)}
                    aria-pressed={selected}
                    className={`flex w-full items-center gap-2 rounded-2xl px-2 py-2 text-left transition ${
                      selected
                        ? 'bg-green/10 ring-1 ring-inset ring-green/25'
                        : 'hover:bg-white/4'
                    }`}
                  >
                    <AvatarCard avatars={avatars} avatarClassName="shadow-none" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium capitalize text-body">
                        {chat.name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-body-300">
                        {chat.groupChat ? (
                          <MembersIcon className="h-3.5 w-3.5 fill-current" />
                        ) : (
                          <ChatIcon className="h-3.5 w-3.5" />
                        )}
                        {chat.groupChat ? 'Group' : 'Chat'}
                      </p>
                    </div>
                    <CheckboxIcon
                      checked={selected}
                      className={`h-5 w-5 shrink-0 ${selected ? 'text-green' : 'text-body-300/70'}`}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border/50 bg-background/80 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          <button
            type="button"
            disabled={selectedCount === 0 || isForwarding}
            onClick={() => void onForward(selectedChatIds)}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-green text-sm font-semibold text-white shadow-[0_10px_24px_rgba(1,195,109,0.28)] transition enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ForwardIcon className="h-4 w-4" />
            {forwardLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ForwardDialog;
