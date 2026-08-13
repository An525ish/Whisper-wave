import EmptyState from '@/shared/components/ui/EmptyState';
import SuggestionListItem from '@/shared/components/ui/SuggestionListItem';
import ChevronLeft from '@/shared/components/icons/ChevronLeft';
import AvatarSkeleton from '@/shared/components/skeletons/AvatarSkeleton';
import Searchbar from '@/shared/components/Searchbar';
import { useMyChatsQuery } from '@/features/chat/hooks';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type ChatRow = {
  _id: string;
  name: string;
  avatar?: string | string[];
  groupChat?: boolean;
};

type ChatsResponse = {
  data?: ChatRow[];
};

type ForwardDialogProps = {
  open: boolean;
  sourceChatId: string;
  messageIds: string[];
  onClose: () => void;
  onForward: (targetChatIds: string[]) => void | Promise<void>;
  isForwarding?: boolean;
};

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
    }
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
    ? 'Forwarding…'
    : selectedCount === 0
      ? 'Forward'
      : selectedCount === 1
        ? 'Forward to 1 chat'
        : `Forward to ${selectedCount} chats`;

  return createPortal(
    <div
      className="fixed inset-0 z-80 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Forward messages"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Close forward dialog"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex h-[min(92vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-background/95 shadow-2xl backdrop-blur-2xl sm:h-[min(85vh,36rem)] sm:rounded-2xl"
      >
        <header className="shrink-0 px-3 pb-4 pt-2 sm:px-5">
          <div className="mb-4 flex items-start gap-1">
            <button
              type="button"
              onClick={onClose}
              className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full transition active:bg-primary/70"
              aria-label="Close"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1 pt-1.5">
              <h2 className="truncate text-[1.35rem] font-semibold leading-tight tracking-tight text-white">
                Forward
              </h2>
              <p className="mt-1 text-sm leading-snug text-body-300">
                Choose chats to send {messageCountLabel}
              </p>
            </div>
          </div>
        </header>

        <div className="mx-3 h-px shrink-0 bg-border/70 sm:mx-5" />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-4 sm:px-5">
          <div className="shrink-0 px-1">
            <Searchbar
              searchText={searchText}
              setSearchText={setSearchText}
              expandable={false}
              variant="line"
              placeholder="Filter chats…"
              className="w-full"
            />
          </div>

          <div className="mt-5 flex min-h-0 flex-1 flex-col">
            <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-body-300">
                Select chats
              </p>
              <span className="min-w-26 text-right text-xs tabular-nums text-body-300">
                {selectedCount > 0
                  ? `${selectedCount} selected`
                  : 'Pick one or more'}
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
              {isLoading ? (
                <div className="space-y-1 px-1">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <AvatarSkeleton
                        key={i}
                        className="h-16 rounded-lg bg-transparent px-2"
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
                <div className="flex flex-col gap-0.5 px-1">
                  {filtered.map((chat) => {
                    const avatar =
                      Array.isArray(chat.avatar)
                        ? chat.avatar[0]
                        : chat.avatar ?? null;

                    return (
                      <SuggestionListItem
                        key={chat._id}
                        data={{
                          _id: chat._id,
                          name: chat.groupChat
                            ? `${chat.name} (Group)`
                            : chat.name,
                          avatar,
                        }}
                        isSelected={selectedChatIds.includes(chat._id)}
                        handleSelectMember={handleSelectChat}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 pt-3">
            <button
              type="button"
              disabled={selectedCount === 0 || isForwarding}
              onClick={() => void onForward(selectedChatIds)}
              className="h-12 w-full rounded-xl bg-gradient-green text-sm font-semibold text-white shadow-md transition enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {forwardLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ForwardDialog;
