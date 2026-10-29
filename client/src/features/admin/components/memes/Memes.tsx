import RefreshButton from '../shared/RefreshButton';
import { useMemesPage } from '../../hooks/useMemesPage';
import MemeBlockForm from './MemeBlockForm';
import MemeBlockList from './MemeBlockList';

/**
 * Memes blocklist: provider joke ids hidden from every batch. Heavily reported
 * jokes auto-block; admins can block an id by hand or lift a block (which also
 * resets its report count).
 */
const Memes = () => {
  const {
    items,
    blockedCount,
    reportedCount,
    isLoading,
    isError,
    refetch,
    blocking,
    unblockingId,
    blockId,
    unblockId,
  } = useMemesPage();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue">Console</p>
          <h1 className="mt-1 font-semibold text-3xl leading-none tracking-tight text-body sm:text-4xl">Memes</h1>
          <p className="mt-2 text-sm text-body-300">Blocklist and report counts for provider jokes</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!isLoading && !isError && (
            <p className="text-sm text-body-300" aria-live="polite">
              <span className="font-semibold tabular-nums text-red">{blockedCount}</span> blocked ·{' '}
              <span className="font-semibold tabular-nums text-body">{reportedCount}</span> watching
            </p>
          )}
          <RefreshButton />
        </div>
      </header>

      <MemeBlockForm busy={blocking} onBlock={blockId} />

      {isLoading && (
        <div aria-label="Loading blocklist" className="h-40 animate-pulse rounded-2xl bg-white/5 motion-reduce:animate-none" />
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm font-medium text-body">Couldn&apos;t load the blocklist</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-full border border-border/50 bg-primary/35 px-4 py-2 text-xs font-semibold text-body-300 hover:text-body"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <p className="py-10 text-center text-sm text-body-700">Nothing reported or blocked yet.</p>
      )}

      {items.length > 0 && <MemeBlockList items={items} unblockingId={unblockingId} onUnblock={(id) => void unblockId(id)} />}
    </div>
  );
};

export default Memes;
