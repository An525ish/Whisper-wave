import { useState } from 'react';
import ChatHeader from './ChatListHeader';
import ChatTabView from './ChatTabView';
import AddMemberIcon from '@/components/icons/AddMember';
import AddFriendsDialog from './addFriendsPanel/AddFriendsDialog';
import GroupChatDialog from './createGroupPanel/CreateGroupDialog';

const ChatListPanel = () => {
  const [searchText, setSearchText] = useState('');
  const [isClicked, setIsClicked] = useState(false);
  const [isCreateGroup, setIsCreateGroup] = useState(false);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0">
        <ChatHeader
          searchText={searchText}
          setSearchText={setSearchText}
          onCreateGroup={() => setIsCreateGroup(true)}
        />
      </div>

      {isClicked ? (
        <div className="relative mt-3 min-h-0 flex-1">
          <AddFriendsDialog isOpen={isClicked} setIsClicked={setIsClicked} />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <ChatTabView searchText={searchText} />
        </div>
      )}

      {!isClicked && !isCreateGroup ? (
        <button
          type="button"
          className="group absolute bottom-7 right-6 rounded-full border border-border bg-gradient-background p-3 transition hover:border-green-light"
          onClick={() => setIsClicked((prev) => !prev)}
          aria-label="Add friends"
        >
          <AddMemberIcon className="h-8 w-8 fill-green transition group-hover:fill-green" />
        </button>
      ) : null}

      {isCreateGroup ? (
        <GroupChatDialog
          isCreateGroup={isCreateGroup}
          setIsCreateGroup={setIsCreateGroup}
        />
      ) : null}
    </div>
  );
};

export default ChatListPanel;
