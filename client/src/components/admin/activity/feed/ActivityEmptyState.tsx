import { ACTIVITY_EMPTY_IMAGE } from '@/constants/admin/activity';
import type { AdminActivityFilter } from '@/types/admin';

type ActivityEmptyStateProps = {
  filter: AdminActivityFilter;
};

const ActivityEmptyState = ({ filter }: ActivityEmptyStateProps) => (
  <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
    <img src={ACTIVITY_EMPTY_IMAGE} alt="" className="h-24 w-24 opacity-40" aria-hidden />
    <div>
      <p className="text-sm font-medium text-body">No activity yet</p>
      <p className="mt-1 text-xs text-body-300/60">
        {filter === 'all'
          ? 'Messages and signups will show up here'
          : `No ${filter} in the recent feed`}
      </p>
    </div>
  </div>
);

export default ActivityEmptyState;
