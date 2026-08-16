import Image from '@/components/ui/Image';
import type { AdminUserRow } from '@/types/admin';
import { formatUserJoined, userRowSubtitle } from '@/utils/admin/users';

type UserRowProps = {
  user: AdminUserRow;
  onOpen: () => void;
};

const UserRow = ({ user, onOpen }: UserRowProps) => (
  <button
    type="button"
    onClick={onOpen}
    className="group flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-primary/25"
  >
    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-border/40 transition group-hover:ring-blue/30">
      <Image
        src={user.avatar?.url}
        alt={user.name ?? 'User'}
        className="h-full w-full object-cover"
        displayWidth={96}
      />
    </div>

    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-sm font-semibold text-body">{user.name ?? '—'}</span>
        <span className="text-xs text-body-300/55">@{user.username ?? '—'}</span>
      </div>
      <p className="mt-0.5 line-clamp-1 text-xs text-body-300/50">{userRowSubtitle(user)}</p>
    </div>

    <div className="hidden shrink-0 text-right sm:block">
      <p className="text-[11px] font-medium text-body-300/70">Joined</p>
      <p className="mt-0.5 text-xs tabular-nums text-body-300/50">
        {formatUserJoined(user.createdAt)}
      </p>
    </div>

    <span className="shrink-0 text-body-300/25 transition group-hover:text-body-300/50">›</span>
  </button>
);

export default UserRow;
