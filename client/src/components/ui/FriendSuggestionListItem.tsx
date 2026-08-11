import AvatarCard from '@/components/ui/AvatarCard';
import Button from '@/components/ui/Button';
import { useState } from 'react';
import type { User } from '@/types';

type FriendSuggestion = Pick<User, '_id' | 'name'> & {
  avatar?: string | null;
  isRequested?: boolean;
};

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
    <div className="flex gap-2 items-center px-4 rounded-lg group">
      <AvatarCard avatars={[avatar]} />
      <div className="flex-[1]">
        <div className="flex justify-between items-center">
          <p className="font-medium capitalize text-body-700">{name}</p>
          <Button
            variant={isSent ? 'primary' : 'outlineGreen'}
            className="px-4 py-0.5"
            onClick={() => handleClick(_id)}
            disabled={isSent}
          >
            {isSent ? 'Sent' : 'Add'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FriendSuggestionListItem;
