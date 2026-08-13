import type { Dispatch, SetStateAction } from 'react';
import Searchbar from '@/shared/components/Searchbar';
import AccountBar from '@/features/profile/components/AccountBar';
import { formatUnreadCount } from '@/features/chat/utils/unread';
import DotsMenu from '@/shared/components/ui/DotsMenu';
import ReadReceipt from '@/shared/components/icons/ReadReceipt';
import {
  useMarkAllChatsReadMutation,
  useMyChatsQuery,
} from '@/features/chat/hooks';
import useAsyncMutation from '@/shared/hooks/useAsyncMutation';
import { useNotificationsStore } from '@/features/notifications/store';

type ChatListHeaderProps = {
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
};

type ChatsResponse = {
  data?: Array<{ unreadCount?: number }>;
};

const ChatListHeader = ({
  searchText,
  setSearchText,
}: ChatListHeaderProps) => {
  const { data: chats } = useMyChatsQuery();
  const chatsData = (chats as ChatsResponse | undefined)?.data;
  const unreadCount =
    chatsData?.reduce((sum, chat) => sum + (chat.unreadCount ?? 0), 0) ?? 0;
  const resetMessageNotification = useNotificationsStore(
    (s) => s.resetMessageNotification,
  );
  const [markAllRead] = useAsyncMutation(useMarkAllChatsReadMutation);

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return;
    void markAllRead('Marking all as read…', undefined).then((res) => {
      if (res) resetMessageNotification();
    });
  };

  return (
    <div className="relative flex w-full flex-col gap-3 border-b border-border/50 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:border-0 md:p-2 md:pt-1">
      {/* Row 1 — title + unread; account (mobile) + menu on the far right */}
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <img
            src="/logo-4.png"
            alt=""
            className="h-9 w-9 shrink-0 object-contain md:h-12 md:w-12"
          />
          <p className="flex min-w-0 items-center gap-2 text-xl font-semibold leading-none text-white md:text-2xl">
            <span className="truncate">Messages</span>
            {unreadCount > 0 ? (
              <span
                className={`grid h-5 shrink-0 place-items-center rounded-full border border-blue-light bg-blue/20 px-1.5 text-[11px] font-medium tabular-nums text-blue ${
                  unreadCount < 10 ? 'min-w-5' : 'w-fit'
                }`}
                aria-label={`${unreadCount} unread messages`}
              >
                {formatUnreadCount(unreadCount)}
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex h-9 shrink-0 items-center gap-1.5">
          <div className="flex h-full items-center lg:hidden">
            <AccountBar variant="account" />
          </div>
          <DotsMenu
            ariaLabel="Chat list options"
            align="right"
            items={[
              {
                id: 'mark-all-read',
                label: 'Mark all as read',
                icon: <ReadReceipt read className="h-4 w-4" />,
                disabled: unreadCount === 0,
                onSelect: handleMarkAllRead,
              },
            ]}
          />
        </div>
      </div>

      {/* Row 2 — search + notifications */}
      <div className="flex w-full items-center gap-2">
        <div className="min-w-0 flex-1">
          <Searchbar
            searchText={searchText}
            setSearchText={setSearchText}
            expandable={false}
            placeholder="Search chats…"
            className="w-full"
          />
        </div>
        <div className="flex h-11 shrink-0 items-center lg:hidden">
          <AccountBar
            variant="notification"
            notificationSize="search"
            overlayClassName="fixed inset-0 z-50"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatListHeader;
