import type { Dispatch, SetStateAction } from 'react';
import Searchbar from '../Searchbar';
import CreateGroupIcon from '@/components/icons/CreateGroup';
import { useNotificationsStore } from '@/stores/notifications';

type ChatListHeaderProps = {
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
  onCreateGroup: () => void;
};

const ChatHeader = ({
  searchText,
  setSearchText,
  onCreateGroup,
}: ChatListHeaderProps) => {
  const messageNotifications = useNotificationsStore(
    (s) => s.messageNotifications,
  );

  return (
    <div className="flex w-full items-center justify-between p-2">
      <p className="flex items-center gap-2 text-2xl font-semibold text-white">
        <img src="/logo-4.png" alt="icon" className="w-12" />
        Messages
        {messageNotifications.length > 0 ? (
          <span
            className={`grid h-6 place-items-center rounded-full border border-red-light bg-red-dark px-1 py-0.5 text-center text-xs font-normal text-red ${
              messageNotifications.length < 9 ? 'w-6' : 'w-fit'
            }`}
          >
            {messageNotifications.length > 99
              ? '99+'
              : messageNotifications.length}
          </span>
        ) : null}
      </p>

      <div className="flex items-center gap-4">
        <div className="cursor-pointer">
          <Searchbar searchText={searchText} setSearchText={setSearchText} />
        </div>
        <button
          type="button"
          className="z-20 cursor-pointer"
          onClick={onCreateGroup}
          aria-label="Create group"
        >
          <CreateGroupIcon className={'w-6 fill-white'} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
