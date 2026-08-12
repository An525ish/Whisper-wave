import type { Dispatch, SetStateAction } from 'react';
import Searchbar from '../Searchbar';
import { useNotificationsStore } from '@/stores/notifications';
import AccountBar from '@/shared/profilePanel/AccountBar';
import { formatUnreadCount } from '@/utils/unread';

type ChatListHeaderProps = {
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
};

const ChatListHeader = ({
  searchText,
  setSearchText,
}: ChatListHeaderProps) => {
  const unreadCount = useNotificationsStore((s) => s.messageNotificationCount);

  return (
    <div className="relative flex w-full flex-col gap-3 border-b border-border/50 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:border-0 md:p-2 md:pt-1">
      {/* Row 1 — title + unread + account */}
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

        <div className="lg:hidden">
          <AccountBar variant="account" />
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
        <div className="shrink-0 lg:hidden">
          <AccountBar
            variant="notification"
            overlayClassName="fixed inset-0 z-50"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatListHeader;
