import AvatarCard from '@/components/ui/AvatarCard';
import CheckboxIcon from '@/components/ui/icons/Checkbox';
import type { SuggestionMember } from '@/types';

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
      aria-pressed={isSelected}
      className="flex w-full items-center gap-2 rounded-2xl px-2 py-2 text-left transition hover:bg-gradient-row-hover"
      onClick={() => handleSelectMember(_id)}
    >
      <AvatarCard avatars={[avatar]} avatarClassName="shadow-none" />
      <p className="min-w-0 flex-1 truncate text-sm font-medium capitalize text-body">
        {name}
      </p>
      <CheckboxIcon
        checked={isSelected}
        className={`h-5 w-5 shrink-0 ${isSelected ? 'text-green' : 'text-body-300/70'}`}
      />
    </button>
  );
};

export default SuggestionListItem;
