import AvatarCard from '@/components/ui/AvatarCard';
import type { FriendSuggestion } from '@/types';

type FriendSuggestionListItemProps = {
  data: FriendSuggestion;
  isSending?: boolean;
  handleAddFriend: (id: string) => void;
};

const FriendSuggestionListItem = ({
  data,
  isSending = false,
  handleAddFriend,
}: FriendSuggestionListItemProps) => {
  const { avatar, name, _id, isRequested } = data;
  const disabled = isRequested || isSending;

  return (
    <div className="flex items-center gap-2 rounded-2xl px-2 py-2 transition hover:bg-gradient-row-hover">
      <AvatarCard avatars={[avatar]} avatarClassName="shadow-none" />
      <p className="min-w-0 flex-1 truncate text-sm font-medium capitalize text-body">
        {name}
      </p>
      <button
        type="button"
        onClick={() => handleAddFriend(_id)}
        disabled={disabled}
        aria-busy={isSending}
        className={`relative inline-flex h-8 shrink-0 items-center justify-center rounded-full px-3.5 text-[12px] font-semibold transition ${
          isRequested
            ? 'bg-gradient-green text-white'
            : isSending
              ? 'bg-green/10 text-green/60 ring-1 ring-inset ring-green/20'
              : 'bg-green/10 text-green ring-1 ring-inset ring-green/30 hover:bg-green/20 enabled:active:scale-[0.98]'
        } disabled:cursor-default`}
      >
        {isSending ? (
          <>
            <span className="invisible select-none" aria-hidden>
              Add
            </span>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </span>
          </>
        ) : isRequested ? (
          'Sent'
        ) : (
          'Add'
        )}
      </button>
    </div>
  );
};

export default FriendSuggestionListItem;
