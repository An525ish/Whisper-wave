import AvatarCard from '@/shared/components/ui/AvatarCard';
import type { User } from '@/shared/types';

type SuggestionMember = Pick<User, '_id' | 'name'> & {
  avatar?: string | null;
};

type SuggestionListItemProps = {
  data: SuggestionMember;
  isSelected: boolean;
  handleSelectMember: (id: string) => void;
};

/** Selectable member row (create group / add member). */
const SuggestionListItem = ({
  data,
  isSelected,
  handleSelectMember,
}: SuggestionListItemProps) => {
  const { avatar, name, _id } = data;
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left transition hover:bg-background/50"
      onClick={() => handleSelectMember(_id)}
    >
      <AvatarCard avatars={[avatar]} />

      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <p className="truncate font-medium capitalize text-body">{name}</p>
        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-xs ${
            isSelected
              ? 'border-green bg-green text-white'
              : 'border-border text-transparent'
          }`}
          aria-hidden
        >
          ✓
        </span>
      </div>
    </button>
  );
};

export default SuggestionListItem;
