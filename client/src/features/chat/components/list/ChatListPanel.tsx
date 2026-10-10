import { useCallback, useState } from 'react';
import ChatHeader from '@/features/chat/components/list/ChatListHeader';
import ChatTabView from '@/features/chat/components/list/ChatTabView';
import { PendingGhostRows } from '@/features/whisper';
import AddMemberIcon from '@/shared/components/ui/icons/AddMember';
import NewConnectDialog, { type NewConnectTab } from '@/features/chat/components/dialogs/NewConnectDialog';

const ChatListPanel = () => {
  const [searchText, setSearchText] = useState('');
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newTab, setNewTab] = useState<NewConnectTab>('friends');

  const openNew = useCallback((tab: NewConnectTab) => {
    setNewTab(tab);
    setIsNewOpen(true);
  }, []);

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
        <PendingGhostRows />
        <ChatTabView searchText={searchText} />
      </div>

      {!isNewOpen ? (
        <button
          type="button"
          className="group absolute bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.75rem))] right-4 z-20 grid h-auto w-auto place-items-center rounded-full border border-border bg-gradient-background p-3 shadow-none transition active:scale-95 md:bottom-7 md:right-6"
          onClick={() => openNew('friends')}
          aria-label="Add friends or create group"
        >
          <AddMemberIcon className="h-8 w-8 fill-green transition" />
        </button>
      ) : null}

      {isNewOpen ? (
        <NewConnectDialog
          isOpen={isNewOpen}
          initialTab={newTab}
          onClose={() => setIsNewOpen(false)}
        />
      ) : null}
    </div>
  );
};

export default ChatListPanel;
