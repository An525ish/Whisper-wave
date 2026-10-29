import RefreshButton from '../../shared/RefreshButton';
import LiveDot from '../presence/LiveDot';
import { formatPresenceUpdated } from '../../../utils/activity';

type Props = {
  presenceUpdatedAt: number;
  isRefetching: boolean;
  onRefresh: () => void;
};

const ActivityHeader = ({ presenceUpdatedAt, isRefetching, onRefresh }: Props) => (
  <header className="shrink-0 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue">Console</p>
      <h1 className="mt-1 font-semibold text-3xl leading-none tracking-tight text-body sm:text-4xl">
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
      <RefreshButton onRefresh={onRefresh} isRefreshing={isRefetching} />
    </div>
  </header>
);

export default ActivityHeader;
