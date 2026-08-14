import type { Dispatch, SetStateAction } from 'react';
import Searchbar from '@/components/ui/Searchbar';
import AccountBar from '@/components/profile/AccountBar';
import DotsMenu from '@/components/ui/DotsMenu';
import ReadReceipt from '@/components/ui/icons/ReadReceipt';
import AddMemberIcon from '@/components/ui/icons/AddMember';
import CreateGroupIcon from '@/components/ui/icons/CreateGroup';
import {
  useMarkAllChatsReadMutation,
  useMyChatsQuery,
} from '@/hooks/chat';
import useAsyncMutation from '@/hooks/shared/useAsyncMutation';
import { useNotificationsStore } from '@/stores/notifications';
import type { NewConnectTab, ChatsResponse } from '@/types/chat';

type ChatListHeaderProps = {
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
  onOpenNew?: (tab: NewConnectTab) => void;
};

const ChatListHeader = ({
  searchText,
  setSearchText,
  onOpenNew,
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
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <img
            src="/logo-4.png"
            alt=""
            className="h-9 w-9 shrink-0 object-contain md:h-12 md:w-12"
          />
          <p className="min-w-0 truncate text-xl font-semibold leading-none text-white md:text-2xl">
            Messages
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
                tone: 'accent',
                icon: <ReadReceipt read className="h-3.5 w-3.5" />,
                disabled: unreadCount === 0,
                onSelect: handleMarkAllRead,
              },
              {
                id: 'add-friends',
                label: 'Add friends',
                dividerBefore: true,
                icon: <AddMemberIcon className="h-3.5 w-3.5 fill-current" />,
                onSelect: () => onOpenNew?.('friends'),
              },
              {
                id: 'create-group',
                label: 'Create group',
                icon: <CreateGroupIcon className="h-3.5 w-3.5 fill-current" />,
                onSelect: () => onOpenNew?.('group'),
              },
            ]}
          />
        </div>
      </div>

      <div className="mt-3 flex w-full items-center gap-2 md:mt-0">
        <div className="min-w-0 flex-1">
          <Searchbar
            searchText={searchText}
            setSearchText={setSearchText}
            expandable={false}
            variant="pill"
            placeholder="Search chats…"
            className="w-full"
          />
        </div>
        <div className="flex h-10 shrink-0 items-center lg:hidden">
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
