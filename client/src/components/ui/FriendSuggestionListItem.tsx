import AvatarCard from '@/components/ui/AvatarCard';
import Button from '@/components/ui/Button';
import { useState } from 'react';
import type { FriendSuggestion } from '@/types';


type FriendSuggestionListItemProps = {
  data: FriendSuggestion;
  handleAddFriend: (id: string) => void;
};

const FriendSuggestionListItem = ({
  data,
  handleAddFriend,
}: FriendSuggestionListItemProps) => {
  const { avatar, name, _id, isRequested } = data;
  const [isSent, setIsSent] = useState(isRequested);

  const handleClick = (id: string) => {
    setIsSent(true);
    handleAddFriend(id);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-2.5 transition hover:bg-background/50">
      <AvatarCard avatars={[avatar]} />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <p className="truncate font-medium capitalize text-body">{name}</p>
        <Button
          variant={isSent ? 'primary' : 'outlineGreen'}
          className="shrink-0 px-3 py-1.5 text-sm"
          onClick={() => handleClick(_id)}
          disabled={isSent}
        >
          {isSent ? 'Sent' : 'Add'}
        </Button>
      </div>
    </div>
  );
};

export default FriendSuggestionListItem;
