import AvatarCard from '@/components/ui/AvatarCard';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    setIsSent(isRequested);
  }, [isRequested]);

  const handleClick = (id: string) => {
    setIsSent(true);
    handleAddFriend(id);
  };

  return (
    <div className="flex items-center gap-2 rounded-2xl px-2 py-2 transition hover:bg-gradient-row-hover">
      <AvatarCard avatars={[avatar]} avatarClassName="shadow-none" />
      <p className="min-w-0 flex-1 truncate text-sm font-medium capitalize text-body">
        {name}
      </p>
      <button
        type="button"
        onClick={() => handleClick(_id)}
        disabled={isSent}
        className={`inline-flex h-8 shrink-0 items-center justify-center rounded-full px-3.5 text-[12px] font-semibold transition ${
          isSent
            ? 'bg-gradient-green text-white'
            : 'bg-green/10 text-green ring-1 ring-inset ring-green/30 hover:bg-green/20 enabled:active:scale-[0.98]'
        } disabled:cursor-default`}
      >
        {isSent ? 'Sent' : 'Add'}
      </button>
    </div>
  );
};

export default FriendSuggestionListItem;
