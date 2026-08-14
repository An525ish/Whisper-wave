import { useState } from 'react';
import ChatHeader from '@/components/chat/list/ChatListHeader';
import ChatTabView from '@/components/chat/list/ChatTabView';
import AddMemberIcon from '@/components/ui/icons/AddMember';
import NewConnectDialog, { type NewConnectTab } from '@/components/chat/dialogs/NewConnectDialog';

const ChatListPanel = () => {
  const [searchText, setSearchText] = useState('');
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newTab, setNewTab] = useState<NewConnectTab>('friends');

  const openNew = (tab: NewConnectTab) => {
    setNewTab(tab);
    setIsNewOpen(true);
  };

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0">
        <ChatHeader
          searchText={searchText}
          setSearchText={setSearchText}
          onOpenNew={openNew}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <ChatTabView searchText={searchText} />
      </div>

      {!isNewOpen ? (
        <button
          type="button"
          className="group absolute bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.75rem))] right-4 z-20 grid h-14 w-14 place-items-center rounded-full border border-green-light/40 bg-gradient-green shadow-lg shadow-green/20 transition active:scale-95 md:bottom-7 md:right-6 md:h-auto md:w-auto md:border-border md:bg-gradient-background md:p-3 md:shadow-none"
          onClick={() => openNew('friends')}
          aria-label="Add friends or create group"
        >
          <AddMemberIcon className="h-7 w-7 fill-white transition md:h-8 md:w-8 md:fill-green" />
        </button>
      ) : null}

      {isNewOpen ? (
        <div className="absolute inset-0 z-30">
          <NewConnectDialog
            isOpen={isNewOpen}
            initialTab={newTab}
            onClose={() => setIsNewOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
};

export default ChatListPanel;
