import RefreshIcon from '@/components/ui/icons/Refresh';
import LiveDot from '../presence/LiveDot';
import { formatPresenceUpdated } from '@/utils/admin/activity';

type ActivityHeaderProps = {
  presenceUpdatedAt: number;
  isRefetching: boolean;
  onRefresh: () => void;
};

const ActivityHeader = ({ presenceUpdatedAt, isRefetching, onRefresh }: ActivityHeaderProps) => (
  <header className="shrink-0 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue">Console</p>
      <h1 className="mt-1 font-display text-3xl leading-none tracking-tight text-body sm:text-4xl">
        Activity
      </h1>
      <p className="mt-2 text-sm text-body-300">Live presence and paginated event history</p>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      {presenceUpdatedAt > 0 && (
        <div className="flex items-center gap-2 text-xs text-body-300/50">
          <LiveDot className="h-1.5 w-1.5" />
          <span>Presence · {formatPresenceUpdated(presenceUpdatedAt)}</span>
        </div>
      )}
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefetching}
        aria-busy={isRefetching}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-body-300/55 transition hover:bg-primary/25 hover:text-body-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span
          className={`inline-flex origin-center ${isRefetching ? 'animate-refresh-spin' : ''} motion-reduce:animate-none`}
          aria-hidden
        >
          <RefreshIcon className="h-3.5 w-3.5 shrink-0" />
        </span>
        Refresh
      </button>
    </div>
  </header>
);

export default ActivityHeader;
