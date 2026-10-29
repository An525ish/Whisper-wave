import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import RefreshIcon from '@/shared/components/ui/icons/Refresh';

type Props = {
  /** Override for pages that refresh more than their queries (Activity's live feed). */
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

/**
 * The refresh button every admin page shows beside its search bar.
 *
 * By default it refetches whatever queries the page currently has mounted
 * (`type: 'active'`), so a page needs no wiring: drop it in the header. The spinner
 * follows the real fetch state. Sized (h-10, pill, same border/fill) to sit flush
 * beside the shared `Searchbar`.
 */
const RefreshButton = ({ onRefresh, isRefreshing }: Props) => {
  const qc = useQueryClient();
  const fetching = useIsFetching() > 0;
  const busy = isRefreshing ?? fetching;

  return (
    <button
      type="button"
      onClick={onRefresh ?? (() => void qc.refetchQueries({ type: 'active' }))}
      disabled={busy}
      aria-busy={busy}
      aria-label="Refresh"
      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-black-light/35 px-4 text-sm font-medium text-body-300 transition hover:border-white/20 hover:text-body disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className={`inline-flex origin-center ${busy ? 'animate-refresh-spin' : ''} motion-reduce:animate-none`} aria-hidden>
        <RefreshIcon className="h-4 w-4 shrink-0" />
      </span>
      Refresh
    </button>
  );
};

export default RefreshButton;
