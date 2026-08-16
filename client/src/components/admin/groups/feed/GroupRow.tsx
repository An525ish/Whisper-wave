import Image from '@/components/ui/Image';
import type { AdminGroupRow } from '@/types/admin';
import { formatGroupCreated } from '@/utils/admin/groups';
import GroupAvatar from './GroupAvatar';

type GroupRowProps = {
  group: AdminGroupRow;
  onOpen: () => void;
};

const GroupRow = ({ group, onOpen }: GroupRowProps) => {
  const memberCount = group.members?.length ?? 0;
  const creatorName = group.creator?.name ?? 'Unknown';

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-primary/25"
    >
      <GroupAvatar name={group.name} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-body">{group.name ?? '—'}</span>
          <span className="rounded-full border border-blue/20 bg-blue/10 px-2 py-0.5 text-[10px] font-semibold text-blue">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-body-300/50">
          {group.bio?.trim() || `Created by ${creatorName}`}
        </p>
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-[11px] font-medium text-body-300/70">Created</p>
        <p className="mt-0.5 text-xs tabular-nums text-body-300/50">
          {formatGroupCreated(group.createdAt)}
        </p>
      </div>

      {group.creator ? (
        <div className="hidden h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-border/40 transition group-hover:ring-gold/30 md:block">
          <Image
            src={group.creator.avatar?.url}
            alt={group.creator.name ?? 'Creator'}
            className="h-full w-full object-cover"
            displayWidth={72}
          />
        </div>
      ) : null}

      <span className="shrink-0 text-body-300/25 transition group-hover:text-body-300/50">›</span>
    </button>
  );
};

export default GroupRow;
