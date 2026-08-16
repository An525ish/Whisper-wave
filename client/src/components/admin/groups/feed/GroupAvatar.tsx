type GroupAvatarProps = {
  name?: string;
};

const GroupAvatar = ({ name }: GroupAvatarProps) => (
  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-gold/25 to-gold/5 ring-2 ring-gold/20">
    <span className="font-display text-sm font-bold text-gold">
      {(name?.trim()?.[0] ?? 'G').toUpperCase()}
    </span>
  </div>
);

export default GroupAvatar;
